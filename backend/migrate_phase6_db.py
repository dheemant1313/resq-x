import sqlite3
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import engine, Base, SessionLocal
from app.models.inventory import ResourceItem

db_path = os.path.join(os.path.dirname(__file__), "resqx_local.db")
print(f"Migrating Phase 6 SQLite database at: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Check and add storage_location to resource_inventory
cursor.execute("PRAGMA table_info(resource_inventory);")
inv_cols = [row[1] for row in cursor.fetchall()]
if "storage_location" not in inv_cols:
    print("Adding storage_location to resource_inventory...")
    cursor.execute("ALTER TABLE resource_inventory ADD COLUMN storage_location VARCHAR(100) DEFAULT 'Central Warehouse Bay-A';")

# 2. Check and add columns to allocation_audit_logs
cursor.execute("PRAGMA table_info(allocation_audit_logs);")
alloc_cols = [row[1] for row in cursor.fetchall()]
if "center_id" not in alloc_cols:
    print("Adding center_id to allocation_audit_logs...")
    cursor.execute("ALTER TABLE allocation_audit_logs ADD COLUMN center_id INTEGER;")
if "previous_stock" not in alloc_cols:
    print("Adding previous_stock to allocation_audit_logs...")
    cursor.execute("ALTER TABLE allocation_audit_logs ADD COLUMN previous_stock INTEGER DEFAULT 0;")
if "remaining_stock" not in alloc_cols:
    print("Adding remaining_stock to allocation_audit_logs...")
    cursor.execute("ALTER TABLE allocation_audit_logs ADD COLUMN remaining_stock INTEGER DEFAULT 0;")

conn.commit()
conn.close()

# 3. Create any new tables (inventory_transactions, notifications)
Base.metadata.create_all(bind=engine)
print("Base.metadata.create_all synchronized.")

# 4. Verify resources have diverse storage locations
db = SessionLocal()
try:
    locations = [
        ("WTR-CAN-01", "Bay-A Water Storage Reservoir"),
        ("WTR-PUR-02", "Bay-A Water Purification Aisle 2"),
        ("FOD-RAT-01", "Bay-B Temperature-Controlled Rations Zone"),
        ("FOD-DRY-02", "Bay-B Bulk Grain Depot"),
        ("MED-TRM-01", "Bay-C Sterile Medical Vault 1"),
        ("MED-ABX-02", "Bay-C Pharmaceutical Lockbox 3"),
        ("SHL-TNT-01", "Bay-D Heavy Shelter Staging Deck"),
        ("SHL-BLK-02", "Bay-D Thermal Bedding Section 4"),
        ("PWR-GEN-01", "Bay-E Power Equipment Yard"),
        ("PWR-SAT-02", "Bay-E Telecom Unit Rack 7"),
        ("RSC-RFT-01", "Bay-F Marine Rescue Dock"),
    ]
    for sku, loc in locations:
        item = db.query(ResourceItem).filter(ResourceItem.sku == sku).first()
        if item:
            item.storage_location = loc
    db.commit()
    print("✓ Updated storage locations for emergency resource items.")
finally:
    db.close()

print("Phase 6 DB migration complete and successful.")
