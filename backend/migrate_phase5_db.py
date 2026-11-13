import sqlite3
import os
from app.core.database import engine, Base, SessionLocal
from app.models.inventory import ResourceItem, ResourceCategory
from app.models.relief_center import ReliefCenter
from app.models.user import User

db_path = os.path.join(os.path.dirname(__file__), "resqx_local.db")
print(f"Connecting to SQLite at: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Check existing columns in resource_requests
cursor.execute("PRAGMA table_info(resource_requests);")
existing_cols = [row[1] for row in cursor.fetchall()]
print(f"Existing columns in resource_requests: {existing_cols}")

cols_to_add = [
    ("num_families", "INTEGER DEFAULT 0"),
    ("children_elderly_count", "INTEGER DEFAULT 0"),
    ("medical_assistance_count", "INTEGER DEFAULT 0"),
    ("disaster_type", "VARCHAR(50) DEFAULT 'FLOOD'"),
    ("disaster_severity", "VARCHAR(50) DEFAULT 'HIGH'"),
    ("affected_location", "VARCHAR(255) DEFAULT ''"),
]

for col_name, col_type in cols_to_add:
    if col_name not in existing_cols:
        print(f"Adding missing column: {col_name} {col_type}")
        cursor.execute(f"ALTER TABLE resource_requests ADD COLUMN {col_name} {col_type};")

conn.commit()
conn.close()
print("Table columns check complete.")

# 2. Ensure SQLAlchemy Base metadata
Base.metadata.create_all(bind=engine)

# 3. Seed/verify resource inventory items
db = SessionLocal()
try:
    standard_resources = [
        {
            "name": "Emergency Potable Water (20L Can)",
            "sku": "WTR-CAN-01",
            "category": ResourceCategory.POTABLE_WATER,
            "unit": "cans",
            "weight_per_unit_kg": 20.0,
            "priority_score": 100,
            "total_stock": 2500,
            "available_stock": 2500,
            "reserved_stock": 0
        },
        {
            "name": "Ready-to-Eat Food Rations (Family 3-Day)",
            "sku": "RAT-EMG-01",
            "category": ResourceCategory.FOOD_RATIONS,
            "unit": "packs",
            "weight_per_unit_kg": 5.5,
            "priority_score": 95,
            "total_stock": 2000,
            "available_stock": 2000,
            "reserved_stock": 0
        },
        {
            "name": "Comprehensive Trauma Medical Kit",
            "sku": "MED-TRM-01",
            "category": ResourceCategory.MEDICAL_SUPPLIES,
            "unit": "kits",
            "weight_per_unit_kg": 4.0,
            "priority_score": 90,
            "total_stock": 400,
            "available_stock": 400,
            "reserved_stock": 0
        },
        {
            "name": "Heavy-Duty Weatherproof Family Tent",
            "sku": "SHL-FAM-01",
            "category": ResourceCategory.SHELTER_AND_BEDDING,
            "unit": "tents",
            "weight_per_unit_kg": 18.0,
            "priority_score": 75,
            "total_stock": 350,
            "available_stock": 350,
            "reserved_stock": 0
        },
        {
            "name": "High-Grade Thermal Fleece Blankets (Pack of 5)",
            "sku": "BLK-THM-01",
            "category": ResourceCategory.SHELTER_AND_BEDDING,
            "unit": "packs",
            "weight_per_unit_kg": 3.0,
            "priority_score": 70,
            "total_stock": 1500,
            "available_stock": 1500,
            "reserved_stock": 0
        },
        {
            "name": "Satellite Emergency Telecom & Power Unit",
            "sku": "TEL-SAT-01",
            "category": ResourceCategory.POWER_AND_COMMUNICATION,
            "unit": "units",
            "weight_per_unit_kg": 12.0,
            "priority_score": 85,
            "total_stock": 50,
            "available_stock": 50,
            "reserved_stock": 0
        },
    ]

    for item_data in standard_resources:
        existing = db.query(ResourceItem).filter(ResourceItem.sku == item_data["sku"]).first()
        if not existing:
            print(f"Seeding resource: {item_data['sku']} - {item_data['name']}")
            item = ResourceItem(**item_data)
            db.add(item)
    db.commit()

    # Verify Relief Center 1 exists and is linked to NDRF user dheemant
    user = db.query(User).filter(User.username == "dheemant").first()
    if user:
        print(f"User dheemant found with center_id: {user.center_id}")
        if user.center_id:
            rc = db.query(ReliefCenter).filter(ReliefCenter.id == user.center_id).first()
            if rc:
                print(f"Linked Center: {rc.name} ({rc.code}), Contact: {rc.contact_person}")
finally:
    db.close()

print("Phase 5 DB migration and verification successful.")
