import json
import ssl
import certifi
import pandas as pd
import requests
from meteostat import Point, Monthly, Stations
from datetime import datetime
from countryinfo import CountryInfo
import time
import os

# ✅ SSL fix (for macOS / Windows)
ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi.where())

# --- Settings ---
start = datetime(2015, 1, 1)
end = datetime(2024, 12, 31)
output_file = "global_monthly_climate.json"

# --- Load previous progress if exists ---
if os.path.exists(output_file):
    with open(output_file, "r") as f:
        all_data = json.load(f)
        processed = {item["country"] for item in all_data}
    print(f"🔄 Resuming progress ({len(processed)} countries already processed)")
else:
    all_data = []
    processed = set()

# --- Main Loop ---
for name in CountryInfo().all():
    if name in processed:
        continue

    try:
        info = CountryInfo(name).info()
        if "latlng" not in info:
            print(f"⚠️ Skipped {name}: no coordinates available")
            continue

        lat, lon = info["latlng"]
        location = Point(lat, lon)
        iso = info["ISO"]["alpha2"]

        # --- Try Meteostat first ---
        data = Monthly(location, start, end).fetch()

        # If Meteostat has no data, try nearest station
        if data.empty:
            stations = Stations().nearby(lat, lon).fetch(1)
            if not stations.empty:
                station_id = stations.index[0]
                data = Monthly(station_id, start, end).fetch()

        # If still no data, fallback to Open-Meteo
        if data.empty or not hasattr(data.index, "month"):
            print(f"⚠️ Meteostat unavailable for {name}, trying Open-Meteo...")
            try:
                url = (
                    f"https://climate-api.open-meteo.com/v1/climate?"
                    f"latitude={lat}&longitude={lon}"
                    f"&start_year=1991&end_year=2020"
                    f"&temperature_unit=celsius&precipitation_unit=mm"
                )
                r = requests.get(url, timeout=10)
                r.raise_for_status()
                om = r.json()

                if "monthly" in om and "temperature_2m_max" in om["monthly"]:
                    monthly = []
                    for i in range(12):
                        monthly.append({
                            "month": i + 1,
                            "avg_high_temp_C": round(om["monthly"]["temperature_2m_max"][i], 1),
                            "avg_low_temp_C": round(om["monthly"]["temperature_2m_min"][i], 1),
                            "avg_precip_mm": round(om["monthly"]["precipitation_sum"][i], 1)
                        })

                    all_data.append({
                        "country": name,
                        "iso": iso,
                        "latitude": lat,
                        "longitude": lon,
                        "source": "Open-Meteo",
                        "monthly_averages": monthly
                    })

                    print(f"✅ Processed {name} (via Open-Meteo)")
                else:
                    print(f"⚠️ Skipped {name}: no valid climate data (Open-Meteo empty)")
                continue  # Skip rest and move on to next country

            except Exception as e:
                print(f"⚠️ Skipped {name}: Open-Meteo failed ({e})")
                continue

        # --- Process Meteostat data ---
        averages = data[["tmin", "tmax", "prcp"]].groupby(data.index.month).mean()

        monthly = []
        for month, row in averages.iterrows():
            monthly.append({
                "month": int(month),
                "avg_high_temp_C": round(row["tmax"], 1) if not pd.isna(row["tmax"]) else None,
                "avg_low_temp_C": round(row["tmin"], 1) if not pd.isna(row["tmin"]) else None,
                "avg_precip_mm": round(row["prcp"], 1) if not pd.isna(row["prcp"]) else None
            })

        all_data.append({
            "country": name,
            "iso": iso,
            "latitude": lat,
            "longitude": lon,
            "source": "Meteostat",
            "monthly_averages": monthly
        })

        # --- Save progress ---
        with open(output_file, "w") as f:
            json.dump(all_data, f, indent=2)

        print(f"✅ Processed {name} (via Meteostat)")
        time.sleep(0.5)  # Rate-limit

    except Exception as e:
        print(f"⚠️ Skipped {name}: {e}")

print(f"🌍 Saved all data to {output_file}")
