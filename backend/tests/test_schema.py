from __future__ import annotations

import os
import sqlite3
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PYTHON_EXE = REPO_ROOT / "backend" / ".venv" / "Scripts" / "python.exe"


class SchemaMigrationTests(unittest.TestCase):
    def test_alembic_upgrade_repairs_legacy_event_comment_and_support_schema(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "legacy-eventcapture.db"
            connection = sqlite3.connect(db_path)
            try:
                connection.executescript(
                    """
                    CREATE TABLE users (
                        id TEXT PRIMARY KEY,
                        email TEXT,
                        username TEXT,
                        full_name TEXT,
                        bio TEXT,
                        city TEXT,
                        avatar_uri TEXT,
                        password_hash TEXT,
                        role TEXT,
                        is_active INTEGER,
                        created_at TEXT,
                        updated_at TEXT
                    );

                    CREATE TABLE events (
                        id TEXT PRIMARY KEY,
                        title TEXT,
                        short_title TEXT,
                        date TEXT,
                        full_date TEXT,
                        time TEXT,
                        place TEXT,
                        address TEXT,
                        attendees TEXT,
                        attendee_count INTEGER,
                        price TEXT,
                        price_label TEXT,
                        vibe TEXT,
                        experience TEXT,
                        hero_image TEXT,
                        host_name TEXT,
                        host_avatar TEXT,
                        badge TEXT,
                        description TEXT,
                        tags_json TEXT,
                        created_at TEXT,
                        updated_at TEXT
                    );

                    CREATE TABLE event_comments (
                        id TEXT PRIMARY KEY,
                        event_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        username TEXT NOT NULL,
                        avatar_uri TEXT NOT NULL,
                        text TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    );

                    CREATE TABLE support_requests (
                        id TEXT PRIMARY KEY,
                        user_id TEXT,
                        email TEXT NOT NULL,
                        subject TEXT NOT NULL,
                        message TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'open',
                        created_at TEXT NOT NULL
                    );
                    """
                )
                connection.commit()
            finally:
                connection.close()

            env = os.environ.copy()
            env["EVENTCAPTURE_DATABASE_PATH"] = str(db_path)

            migrate = subprocess.run(
                [str(PYTHON_EXE), "-m", "alembic", "upgrade", "head"],
                cwd=REPO_ROOT,
                env=env,
                capture_output=True,
                text=True,
                timeout=120,
            )
            self.assertEqual(migrate.returncode, 0, migrate.stderr or migrate.stdout)

            verify = subprocess.run(
                [str(PYTHON_EXE), "-m", "backend.verify_schema"],
                cwd=REPO_ROOT,
                env=env,
                capture_output=True,
                text=True,
                timeout=120,
            )
            self.assertEqual(verify.returncode, 0, verify.stderr or verify.stdout)

            connection = sqlite3.connect(db_path)
            try:
                event_comment_columns = {
                    row[1] for row in connection.execute("PRAGMA table_info(event_comments)").fetchall()
                }
                support_request_columns = {
                    row[1] for row in connection.execute("PRAGMA table_info(support_requests)").fetchall()
                }
                alembic_revision = connection.execute("SELECT version_num FROM alembic_version").fetchone()
            finally:
                connection.close()

            self.assertIn("time_label", event_comment_columns)
            self.assertIn("priority", support_request_columns)
            self.assertEqual(alembic_revision[0], "20260511_0003")


if __name__ == "__main__":
    unittest.main()
