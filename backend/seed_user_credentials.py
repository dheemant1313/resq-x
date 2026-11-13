import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, UserRole
from app.models.user import User
from app.models.relief_center import ReliefCenter

def run_user_seed():
    print("Provisioning requested user credentials...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Ensure Relief Center 1 exists
        rc = db.query(ReliefCenter).first()
        center_id = rc.id if rc else None

        # 1. Provision NDRF account: dheemant / dheemant123
        ndrf_user = db.query(User).filter(
            User.username == "dheemant", 
            User.role == UserRole.RELIEF_CENTER
        ).first()

        if not ndrf_user:
            # Check if username dheemant exists with another role
            ndrf_user = User(
                email="dheemant.ndrf@resqx.gov.in",
                username="dheemant",
                hashed_password=get_password_hash("dheemant123"),
                role=UserRole.RELIEF_CENTER,
                center_id=center_id,
                is_active=True
            )
            db.add(ndrf_user)
            print("✓ Created NDRF user: dheemant / dheemant123 (RELIEF_CENTER)")
        else:
            ndrf_user.hashed_password = get_password_hash("dheemant123")
            ndrf_user.is_active = True
            ndrf_user.center_id = center_id
            print("✓ Updated NDRF user: dheemant / dheemant123 (RELIEF_CENTER)")

        # 2. Provision Operator account: dheemant / dheemant8147
        op_user = db.query(User).filter(
            User.username == "dheemant", 
            User.role == UserRole.OPERATOR
        ).first()

        if not op_user:
            op_user = User(
                email="dheemant.operator@resqx.gov.in",
                username="dheemant",
                hashed_password=get_password_hash("dheemant8147"),
                role=UserRole.OPERATOR,
                is_active=True
            )
            db.add(op_user)
            print("✓ Created Operator user: dheemant / dheemant8147 (OPERATOR)")
        else:
            op_user.hashed_password = get_password_hash("dheemant8147")
            op_user.is_active = True
            print("✓ Updated Operator user: dheemant / dheemant8147 (OPERATOR)")

        db.commit()
        print("✓ All user credentials committed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error provisioning users: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_user_seed()
