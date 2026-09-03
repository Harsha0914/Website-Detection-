import sys
import argparse
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.utils.security import hash_password

def create_admin(email: str, password: str, full_name: str, phone: str = None):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            print(f"Error: User with email '{email}' already exists.")
            return

        admin = User(
            full_name=full_name,
            email=email.lower(),
            phone=phone,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print(f"Successfully created admin user: {email} ({full_name})")
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Shop Presence CLI")
    subparsers = parser.add_subparsers(dest="command")

    admin_parser = subparsers.add_parser("create-admin", help="Create an administrator account")
    admin_parser.add_argument("--email", required=True, help="Admin email address")
    admin_parser.add_argument("--password", required=True, help="Admin password (min 8 chars)")
    admin_parser.add_argument("--name", default="System Administrator", help="Admin full name")
    admin_parser.add_argument("--phone", default=None, help="Admin phone number")

    args = parser.parse_args()

    if args.command == "create-admin":
        if len(args.password) < 8:
            print("Error: Password must be at least 8 characters long.")
            sys.exit(1)
        create_admin(args.email, args.password, args.name, args.phone)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
