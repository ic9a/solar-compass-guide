import concurrent.futures
import json
import pathlib
import time
import urllib.parse
import urllib.request

scenarios = json.load(open("validation-work/canonical-scenarios.json", encoding="utf-8"))["scenarios"]
keys = {
    scenario["weatherKey"]: (
        scenario["input"]["location"]["lat"],
        scenario["input"]["location"]["lng"],
        scenario["matrix"]["orientation"],
        scenario["matrix"]["tiltDeg"] or 30,
    )
    for scenario in scenarios
}
aspects = {"south": 0, "south-east": -45, "east": -90, "west": 90, "north": 180}

def fetch_one(lat, lon, tilt, aspect):
    query = urllib.parse.urlencode({
        "lat": lat, "lon": lon, "peakpower": 1, "loss": 14,
        "angle": tilt, "aspect": aspect, "outputformat": "json",
    })
    url = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?" + query
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                data = json.load(response)
            return [month["E_m"] for month in data["outputs"]["monthly"]["fixed"]], url, data["inputs"]
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))

def work(item):
    key, (lat, lon, orientation, tilt) = item
    if orientation == "east-west":
        east, east_url, inputs = fetch_one(lat, lon, tilt, -90)
        west, west_url, _ = fetch_one(lat, lon, tilt, 90)
        values = [(left + right) / 2 for left, right in zip(east, west)]
        urls = [east_url, west_url]
    else:
        values, url, inputs = fetch_one(lat, lon, tilt, aspects[orientation])
        urls = [url]
    return key, {
        "monthlyKwhPerKwp": [round(value, 4) for value in values],
        "annualKwhPerKwp": round(sum(values), 4),
        "source": "PVGIS 5.3 PVcalc",
        "database": inputs.get("meteo_data", {}),
        "lossPercent": 14,
        "retrievalDate": "2026-07-30",
        "apiUrls": urls,
    }

output = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    for key, value in executor.map(work, keys.items()):
        output[key] = value
        print(key, value["annualKwhPerKwp"], flush=True)

pathlib.Path("validation-work/normalized-monthly.json").write_text(
    json.dumps({"schemaVersion": 1, "profiles": output}, indent=2) + "\n",
    encoding="utf-8",
)
