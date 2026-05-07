from __future__ import annotations

import unittest

from backend.security import hash_password, verify_password


class PasswordSecurityTests(unittest.TestCase):
    def test_long_password_round_trip(self):
        password = "very-long-password-" * 8

        password_hash = hash_password(password)

        self.assertTrue(password_hash.startswith("bcrypt_sha256$"))
        self.assertTrue(verify_password(password, password_hash))
        self.assertFalse(verify_password(password + "x", password_hash))

    def test_legacy_pbkdf2_hash_is_supported(self):
        password_hash = (
            "pbkdf2_sha256$120000$efZ7N/db0uDpygvDgFh7zg==$"
            "tGMsgVV+QY+TaqZhp41qq3+lMt2bzuhp/rx5h9O810Y="
        )

        self.assertTrue(verify_password("AdminPass123!", password_hash))
        self.assertFalse(verify_password("admin", password_hash))


if __name__ == "__main__":
    unittest.main()
