import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, UserRole
from app.models.user import User
from app.models.relief_center import ReliefCenter, DisasterType, SeverityLevel
from app.models.inventory import ResourceItem, ResourceCategory
from app.models.route import RoadNetworkNode, RoadNetworkEdge, NodeType

def seed_database():
    print("Beginning database seed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users (Admin, Operator, Relief Center coordinator)
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                email="admin@resqx.org",
                username="admin",
                hashed_password=get_password_hash("Admin@RESQX2026"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            print("✓ Seeded Admin account: admin / Admin@RESQX2026")

        if not db.query(User).filter(User.username == "operator1").first():
            operator = User(
                email="operator1@resqx.org",
                username="operator1",
                hashed_password=get_password_hash("Operator@RESQX2026"),
                role=UserRole.OPERATOR,
                is_active=True
            )
            db.add(operator)
            print("✓ Seeded Operator account: operator1 / Operator@RESQX2026")

        # 2. Seed Relief Centers
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
            }
        ]

        created_centers = {}
        for c_data in centers_data:
            existing = db.query(ReliefCenter).filter(ReliefCenter.code == c_data["code"]).first()
            if not existing:
                rc = ReliefCenter(**c_data)
                db.add(rc)
                db.flush()
                created_centers[rc.code] = rc.id
                print(f"✓ Seeded Relief Center: {rc.name} ({rc.code})")
            else:
                created_centers[existing.code] = existing.id

        # Seed relief coordinator user linked to Camp Alpha
        if not db.query(User).filter(User.username == "coord_alpha").first():
            coord = User(
                email="alpha_coord@resqx.org",
                username="coord_alpha",
                hashed_password=get_password_hash("Coord@RESQX2026"),
                role=UserRole.RELIEF_CENTER,
                center_id=created_centers.get("RC-ALPHA"),
                is_active=True
            )
            db.add(coord)
            print("✓ Seeded Relief Center User: coord_alpha / Coord@RESQX2026")

        # 3. Seed Central Warehouse Inventory (with exact weights & priority scores for 0/1 Knapsack)
        resources_data = [
            {"sku": "MED-TRM-01", "name": "Emergency Trauma First Aid Kit", "category": ResourceCategory.MEDICAL_SUPPLIES, "unit": "kits", "weight_per_unit_kg": 8.0, "priority_score": 95, "total_stock": 250},
            {"sku": "MED-ABX-02", "name": "Broad-Spectrum Antibiotics Carton", "category": ResourceCategory.MEDICAL_SUPPLIES, "unit": "cartons", "weight_per_unit_kg": 4.5, "priority_score": 90, "total_stock": 400},
            {"sku": "WTR-CAN-01", "name": "High-Density Potable Water Jerrycan (20L)", "category": ResourceCategory.POTABLE_WATER, "unit": "jerrycans", "weight_per_unit_kg": 20.5, "priority_score": 92, "total_stock": 800},
            {"sku": "WTR-PUR-02", "name": "Water Purification Chemical Tablets Box", "category": ResourceCategory.POTABLE_WATER, "unit": "boxes", "weight_per_unit_kg": 2.0, "priority_score": 88, "total_stock": 1000},
            {"sku": "FOD-RAT-01", "name": "Ready-to-Eat High-Calorie Meal Packs", "category": ResourceCategory.FOOD_RATIONS, "unit": "cartons", "weight_per_unit_kg": 15.0, "priority_score": 85, "total_stock": 600},
            {"sku": "FOD-DRY-02", "name": "Fortified Grains & Pulses Sacks (25kg)", "category": ResourceCategory.FOOD_RATIONS, "unit": "sacks", "weight_per_unit_kg": 25.0, "priority_score": 75, "total_stock": 500},
            {"sku": "SHL-TNT-01", "name": "All-Weather Heavy Duty Family Tent", "category": ResourceCategory.SHELTER_AND_BEDDING, "unit": "units", "weight_per_unit_kg": 35.0, "priority_score": 80, "total_stock": 300},
            {"sku": "SHL-BLK-02", "name": "Reflective Thermal Emergency Blankets (Pack of 10)", "category": ResourceCategory.SHELTER_AND_BEDDING, "unit": "packs", "weight_per_unit_kg": 5.0, "priority_score": 65, "total_stock": 1200},
            {"sku": "PWR-GEN-01", "name": "Portable Silent Inverter Generator (2kVA)", "category": ResourceCategory.POWER_AND_COMMUNICATION, "unit": "units", "weight_per_unit_kg": 42.0, "priority_score": 82, "total_stock": 80},
            {"sku": "PWR-SAT-02", "name": "Emergency Satellite Phone & Solar Charger", "category": ResourceCategory.POWER_AND_COMMUNICATION, "unit": "kits", "weight_per_unit_kg": 3.0, "priority_score": 98, "total_stock": 150},
            {"sku": "RSC-RFT-01", "name": "Inflatable 6-Person Swiftwater Rescue Raft", "category": ResourceCategory.RESCUE_EQUIPMENT, "unit": "units", "weight_per_unit_kg": 55.0, "priority_score": 94, "total_stock": 60},
        ]

        for r_data in resources_data:
            existing = db.query(ResourceItem).filter(ResourceItem.sku == r_data["sku"]).first()
            if not existing:
                item = ResourceItem(
                    **r_data,
                    reserved_stock=0,
                    available_stock=r_data["total_stock"]
                )
                db.add(item)
                print(f"✓ Seeded Resource: {r_data['name']} (Weight: {r_data['weight_per_unit_kg']} kg, Priority: {r_data['priority_score']})")

        # 4. Seed Road Network Nodes and Edges (for Dijkstra routing graph)
        nodes_data = [
            {"code": "DEPOT_CENTRAL", "name": "Central NDRF Regional Depot", "node_type": NodeType.CENTRAL_DEPOT, "latitude": 19.0760, "longitude": 72.8777},
            {"code": "WP_NORTH_HUB", "name": "North Transit Junction (Sector 4)", "node_type": NodeType.WAYPOINT, "latitude": 19.1136, "longitude": 72.8697},
            {"code": "WP_EAST_BRIDGE", "name": "Eastern Express Bypass Bridge", "node_type": NodeType.WAYPOINT, "latitude": 19.0896, "longitude": 72.9080},
            {"code": "WP_SOUTH_JUNCT", "name": "Southern Relief Interchange", "node_type": NodeType.WAYPOINT, "latitude": 19.0330, "longitude": 72.8570},
            {"code": "WP_CROSS_VALLEY", "name": "Valley Cross Link Road", "node_type": NodeType.WAYPOINT, "latitude": 19.1350, "longitude": 72.8900},
            {"code": "RC_NODE_ALPHA", "name": "Relief Center Alpha Terminal", "node_type": NodeType.RELIEF_CENTER, "latitude": 19.1663, "longitude": 72.8526},
            {"code": "RC_NODE_BRAVO", "name": "Relief Center Bravo Access Point", "node_type": NodeType.RELIEF_CENTER, "latitude": 19.1410, "longitude": 72.9300},
        ]

        node_map = {}
        for n_data in nodes_data:
            existing = db.query(RoadNetworkNode).filter(RoadNetworkNode.code == n_data["code"]).first()
            if not existing:
                node = RoadNetworkNode(**n_data)
                db.add(node)
                db.flush()
                node_map[node.code] = node.id
                print(f"✓ Seeded Road Node: {node.name} [{node.code}]")
            else:
                node_map[existing.code] = existing.id

        edges_data = [
            {"source": "DEPOT_CENTRAL", "target": "WP_NORTH_HUB", "distance_km": 6.5, "condition_multiplier": 1.0, "is_blocked": False, "risk_factor": 1.0, "road_name": "NH-48 Arterial Highway"},
            {"source": "DEPOT_CENTRAL", "target": "WP_EAST_BRIDGE", "distance_km": 5.2, "condition_multiplier": 1.5, "is_blocked": False, "risk_factor": 1.8, "road_name": "Eastern Causeway Corridor"},
            {"source": "DEPOT_CENTRAL", "target": "WP_SOUTH_JUNCT", "distance_km": 7.0, "condition_multiplier": 1.0, "is_blocked": False, "risk_factor": 1.0, "road_name": "South Harbor Road"},
            {"source": "WP_NORTH_HUB", "target": "RC_NODE_ALPHA", "distance_km": 8.1, "condition_multiplier": 2.2, "is_blocked": False, "risk_factor": 2.5, "road_name": "North Floodplain Avenue (Waterlogged)"},
            {"source": "WP_NORTH_HUB", "target": "WP_CROSS_VALLEY", "distance_km": 3.8, "condition_multiplier": 1.1, "is_blocked": False, "risk_factor": 1.1, "road_name": "Cross Ridge Bypass"},
            {"source": "WP_CROSS_VALLEY", "target": "RC_NODE_ALPHA", "distance_km": 5.0, "condition_multiplier": 1.0, "is_blocked": False, "risk_factor": 1.0, "road_name": "High Ground Ingress Route"},
            {"source": "WP_EAST_BRIDGE", "target": "RC_NODE_BRAVO", "distance_km": 9.4, "condition_multiplier": 1.0, "is_blocked": False, "risk_factor": 1.2, "road_name": "Coastal Access Highway"},
            {"source": "WP_SOUTH_JUNCT", "target": "RC_NODE_BRAVO", "distance_km": 14.8, "condition_multiplier": 1.0, "is_blocked": False, "risk_factor": 1.0, "road_name": "Southern Bypass Ring Road"},
        ]

        for e_data in edges_data:
            s_id = node_map.get(e_data["source"])
            t_id = node_map.get(e_data["target"])
            if s_id and t_id:
                existing = db.query(RoadNetworkEdge).filter(
                    (RoadNetworkEdge.source_node_id == s_id) & (RoadNetworkEdge.target_node_id == t_id)
                ).first()
                if not existing:
                    edge = RoadNetworkEdge(
                        source_node_id=s_id,
                        target_node_id=t_id,
                        distance_km=e_data["distance_km"],
                        condition_multiplier=e_data["condition_multiplier"],
                        is_blocked=e_data["is_blocked"],
                        risk_factor=e_data["risk_factor"],
                        road_name=e_data["road_name"]
                    )
                    db.add(edge)
                    print(f"✓ Seeded Road Edge: {e_data['source']} <--> {e_data['target']} ({e_data['distance_km']} km)")

        db.commit()
        print("\nSUCCESS: All RESQ-X seed data initialized successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
