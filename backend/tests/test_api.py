from __future__ import annotations

import json
import os
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path

from websockets.sync.client import connect


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


class EventCaptureApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.temp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        cls.port = free_port()
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        env = os.environ.copy()
        env["EVENTCAPTURE_DATABASE_PATH"] = str(Path(cls.temp_dir.name) / "test-eventcapture.db")
        env["EVENTCAPTURE_ALLOW_INSECURE_PASSWORD_RESET"] = "true"
        env["EVENTCAPTURE_PORT"] = str(cls.port)

        cls.server = subprocess.Popen(
            [
                str(Path("backend/.venv/Scripts/python.exe")),
                "-m",
                "uvicorn",
                "backend.app:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(cls.port),
            ],
            cwd=Path(__file__).resolve().parents[2],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        deadline = time.time() + 60
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(f"{cls.base_url}/health", timeout=2) as response:
                    if response.status == 200:
                        return
            except Exception:
                time.sleep(1)

        raise RuntimeError("Backend test server did not become healthy in time.")

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.terminate()
        try:
            cls.server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            cls.server.kill()
        time.sleep(1)
        cls.temp_dir.cleanup()

    def api_request(self, method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, object]:
        headers = {"Accept": "application/json"}
        payload = None
        if body is not None:
            payload = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if token:
            headers["Authorization"] = f"Bearer {token}"

        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=payload,
            headers=headers,
            method=method,
        )

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                content = response.read().decode("utf-8")
                return response.status, json.loads(content) if content else {}
        except urllib.error.HTTPError as error:
            content = error.read().decode("utf-8")
            return error.code, json.loads(content) if content else {}

    def websocket_url(self, path: str, token: str | None = None) -> str:
        suffix = f"{path}?token={token}" if token else path
        return f"ws://127.0.0.1:{self.port}{suffix}"

    def multipart_request(
        self,
        method: str,
        path: str,
        fields: dict[str, str],
        files: dict[str, tuple[str, bytes, str]],
        token: str | None = None,
    ) -> tuple[int, object]:
        boundary = "----EventCaptureTestBoundary7MA4YWxkTrZu0gW"
        chunks: list[bytes] = []

        for key, value in fields.items():
            chunks.extend(
                [
                    f"--{boundary}\r\n".encode("utf-8"),
                    f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"),
                    value.encode("utf-8"),
                    b"\r\n",
                ]
            )

        for key, (filename, content, content_type) in files.items():
            chunks.extend(
                [
                    f"--{boundary}\r\n".encode("utf-8"),
                    (
                        f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'
                        f"Content-Type: {content_type}\r\n\r\n"
                    ).encode("utf-8"),
                    content,
                    b"\r\n",
                ]
            )

        chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
        payload = b"".join(chunks)
        headers = {
            "Accept": "application/json",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=payload,
            headers=headers,
            method=method,
        )

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                content = response.read().decode("utf-8")
                return response.status, json.loads(content) if content else {}
        except urllib.error.HTTPError as error:
            content = error.read().decode("utf-8")
            return error.code, json.loads(content) if content else {}

    def register_and_login(self, email: str, username: str, password: str = "Password123!") -> dict[str, str]:
        status, payload = self.api_request(
            "POST",
            "/api/auth/register",
            {
                "email": email,
                "username": username,
                "password": password,
                "full_name": username.title(),
                "city": "Brussels",
                "bio": "Seeded by tests.",
                "avatar_uri": "https://example.com/avatar.jpg",
            },
        )
        self.assertIn(status, {200, 201}, payload)
        return {"token": payload["token"], "user_id": payload["user"]["id"]}

    def test_register_login_and_restore_session(self):
        session = self.register_and_login("alice@example.com", "alice")

        status, payload = self.api_request("GET", "/api/auth/me", token=session["token"])
        self.assertEqual(status, 200, payload)
        self.assertEqual(payload["email"], "alice@example.com")

        status, _ = self.api_request("POST", "/api/auth/logout", body={}, token=session["token"])
        self.assertEqual(status, 200)

        status, _ = self.api_request("GET", "/api/auth/me", token=session["token"])
        self.assertEqual(status, 401)

    def test_json_profile_update_and_multipart_register_avatar(self):
        session = self.register_and_login("json-profile@example.com", "jsonprofile")

        status, payload = self.api_request(
            "PUT",
            "/api/users/me",
            {
                "full_name": "Json Profile Updated",
                "city": "Antwerp",
                "bio": "Updated over JSON.",
                "avatar_uri": "https://example.com/updated-avatar.jpg",
            },
            token=session["token"],
        )
        self.assertEqual(status, 200, payload)
        self.assertEqual(payload["full_name"], "Json Profile Updated")
        self.assertEqual(payload["city"], "Antwerp")
        self.assertEqual(payload["bio"], "Updated over JSON.")
        self.assertEqual(payload["avatar_uri"], "https://example.com/updated-avatar.jpg")

        png_bytes = (
            b"\x89PNG\r\n\x1a\n"
            b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
            b"\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfeA\xd9\xa3\x1f"
            b"\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        status, payload = self.multipart_request(
            "POST",
            "/api/auth/register",
            {
                "email": "multipart-avatar@example.com",
                "username": "multipartavatar",
                "password": "Password123!",
                "full_name": "Multipart Avatar",
                "city": "Brussels",
                "bio": "Avatar upload validation.",
            },
            {"avatar_file": ("avatar.png", png_bytes, "image/png")},
        )
        self.assertEqual(status, 200, payload)
        self.assertIn("/media/avatars/", payload["user"]["avatar_uri"])

    def test_password_reset_support_rewards_and_notifications(self):
        owner = self.register_and_login("reward-owner@example.com", "rewardowner")
        other = self.register_and_login("reward-other@example.com", "rewardother")

        status, payload = self.api_request(
            "POST",
            "/api/auth/reset-password/request",
            {"email": "reward-owner@example.com"},
        )
        self.assertEqual(status, 200, payload)
        self.assertIn("message", payload)
        self.assertTrue(payload.get("reset_token"))
        reset_token = payload["reset_token"]

        status, payload = self.api_request(
            "POST",
            "/api/auth/reset-password/request",
            {"email": "missing-account@example.com"},
        )
        self.assertEqual(status, 200, payload)
        self.assertIn("message", payload)
        self.assertFalse(payload.get("reset_token"))
        status, payload = self.api_request(
            "POST",
            "/api/auth/reset-password/confirm",
            {"token": reset_token, "new_password": "NewPassword123!"},
        )
        self.assertEqual(status, 200, payload)

        status, _ = self.api_request(
            "POST",
            "/api/auth/login",
            {"email": "reward-owner@example.com", "password": "Password123!"},
        )
        self.assertEqual(status, 401)

        status, payload = self.api_request(
            "POST",
            "/api/auth/login",
            {"email": "reward-owner@example.com", "password": "NewPassword123!"},
        )
        self.assertEqual(status, 200, payload)
        owner = {"token": payload["token"], "user_id": payload["user"]["id"]}

        status, support_payload = self.api_request(
            "POST",
            "/api/support/contact",
            {"subject": "Help needed", "message": "The camera upload was slow in my test session."},
            token=owner["token"],
        )
        self.assertEqual(status, 200, support_payload)
        self.assertTrue(support_payload["id"].startswith("support-"))

        status, post_payload = self.api_request(
            "POST",
            "/api/posts",
            {
                "id": "reward-post-1",
                "image_uri": "https://example.com/reward-post.jpg",
                "date": "12/10/2026",
                "is_beer_finished": True,
                "event_title": "Reward Night",
                "likes": [],
                "comments": [],
                "capture_id": "capture-reward-1",
            },
            token=owner["token"],
        )
        self.assertEqual(status, 200, post_payload)
        self.assertTrue(post_payload["crown_awarded"])
        self.assertEqual(post_payload["crown_count"], 1)

        status, reward_payload = self.api_request("GET", "/api/rewards/me", token=owner["token"])
        self.assertEqual(status, 200, reward_payload)
        self.assertEqual(reward_payload["crown_count"], 1)
        self.assertEqual(len(reward_payload["history"]), 1)

        status, second_post_payload = self.api_request(
            "POST",
            "/api/posts",
            {
                "id": "reward-post-1",
                "image_uri": "https://example.com/reward-post.jpg",
                "date": "12/10/2026",
                "is_beer_finished": True,
                "event_title": "Reward Night",
                "likes": [],
                "comments": [],
                "capture_id": "capture-reward-1",
            },
            token=owner["token"],
        )
        self.assertEqual(status, 200, second_post_payload)
        self.assertFalse(second_post_payload["crown_awarded"])
        self.assertEqual(second_post_payload["crown_count"], 1)

        status, _ = self.api_request(
            "POST",
            "/api/posts/reward-post-1/likes/toggle",
            {},
            token=other["token"],
        )
        self.assertEqual(status, 200)

        status, notifications_payload = self.api_request("GET", "/api/notifications", token=owner["token"])
        self.assertEqual(status, 200, notifications_payload)
        self.assertGreaterEqual(notifications_payload["unread_count"], 1)
        self.assertTrue(any(item["related_id"] == "reward-post-1" for item in notifications_payload["items"]))

        status, _ = self.api_request("POST", "/api/notifications/read-all", {}, token=owner["token"])
        self.assertEqual(status, 200)

        status, notifications_payload = self.api_request("GET", "/api/notifications", token=owner["token"])
        self.assertEqual(status, 200, notifications_payload)
        self.assertEqual(notifications_payload["unread_count"], 0)

    def test_protected_routes_and_guest_support_validation(self):
        status, payload = self.api_request("GET", "/api/rewards/me")
        self.assertEqual(status, 401, payload)

        status, payload = self.api_request(
            "POST",
            "/api/support/contact",
            {"subject": "Guest message", "message": "Need help with a missing event listing."},
        )
        self.assertEqual(status, 400, payload)
        self.assertIn("detail", payload)

    def test_notification_websocket_requires_auth(self):
        with self.assertRaises(Exception):
            with connect(self.websocket_url("/ws/notifications"), open_timeout=5):
                self.fail("Unauthenticated notification socket should not connect.")

    def test_notification_websocket_receives_create_and_read_all_events(self):
        owner = self.register_and_login("socket-owner@example.com", "socketowner")
        other = self.register_and_login("socket-other@example.com", "socketother")

        with connect(self.websocket_url("/ws/notifications", owner["token"]), open_timeout=5) as websocket:
            status, payload = self.api_request(
                "POST",
                "/api/friends/requests",
                {"user_id": owner["user_id"]},
                token=other["token"],
            )
            self.assertEqual(status, 201, payload)

            message = json.loads(websocket.recv())
            self.assertEqual(message["type"], "notification.created")
            self.assertEqual(message["item"]["related_type"], "friendship_request")
            self.assertEqual(message["item"]["actor_username"], "socketother")
            self.assertGreaterEqual(message["unread_count"], 1)

            status, _ = self.api_request("POST", "/api/notifications/read-all", {}, token=owner["token"])
            self.assertEqual(status, 200)

            message = json.loads(websocket.recv())
            self.assertEqual(message["type"], "notification.read_all")
            self.assertEqual(message["unread_count"], 0)

    def test_notification_websocket_receives_group_invite_and_friend_accept_events(self):
        owner = self.register_and_login("socket-group-owner@example.com", "socketgroupowner")
        member = self.register_and_login("socket-group-member@example.com", "socketgroupmember")

        with connect(self.websocket_url("/ws/notifications", member["token"]), open_timeout=5) as member_socket:
            status, payload = self.api_request(
                "POST",
                "/api/friends/requests",
                {"user_id": member["user_id"]},
                token=owner["token"],
            )
            self.assertEqual(status, 201, payload)
            request_id = payload["id"]

            message = json.loads(member_socket.recv())
            self.assertEqual(message["type"], "notification.created")
            self.assertEqual(message["item"]["related_type"], "friendship_request")

            status, payload = self.api_request(
                "POST",
                f"/api/friends/requests/{request_id}/accept",
                {},
                token=member["token"],
            )
            self.assertEqual(status, 200, payload)

            message = json.loads(member_socket.recv())
            self.assertEqual(message["type"], "notification.created")
            self.assertEqual(message["item"]["related_type"], "friendship")

        status, payload = self.api_request(
            "POST",
            "/api/groups",
            {
                "name": "Socket Test Crew",
                "description": "Realtime invite delivery.",
                "invited_user_ids": [member["user_id"]],
            },
            token=owner["token"],
        )
        self.assertEqual(status, 201, payload)

        with connect(self.websocket_url("/ws/notifications", member["token"]), open_timeout=5) as member_socket:
            status, payload = self.api_request(
                "POST",
                "/api/groups",
                {
                    "name": "Socket Test Crew 2",
                    "description": "Realtime invite delivery.",
                    "invited_user_ids": [member["user_id"]],
                },
                token=owner["token"],
            )
            self.assertEqual(status, 201, payload)

            message = json.loads(member_socket.recv())
            self.assertEqual(message["type"], "notification.created")
            self.assertEqual(message["item"]["related_type"], "group")

    def test_event_post_like_comment_and_delete_permissions(self):
        alice = self.register_and_login("owner@example.com", "owner")
        bob = self.register_and_login("other@example.com", "other")

        status, event_payload = self.api_request(
            "POST",
            "/api/events",
            {
                "title": "API Test Event",
                "short_title": "API Event",
                "date": "10 Oct",
                "full_date": "Friday 10 October 2026",
                "time": "20:00 - 23:00",
                "place": "Brussels",
                "address": "Brussels Center",
                "attendees": "0 going",
                "attendee_count": 0,
                "price": "Free",
                "price_label": "Free entry",
                "vibe": "Test vibe",
                "experience": "Test event",
                "hero_image": "https://example.com/event.jpg",
                "host_name": "Ignored host",
                "host_avatar": "https://example.com/host.jpg",
                "badge": "TEST",
                "description": "Created during API tests.",
                "tags": ["test"],
            },
            token=alice["token"],
        )
        self.assertEqual(status, 200, event_payload)
        event_id = event_payload["id"]

        status, social_payload = self.api_request(
            "POST",
            f"/api/events/{event_id}/likes/toggle",
            body={},
            token=bob["token"],
        )
        self.assertEqual(status, 200, social_payload)
        self.assertTrue(social_payload["liked"])

        status, social_payload = self.api_request(
            "POST",
            f"/api/events/{event_id}/comments",
            {"text": "Looks good"},
            token=bob["token"],
        )
        self.assertEqual(status, 200, social_payload)
        self.assertEqual(social_payload["comments"][0]["text"], "Looks good")

        status, post_payload = self.api_request(
            "POST",
            "/api/posts",
            {
                "image_uri": "https://example.com/post.jpg",
                "date": "10/10/2026",
                "is_beer_finished": True,
                "event_id": event_id,
                "event_title": "API Test Event",
                "likes": [],
                "comments": [],
            },
            token=alice["token"],
        )
        self.assertEqual(status, 200, post_payload)
        post_id = post_payload["id"]

        status, like_payload = self.api_request(
            "POST",
            f"/api/posts/{post_id}/likes/toggle",
            body={},
            token=bob["token"],
        )
        self.assertEqual(status, 200, like_payload)
        self.assertIn("other", like_payload["likes"])

        status, comment_payload = self.api_request(
            "POST",
            f"/api/posts/{post_id}/comments",
            {"text": "Nice capture"},
            token=bob["token"],
        )
        self.assertEqual(status, 200, comment_payload)
        self.assertEqual(comment_payload["comments"][0]["text"], "Nice capture")

        status, _ = self.api_request("DELETE", f"/api/posts/{post_id}", token=bob["token"])
        self.assertEqual(status, 403)

        status, _ = self.api_request("DELETE", f"/api/posts/{post_id}", token=alice["token"])
        self.assertEqual(status, 200)

        status, posts_payload = self.api_request("GET", "/api/posts")
        self.assertEqual(status, 200, posts_payload)
        self.assertFalse(any(post["id"] == post_id for post in posts_payload))

    def test_friendship_search_requests_accept_decline_and_remove(self):
        alice = self.register_and_login("friends-alice@example.com", "friendsalice")
        bob = self.register_and_login("friends-bob@example.com", "friendsbob")
        charlie = self.register_and_login("friends-charlie@example.com", "friendscharlie")

        status, payload = self.api_request("GET", "/api/users/search?q=friends")
        self.assertEqual(status, 401, payload)

        status, payload = self.api_request("GET", "/api/users/search?q=friendsbob", token=alice["token"])
        self.assertEqual(status, 200, payload)
        self.assertTrue(any(entry["id"] == bob["user_id"] for entry in payload))
        self.assertFalse(any("email" in entry for entry in payload))

        status, payload = self.api_request(
            "POST",
            "/api/friends/requests",
            {"user_id": bob["user_id"]},
            token=alice["token"],
        )
        self.assertEqual(status, 201, payload)
        request_id = payload["id"]

        status, payload = self.api_request(
            "POST",
            "/api/friends/requests",
            {"user_id": bob["user_id"]},
            token=alice["token"],
        )
        self.assertEqual(status, 400, payload)

        status, payload = self.api_request(
            "POST",
            "/api/friends/requests",
            {"user_id": alice["user_id"]},
            token=alice["token"],
        )
        self.assertEqual(status, 400, payload)

        status, payload = self.api_request("GET", "/api/friends/requests", token=bob["token"])
        self.assertEqual(status, 200, payload)
        self.assertEqual(len(payload["incoming"]), 1)
        self.assertEqual(payload["incoming"][0]["requester_user"]["id"], alice["user_id"])

        status, payload = self.api_request(
            "POST",
            f"/api/friends/requests/{request_id}/accept",
            {},
            token=charlie["token"],
        )
        self.assertEqual(status, 403, payload)

        status, payload = self.api_request(
            "POST",
            f"/api/friends/requests/{request_id}/accept",
            {},
            token=bob["token"],
        )
        self.assertEqual(status, 200, payload)
        self.assertEqual(payload["status"], "accepted")

        status, payload = self.api_request("GET", "/api/friends", token=alice["token"])
        self.assertEqual(status, 200, payload)
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["friend"]["id"], bob["user_id"])

        status, payload = self.api_request("GET", "/api/notifications", token=bob["token"])
        self.assertEqual(status, 200, payload)
        self.assertTrue(any(item["related_type"] == "friendship" for item in payload["items"]))

        status, payload = self.api_request(
            "POST",
            "/api/friends/requests",
            {"user_id": charlie["user_id"]},
            token=alice["token"],
        )
        self.assertEqual(status, 201, payload)
        decline_request_id = payload["id"]

        status, payload = self.api_request(
            "POST",
            f"/api/friends/requests/{decline_request_id}/decline",
            {},
            token=charlie["token"],
        )
        self.assertEqual(status, 200, payload)
        self.assertEqual(payload["status"], "declined")

        status, payload = self.api_request("DELETE", f"/api/friends/{bob['user_id']}", token=alice["token"])
        self.assertEqual(status, 200, payload)

        status, payload = self.api_request("GET", "/api/friends", token=alice["token"])
        self.assertEqual(status, 200, payload)
        self.assertEqual(payload, [])

    def test_groups_leaderboard_permissions_and_notifications(self):
        owner = self.register_and_login("group-owner@example.com", "groupowner")
        member = self.register_and_login("group-member@example.com", "groupmember")
        outsider = self.register_and_login("group-outsider@example.com", "groupoutsider")

        status, payload = self.api_request(
            "POST",
            "/api/friends/requests",
            {"user_id": member["user_id"]},
            token=owner["token"],
        )
        self.assertEqual(status, 201, payload)
        request_id = payload["id"]

        status, payload = self.api_request(
            "POST",
            f"/api/friends/requests/{request_id}/accept",
            {},
            token=member["token"],
        )
        self.assertEqual(status, 200, payload)

        status, payload = self.api_request(
            "POST",
            "/api/groups",
            {
                "name": "Test Crew",
                "description": "Compare crowns with trusted friends.",
                "invited_user_ids": [member["user_id"]],
            },
            token=owner["token"],
        )
        self.assertEqual(status, 201, payload)
        group_id = payload["id"]
        self.assertEqual(payload["current_user_role"], "owner")
        self.assertEqual(payload["current_user_status"], "accepted")
        self.assertTrue(any(group_member["user"]["id"] == owner["user_id"] and group_member["role"] == "owner" for group_member in payload["members"]))
        self.assertTrue(any(group_member["user"]["id"] == member["user_id"] and group_member["status"] == "invited" for group_member in payload["members"]))

        status, notifications_payload = self.api_request("GET", "/api/notifications", token=member["token"])
        self.assertEqual(status, 200, notifications_payload)
        self.assertTrue(any(item["related_type"] == "group" and item["related_id"] == group_id for item in notifications_payload["items"]))

        status, payload = self.api_request("GET", f"/api/groups/{group_id}", token=outsider["token"])
        self.assertEqual(status, 403, payload)

        status, payload = self.api_request(
            "POST",
            f"/api/groups/{group_id}/invitations/accept",
            {},
            token=member["token"],
        )
        self.assertEqual(status, 200, payload)
        self.assertEqual(payload["current_user_status"], "accepted")

        status, payload = self.api_request(
            "POST",
            f"/api/groups/{group_id}/invitations",
            {"user_ids": [outsider["user_id"]]},
            token=member["token"],
        )
        self.assertEqual(status, 403, payload)

        status, payload = self.api_request(
            "POST",
            "/api/posts",
            {
                "id": "group-owner-post-1",
                "image_uri": "https://example.com/group-owner-post-1.jpg",
                "date": "05/05/2026",
                "is_beer_finished": True,
                "event_title": "Crew Night",
                "likes": [],
                "comments": [],
                "capture_id": "group-capture-owner-1",
            },
            token=owner["token"],
        )
        self.assertEqual(status, 200, payload)

        status, payload = self.api_request(
            "POST",
            "/api/posts",
            {
                "id": "group-owner-post-2",
                "image_uri": "https://example.com/group-owner-post-2.jpg",
                "date": "05/05/2026",
                "is_beer_finished": True,
                "event_title": "Crew Night",
                "likes": [],
                "comments": [],
                "capture_id": "group-capture-owner-2",
            },
            token=owner["token"],
        )
        self.assertEqual(status, 200, payload)

        status, payload = self.api_request(
            "POST",
            "/api/posts",
            {
                "id": "group-member-post-1",
                "image_uri": "https://example.com/group-member-post-1.jpg",
                "date": "05/05/2026",
                "is_beer_finished": True,
                "event_title": "Crew Night",
                "likes": [],
                "comments": [],
                "capture_id": "group-capture-member-1",
            },
            token=member["token"],
        )
        self.assertEqual(status, 200, payload)

        status, payload = self.api_request(
            "GET",
            f"/api/groups/{group_id}/leaderboard?period=all_time",
            token=member["token"],
        )
        self.assertEqual(status, 200, payload)
        self.assertEqual(payload["group_id"], group_id)
        self.assertEqual(payload["entries"][0]["user_id"], owner["user_id"])
        self.assertEqual(payload["entries"][0]["crown_count"], 2)
        self.assertTrue(any(entry["user_id"] == member["user_id"] and entry["is_current_user"] for entry in payload["entries"]))

        status, payload = self.api_request(
            "GET",
            f"/api/groups/{group_id}/leaderboard",
            token=outsider["token"],
        )
        self.assertEqual(status, 403, payload)

        status, payload = self.api_request(
            "DELETE",
            f"/api/groups/{group_id}/members/{member['user_id']}",
            token=owner["token"],
        )
        self.assertEqual(status, 200, payload)

        status, payload = self.api_request("GET", f"/api/groups/{group_id}", token=member["token"])
        self.assertEqual(status, 403, payload)

        status, payload = self.api_request(
            "POST",
            "/api/groups",
            {
                "name": "Decline Crew",
                "description": "Invite flow validation",
                "invited_user_ids": [member["user_id"]],
            },
            token=owner["token"],
        )
        self.assertEqual(status, 201, payload)
        second_group_id = payload["id"]

        status, payload = self.api_request(
            "POST",
            f"/api/groups/{second_group_id}/invitations/decline",
            {},
            token=member["token"],
        )
        self.assertEqual(status, 200, payload)

        status, payload = self.api_request("GET", "/api/groups", token=member["token"])
        self.assertEqual(status, 200, payload)
        self.assertFalse(any(item["id"] == second_group_id for item in payload["pending_invites"]))


if __name__ == "__main__":
    unittest.main()
