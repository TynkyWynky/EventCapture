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


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


class EventCaptureApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.temp_dir = tempfile.TemporaryDirectory()
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


if __name__ == "__main__":
    unittest.main()
