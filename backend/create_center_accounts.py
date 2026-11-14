"""
Provision one NDRF / Relief Center login account for every relief center that
does not yet have an active RELIEF_CENTER user.

- Passwords are randomly generated (never hardcoded in source control).
- Passwords are stored only as bcrypt hashes in the database.
- Plaintext credentials are written ONCE to `center_credentials.local`
  (gitignored) so the operator can hand them out. Delete that file after use.
- Safe to re-run: centers that already have an account are skipped.

Usage:  python create_center_accounts.py
"""
import os
import sys
import secrets
import string
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, UserRole
import app.models  # noqa: F401  (register all ORM models)
from app.models.user import User
from app.models.relief_center import ReliefCenter

CREDENTIALS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "center_credentials.local")


def generate_password(length: int = 14) -> str:
    """Strong random password with at least one lower, upper, digit and symbol."""
    alphabet = string.ascii_letters + string.digits + "@#$%&*!"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in pwd) and any(c.isupper() for c in pwd)
                and any(c.isdigit() for c in pwd) and any(c in "@#$%&*!" for c in pwd)):
            return pwd


def username_for(center: ReliefCenter) -> str:
    # RC-DELTA -> ndrf_delta
    suffix = center.code.split("-", 1)[-1].lower().replace("-", "_")
    return f"ndrf_{suffix}"


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    created = []
    try:
        centers = db.query(ReliefCenter).order_by(ReliefCenter.id.asc()).all()
        for center in centers:
            has_account = db.query(User).filter(
                User.role == UserRole.RELIEF_CENTER,
                User.center_id == center.id,
                User.is_active == True,  # noqa: E712
            ).first()
            if has_account:
                print(f"• {center.code}: already has account '{has_account.username}' — skipped")
                continue

            username = username_for(center)
            email = f"{username.replace('_', '.')}@resqx.gov.in"
            if db.query(User).filter((User.email == email) | ((User.username == username) & (User.role == UserRole.RELIEF_CENTER))).first():
                print(f"! {center.code}: username/email '{username}' already taken — skipped")
                continue

            password = generate_password()
            db.add(User(
                email=email,
                username=username,
                hashed_password=get_password_hash(password),
                role=UserRole.RELIEF_CENTER,
                center_id=center.id,
                is_active=True,
            ))
            created.append((center.code, center.name, username, email, password))
            print(f"✓ {center.code}: created account '{username}'")

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    if created:
        new_file = not os.path.exists(CREDENTIALS_FILE)
        with open(CREDENTIALS_FILE, "a", encoding="utf-8") as f:
            if new_file:
                f.write("# RESQ-X NDRF center accounts — LOCAL ONLY, DO NOT COMMIT. Delete after distributing.\n")
                f.write("# Login: choose 'NDRF / Relief Center' role, then use username (or email) + password.\n\n")
            f.write(f"## Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"{'CENTER':<12} {'USERNAME':<16} {'PASSWORD':<16} EMAIL / STATION\n")
            for code, name, username, email, password in created:
                f.write(f"{code:<12} {username:<16} {password:<16} {email} / {name}\n")
            f.write("\n")
        print(f"\n{len(created)} account(s) created. Credentials written to: {CREDENTIALS_FILE}")
    else:
        print("\nNo new accounts needed — every center already has an NDRF login.")


if __name__ == "__main__":
    main()
