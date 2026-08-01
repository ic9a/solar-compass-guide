import json
from pathlib import Path

LOCATIONS = [
    ("bucharest", "București", 44.4268, 26.1025),
    ("brasov", "Brașov", 45.6579, 25.6012),
    ("cluj-napoca", "Cluj-Napoca", 46.7712, 23.6236),
    ("constanta", "Constanța", 44.1598, 28.6348),
    ("craiova", "Craiova", 44.3302, 23.7949),
    ("iasi", "Iași", 47.1585, 27.6014),
    ("timisoara", "Timișoara", 45.7489, 21.2087),
    ("suceava", "Suceava", 47.6514, 26.2556),
]
CONSUMPTIONS = [180, 300, 450, 700]
USAGE = ["day", "evening", "constant"]
ORIENTATIONS = ["south", "south-east", "east", "west", "east-west", "north"]
TILTS = [15, 30, 45, None]
SHADING = ["none", "light", "moderate", "severe"]
LOADS = ["none", "ev-day", "ev-overnight", "heat-pump", "boiler"]
ROOFS = ["unrestricted", "small", "max-panels", "apartment"]
BATTERIES = ["none", "compare", "practical", "backup", "backup-infeasible"]
GOALS = ["bill", "payback", "independence", "backup", "ev"]

def future_load(kind: str, index: int):
    if kind == "none":
        return []
    if kind.startswith("ev"):
        return [{
            "id": f"ev-{index}",
            "kind": "ev",
            "status": "planned",
            "evKmPerYear": 14000,
            "evEfficiencyKwhPer100Km": 18,
            "evHomeChargingPercent": 80,
            "timing": "day" if kind == "ev-day" else "evening",
            "label": "Mașină electrică",
        }]
    if kind == "heat-pump":
        return [{"id": f"hp-{index}", "kind": "heat-pump", "status": "planned",
                 "annualKwh": 4200, "timing": "constant", "primaryHeating": True,
                 "label": "Pompă de căldură"}]
    return [{"id": f"boiler-{index}", "kind": "boiler", "status": "planned",
             "annualKwh": 1800, "timing": "evening", "label": "Boiler electric"}]

def roof_fields(kind: str):
    if kind == "small":
        return {"usableRoofAreaM2": 18}
    if kind == "max-panels":
        return {"maxPanelCount": 12}
    if kind == "apartment":
        return {"buildingType": "apartment", "maxPanelCount": 8}
    return {"buildingType": "house"}

scenarios = []
for index in range(64):
    slug, name, lat, lon = LOCATIONS[index % len(LOCATIONS)]
    load_kind = LOADS[index % len(LOADS)]
    roof_kind = ROOFS[(index // 2) % len(ROOFS)]
    battery_case = BATTERIES[(index // 3) % len(BATTERIES)]
    preference = "backup" if battery_case.startswith("backup") else battery_case
    monthly = CONSUMPTIONS[(index // 4) % len(CONSUMPTIONS)]
    orientation = ORIENTATIONS[index % len(ORIENTATIONS)]
    tilt = TILTS[(index // 5) % len(TILTS)]
    shading = SHADING[(index // 7) % len(SHADING)]
    usage = USAGE[(index // 3) % len(USAGE)]
    location_precision = "county" if index in (14, 29, 46, 61) else "precise"
    data = {
        "schemaVersion": 2,
        "consumptionMode": "monthly-kwh",
        "monthlyConsumptionKwh": monthly,
        "usageProfile": usage,
        "loads": future_load(load_kind, index),
        "noLargeLoads": load_kind == "none",
        "location": {"lat": lat, "lng": lon, "locality": name, "countyName": name},
        "locationPrecision": location_precision,
        "orientation": orientation,
        "shading": shading,
        "connectionType": "unknown" if index % 9 == 0 else "three-phase",
        "goal": GOALS[index % len(GOALS)],
        "batteryPreference": preference,
        **roof_fields(roof_kind),
    }
    if tilt is not None:
        data["tiltDeg"] = tilt
    if battery_case.startswith("backup"):
        data["backupEssentialLoadKw"] = 12 if battery_case == "backup-infeasible" else 1.2
        data["backupHours"] = 16 if battery_case == "backup-infeasible" else 6
    scenarios.append({
        "id": f"RO-{index + 1:03d}",
        "locationFixture": slug,
        "weatherKey": f"{slug}|{orientation}|{tilt or 30}",
        "matrix": {
            "monthlyConsumptionKwh": monthly,
            "usageProfile": usage,
            "orientation": orientation,
            "tiltDeg": tilt,
            "shading": shading,
            "futureLoad": load_kind,
            "roofLimit": roof_kind,
            "battery": battery_case,
        },
        "input": data,
        "assumptionsVersion": "RO-2026.07-v3",
    })

Path("validation-work/canonical-scenarios.json").write_text(
    json.dumps({"schemaVersion": 1, "count": len(scenarios), "scenarios": scenarios},
               ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
