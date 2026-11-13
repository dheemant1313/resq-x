import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, UserRole
from app.models import (
    User,
    OperatorProfile,
    AdminProfile,
    RefreshToken,
    BlacklistedToken,
    PasswordResetToken,
    ReliefCenter
)

def sync_schema():
    print("Synchronizing Phase 4 schema and database models...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Ensure OperatorProfile exists for operators
        operators = db.query(User).filter(User.role == UserRole.OPERATOR).all()
        for idx, op in enumerate(operators):
            profile = db.query(OperatorProfile).filter(OperatorProfile.user_id == op.id).first()
            if not profile:
                profile = OperatorProfile(
                    user_id=op.id,
                    badge_number=f"OP-BADGE-{100 + idx}",
                    department="Central Logistics Command",
                    clearance_level=3,
                    assigned_region="National Relief Fleet"
                )
                db.add(profile)
                print(f"✓ Created OperatorProfile for {op.username} ({profile.badge_number})")

        # 2. Ensure AdminProfile exists for admin
        admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
        for a in admins:
            profile = db.query(AdminProfile).filter(AdminProfile.user_id == a.id).first()
            if not profile:
                profile = AdminProfile(
                    user_id=a.id,
                    superadmin=True,
                    access_scope="GLOBAL_NATIONAL_COMMAND"
                )
                db.add(profile)
                print(f"✓ Created AdminProfile for {a.username}")

        db.commit()
        print("✓ Phase 4 database sync complete.")
    except Exception as e:
        db.rollback()
        print(f"Error syncing schema: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    sync_schema()
