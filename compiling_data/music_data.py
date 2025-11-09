import requests
from bs4 import BeautifulSoup
import json
import time
import re

BASE_URL = "https://kworb.net/spotify/"

# Kworb → ISO A2 corrections
KWORB_TO_ISO = {
    "gb": "uk",  # Great Britain → United Kingdom
    # add more if needed later
}


def get_country_codes():
    """Scrape Kworb main Spotify page and extract main country names + codes."""
    response = requests.get(BASE_URL)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    country_data = {}
    # Find all tables that list countries (main table)
    for row in soup.select("table tr"):
        first_link = row.find("a", href=re.compile(r"^country/[a-z]+_daily_totals\.html$"))
        if not first_link:
            continue

        href = first_link["href"]
        match = re.search(r"country/([a-z]+)_daily_totals\.html", href)
        if not match:
            continue

        kworb_code = match.group(1)
        name = row.text.split("\n")[0]
        iso_code = KWORB_TO_ISO.get(kworb_code, kworb_code)
        country_data[iso_code.upper()] = {
            "kworb_code": kworb_code,
            "name": name
        }

    return country_data


def get_top_songs(kworb_code, chart_type="daily", limit=10):
    """Fetch top songs for a given country code from Kworb."""
    url = f"{BASE_URL}country/{kworb_code}_{chart_type}_totals.html"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"⚠️  Skipping {kworb_code} ({response.status_code})")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    rows = soup.select("table tr")[1:limit + 1]
    songs = []
    for row in rows:
        cells = row.find_all("td")
        if len(cells) >= 4:
            song = {
                "rank": cells[0].text.strip(),
                "title": cells[1].text.strip(),
                "artist": cells[2].text.strip(),
                "streams": cells[3].text.strip(),
                "link": f"https://kworb.net/spotify/{cells[1].find('a')['href']}" if cells[1].find("a") else None
            }
            songs.append(song)
    return songs


def scrape_all_countries(chart_type="daily"):
    """Scrape all countries’ top 10 songs, with proper country names."""
    all_data = {}
    countries = get_country_codes()
    print(f"Found {len(countries)} countries.")

    for i, (iso_code, info) in enumerate(countries.items(), 1):
        print(f"[{i}/{len(countries)}] Scraping {info['name']} ({iso_code})...")
        songs = get_top_songs(info["kworb_code"], chart_type)
        if songs:
            all_data[iso_code] = {
                "country_name": info["name"],
                "songs": songs
            }
        time.sleep(1)  # polite delay
    return all_data


if __name__ == "__main__":
    data = scrape_all_countries(chart_type="daily")
    with open("spotify_top10_by_country.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("✅ Done! Saved to spotify_top10_by_country.json")
