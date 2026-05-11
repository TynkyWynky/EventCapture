from __future__ import annotations

from backend.database import validate_database_schema


def main() -> None:
    validate_database_schema()
    print("Database schema verification passed.")


if __name__ == "__main__":
    main()
