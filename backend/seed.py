#!/usr/bin/env python3

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.test_users import seed_test_users


def seed_db():
    db = SessionLocal()
    try:
        created = seed_test_users(db)
        print(f"Seeded {created} test users")
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
