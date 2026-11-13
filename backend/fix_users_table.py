import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, UserRole
from app.models.user import User
from app.models.relief_center import ReliefCenter

def recreate_and_seed():
    print("Recreating users table with composite unique constraint (username, role)...")
    
    # Drop only users table if exists to update its constraints
    User.__table__.drop(bind=engine, checkfirst=True)
    User.__table__.create(bind=engine)
    print("✓ users table created with new schema.")

    db = SessionLocal()
    try:
        # Check center 1
        rc = db.query(ReliefCenter).first()
        center_id = rc.id if rc else 1

        users_to_seed = [
            # Standard Demo Accounts
            {
                "email": "admin@resqx.org",
                "username": "admin",
                "hashed_password": get_password_hash("Admin@RESQX2026"),
                "role": UserRole.ADMIN,
                "center_id": None,
            },
            {
                "email": "operator1@resqx.org",
                "username": "operator1",
                "hashed_password": get_password_hash("Operator@RESQX2026"),
                "role": UserRole.OPERATOR,
                "center_id": None,
            },
            {
                "email": "coord_alpha@resqx.org",
                "username": "coord_alpha",
                "hashed_password": get_password_hash("Relief@RESQX2026"),
                "role": UserRole.RELIEF_CENTER,
                "center_id": center_id,
            },
            # Requested Custom Credentials for dheemant
            {
                "email": "dheemant.ndrf@resqx.gov.in",
                "username": "dheemant",
                "hashed_password": get_password_hash("dheemant123"),
                "role": UserRole.RELIEF_CENTER,
                "center_id": center_id,
            },
            {
                "email": "dheemant.operator@resqx.gov.in",
                "username": "dheemant",
                "hashed_password": get_password_hash("dheemant8147"),
                "role": UserRole.OPERATOR,
                "center_id": None,
            },
        ]

        for u in users_to_seed:
            user_obj = User(**u, is_active=True)
            db.add(user_obj)
            print(f"✓ Seeded {u['username']} as {u['role'].value}")

        db.commit()
        print("✓ All accounts committed successfully!")

        # Verify
        all_users = db.query(User).all()
        for u in all_users:
            print(f"  -> User in DB: id={u.id}, username='{u.username}', role='{u.role.value}', email='{u.email}'")

    except Exception as e:
        db.rollback()
        print(f"Failed to seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    recreate_and_seed()
