import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.relief_center import ReliefCenter, DisasterType, SeverityLevel
from app.models.user import User

def seed_centers():
    print("Beginning seeding additional relief centers...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    centers_data = [
        {
            "name": "NDRF Base Camp Alpha (Flooded Sector)",
            "code": "RC-ALPHA",
            "location_name": "Godavari Basin Lowlands",
            "latitude": 19.1663,
            "longitude": 72.8526,
            "disaster_type": DisasterType.FLOOD,
            "severity_level": SeverityLevel.CRITICAL,
            "affected_population": 12500,
            "contact_person": "Commander Rajesh Varma",
            "contact_phone": "+91-9876543210",
            "status": "ACTIVE"
        },
        {
            "name": "Coastal Relief Camp Bravo (Cyclone Inundation)",
            "code": "RC-BRAVO",
            "location_name": "Konkan Coastal Sector 7",
            "latitude": 19.1410,
            "longitude": 72.9300,
            "disaster_type": DisasterType.CYCLONE,
            "severity_level": SeverityLevel.HIGH,
            "affected_population": 8400,
            "contact_person": "Inspector Ananya Sen",
            "contact_phone": "+91-9876543211",
            "status": "ACTIVE"
        },
        {
            "name": "Foothill Camp Charlie (Landslide Sector)",
            "code": "RC-CHARLIE",
            "location_name": "Western Ghats Pass",
            "latitude": 18.9800,
            "longitude": 73.1100,
            "disaster_type": DisasterType.LANDSLIDE,
            "severity_level": SeverityLevel.MEDIUM,
            "affected_population": 3200,
            "contact_person": "Sub-Inspector Vikram Rathore",
            "contact_phone": "+91-9876543212",
            "status": "ACTIVE"
        },
        {
            "name": "Delta Emergency Staging Hub Delta (Estuary Surge)",
            "code": "RC-DELTA",
            "location_name": "Krishna Delta Lowlands",
            "latitude": 16.2050,
            "longitude": 81.1400,
            "disaster_type": DisasterType.FLOOD,
            "severity_level": SeverityLevel.CRITICAL,
            "affected_population": 15800,
            "contact_person": "Capt. Arvind Swaminathan",
            "contact_phone": "+91-9876543213",
            "status": "ACTIVE"
        },
        {
            "name": "Northern Valley Relief Station Echo (Flash Flood & Debris)",
            "code": "RC-ECHO",
            "location_name": "Alaknanda Gorge Base",
            "latitude": 30.3800,
            "longitude": 79.3200,
            "disaster_type": DisasterType.FLOOD,
            "severity_level": SeverityLevel.CRITICAL,
            "affected_population": 6100,
            "contact_person": "Major Devendra Rawat",
            "contact_phone": "+91-9876543214",
            "status": "ACTIVE"
        },
        {
            "name": "Island Forward Outpost Foxtrot (Tsunami & Coastal Breach)",
            "code": "RC-FOXTROT",
            "location_name": "Car Nicobar Coastal Ring",
            "latitude": 9.1550,
            "longitude": 92.7660,
            "disaster_type": DisasterType.TSUNAMI,
            "severity_level": SeverityLevel.HIGH,
            "affected_population": 4900,
            "contact_person": "Lt. Commander Priya Nair",
            "contact_phone": "+91-9876543215",
            "status": "ACTIVE"
        },
        {
            "name": "Seismic Triage & Shelter Camp Golf (Earthquake Faultline)",
            "code": "RC-GOLF",
            "location_name": "Kutch Rift Zone Sector 9",
            "latitude": 23.3300,
            "longitude": 70.3600,
            "disaster_type": DisasterType.EARTHQUAKE,
            "severity_level": SeverityLevel.CRITICAL,
            "affected_population": 19400,
            "contact_person": "Dr. Sameer Joshi (Field Surgeon)",
            "contact_phone": "+91-9876543216",
            "status": "ACTIVE"
        },
        {
            "name": "Urban Flood Response Center Hotel (Submerged District)",
            "code": "RC-HOTEL",
            "location_name": "Mithi River Drainage Zone 4",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "disaster_type": DisasterType.FLOOD,
            "severity_level": SeverityLevel.HIGH,
            "affected_population": 22000,
            "contact_person": "Chief Officer Meera Deshmukh",
            "contact_phone": "+91-9876543217",
            "status": "ACTIVE"
        },
        {
            "name": "Wildfire & Evacuation Camp India (Forest Edge Perimeter)",
            "code": "RC-INDIA",
            "location_name": "Nilgiri Biosphere Buffer Zone",
            "latitude": 11.4100,
            "longitude": 76.6900,
            "disaster_type": DisasterType.FIRE,
            "severity_level": SeverityLevel.MEDIUM,
            "affected_population": 2750,
            "contact_person": "Forest Range Officer K. Balachandran",
            "contact_phone": "+91-9876543218",
            "status": "ACTIVE"
        },
        {
            "name": "Brahmaputra Flood Refuge Camp Juliet (Severe Inundation)",
            "code": "RC-JULIET",
            "location_name": "Majuli River Island Camp",
            "latitude": 26.9500,
            "longitude": 94.2100,
            "disaster_type": DisasterType.FLOOD,
            "severity_level": SeverityLevel.CRITICAL,
            "affected_population": 14200,
            "contact_person": "Commander Biren Gogoi",
            "contact_phone": "+91-9876543219",
            "status": "ACTIVE"
        }
    ]

    try:
        count_added = 0
        for c_data in centers_data:
            existing = db.query(ReliefCenter).filter(ReliefCenter.code == c_data["code"]).first()
            if not existing:
                rc = ReliefCenter(**c_data)
                db.add(rc)
                db.flush()
                print(f"✓ Added Relief Center #{rc.id}: {rc.name} [{rc.code}] in {rc.location_name}")
                count_added += 1
            else:
                print(f"• Existing Relief Center #{existing.id}: {existing.name} [{existing.code}]")

        db.commit()
        total = db.query(ReliefCenter).count()
        print(f"\nDone! Added {count_added} new centers. Total Relief Centers registered: {total}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding relief centers: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_centers()
