"""
Seed realistic requisitions across ALL 10 Relief Centers with MULTIPLE Disaster Types.
Disaster Types: FLOOD, CYCLONE, EARTHQUAKE, LANDSLIDE, TSUNAMI, FIRE
"""
import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = "C:/Users/dheem/.gemini/antigravity/scratch/resq-x/backend/resqx_local.db"

def seed_diverse_requests():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Fetch all centers
    c.execute("SELECT id, name, code, latitude, longitude FROM relief_centers ORDER BY id ASC")
    centers = c.fetchall()
    print(f"Found {len(centers)} relief centers in database.")

    # 2. Fetch all inventory resources
    c.execute("SELECT id, sku, name, available_stock, category FROM resource_inventory ORDER BY id ASC")
    resources = c.fetchall()
    print(f"Found {len(resources)} inventory items in database.")

    # Disaster scenarios configured per center
    scenarios = [
        # (center_id, disaster_type, severity, urgency, sector, affected, families, children, medical, notes)
        (1, "FLOOD", "CRITICAL", "CRITICAL", "Godavari River Embankment Sector 4", 2500, 520, 480, 110, "River breached western embankment; immediate high-calorie rations and water needed."),
        (2, "CYCLONE", "CRITICAL", "CRITICAL", "Bay of Bengal Coastal Highway KM-14", 3200, 680, 620, 145, "Severe Category 4 cyclone landfall; roofs blown off, power grid down."),
        (3, "LANDSLIDE", "HIGH", "HIGH", "Western Ghats Mountain Pass KM-88", 850, 180, 160, 45, "Debris flow blocked main evacuation artery; temporary tents and medical kits required."),
        (4, "CYCLONE", "HIGH", "HIGH", "Mahanadi Estuary Fishermen Colony", 1950, 410, 390, 80, "Tidal surge inundated 4 villages; potable water supplies contaminated."),
        (5, "FLOOD", "CRITICAL", "CRITICAL", "Himalayan Gorge Lower Basin", 1400, 300, 270, 65, "Flash flood destroyed suspension bridges; emergency satellite communications essential."),
        (6, "TSUNAMI", "CRITICAL", "CRITICAL", "Andaman Offshore Ridge Coral Bay", 2100, 450, 410, 95, "Seismic sea wave damaged jetty; potable water and trauma kits urgent."),
        (7, "EARTHQUAKE", "CRITICAL", "CRITICAL", "Kutch Rann Fault Zone Sector 8", 4500, 950, 880, 260, "Magnitude 6.8 tremor caused widespread structural collapse; field trauma surgery supplies urgently requested."),
        (8, "FLOOD", "MEDIUM", "MEDIUM", "Metro South Submerged Ward 12", 1100, 240, 210, 35, "Urban stormwater backlog; water purification tablets and bedding packets requested."),
        (9, "FIRE", "HIGH", "HIGH", "Bandipur Forest Fringe Settlement", 950, 200, 190, 50, "Wildfire perimeter advancing towards settlement; burn dressing kits and thermal shelters needed."),
        (10, "FLOOD", "CRITICAL", "CRITICAL", "Majuli Island Riverine Sector 10", 3800, 800, 750, 180, "Island cut off by Brahmaputra floodwaters; air-droppable rations and emergency kits needed."),
        
        # Additional secondary requests to provide diverse statuses across centers
        (2, "CYCLONE", "HIGH", "HIGH", "Dhamra Port Coastal Village", 1200, 250, 230, 40, "Secondary surge flooded drinking wells."),
        (3, "LANDSLIDE", "MEDIUM", "MEDIUM", "Hill Station Valley Approach", 600, 120, 110, 20, "Road clearing in progress; blankets requested."),
        (7, "EARTHQUAKE", "HIGH", "HIGH", "Bhuj Suburban Residential Sector", 2200, 460, 420, 120, "Aftershocks causing structural tremors; temporary tents needed."),
        (9, "FIRE", "CRITICAL", "CRITICAL", "North Ridge Forest Buffer Zone", 1600, 340, 310, 75, "Severe smoke inhalation cases; oxygen supplies and trauma packs requested.")
    ]

    base_time = datetime.utcnow()

    for idx, sc in enumerate(scenarios, start=101):
        center_id, disaster_type, severity, urgency, sector, affected, families, children, medical, notes = sc
        req_number = f"REQ-20261114-{disaster_type[:3]}-{center_id:02d}{idx}"
        
        # Status distribution: mostly PENDING for triage, some UNDER_REVIEW
        status = "PENDING" if idx % 3 != 0 else "UNDER_REVIEW"

        created_time = (base_time - timedelta(hours=random.randint(1, 48), minutes=random.randint(5, 55))).strftime("%Y-%m-%d %H:%M:%S")

        # Insert resource request
        c.execute("""
            INSERT INTO resource_requests (
                request_number, center_id, status, urgency_level, affected_count,
                num_families, children_elderly_count, medical_assistance_count,
                disaster_type, disaster_severity, affected_location,
                special_instructions, operator_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            req_number, center_id, status, urgency, affected,
            families, children, medical, disaster_type, severity, sector,
            notes, None, created_time, created_time
        ))
        
        req_id = c.lastrowid

        # Attach 4-6 appropriate resource items
        # Select items based on disaster type
        if disaster_type == "FLOOD":
            target_categories = ["POTABLE_WATER", "FOOD_RATIONS", "SHELTER_AND_BEDDING", "MEDICAL_SUPPLIES"]
        elif disaster_type == "EARTHQUAKE":
            target_categories = ["MEDICAL_SUPPLIES", "SHELTER_AND_BEDDING", "RESCUE_EQUIPMENT", "POWER_AND_COMMUNICATION"]
        elif disaster_type == "FIRE":
            target_categories = ["MEDICAL_SUPPLIES", "SHELTER_AND_BEDDING", "POWER_AND_COMMUNICATION", "POTABLE_WATER"]
        elif disaster_type == "CYCLONE":
            target_categories = ["SHELTER_AND_BEDDING", "POTABLE_WATER", "FOOD_RATIONS", "POWER_AND_COMMUNICATION"]
        elif disaster_type == "LANDSLIDE":
            target_categories = ["RESCUE_EQUIPMENT", "MEDICAL_SUPPLIES", "SHELTER_AND_BEDDING", "FOOD_RATIONS"]
        else: # TSUNAMI
            target_categories = ["POTABLE_WATER", "FOOD_RATIONS", "MEDICAL_SUPPLIES", "SHELTER_AND_BEDDING"]

        candidate_resources = [r for r in resources if r[4] in target_categories]
        selected_res = random.sample(candidate_resources, min(5, len(candidate_resources)))

        for res in selected_res:
            res_id, sku, name, avail, cat = res
            # Scale requested quantity reasonably based on affected population
            if cat == "POTABLE_WATER":
                requested = min(500, max(50, families * 2))
            elif cat == "FOOD_RATIONS":
                requested = min(600, max(40, families * 3))
            elif cat == "MEDICAL_SUPPLIES":
                requested = min(150, max(10, medical // 2 + 5))
            elif cat == "SHELTER_AND_BEDDING":
                requested = min(300, max(20, families // 2))
            elif cat == "POWER_AND_COMMUNICATION":
                requested = random.randint(5, 25)
            else: # RESCUE_EQUIPMENT
                requested = random.randint(10, 40)

            c.execute("""
                INSERT INTO request_items (
                    request_id, resource_id, requested_qty, approved_qty, dispatched_qty
                ) VALUES (?, ?, ?, 0, 0)
            """, (req_id, res_id, requested))

    conn.commit()
    conn.close()
    print("Successfully seeded diverse requisitions across all 10 relief centers!")

if __name__ == "__main__":
    seed_diverse_requests()
