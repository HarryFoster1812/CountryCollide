import json
import urllib.request

def extract_country_names(source, output_file):
    # Detect whether the source is a URL or local file
    if source.startswith("http://") or source.startswith("https://"):
        print(f"🌍 Fetching GeoJSON data from URL: {source}")
        with urllib.request.urlopen(source) as response:
            data = json.load(response)
    else:
        print(f"📁 Reading GeoJSON data from file: {source}")
        with open(source, 'r', encoding='utf-8') as f:
            data = json.load(f)

    # Extract country names
    country_names = [feature["properties"]["name"] for feature in data["features"]]

    # ✅ Write as valid JSON array (not plain text)
    with open(output_file, 'w', encoding='utf-8') as out:
        json.dump(country_names, out, indent=2, ensure_ascii=False)

    print(f"✅ Extracted {len(country_names)} countries and saved to '{output_file}' (valid JSON format)")


if __name__ == "__main__":
    source = input("Enter GeoJSON filename or URL: ").strip()
    output_file = input("Enter output filename: ").strip()
    extract_country_names(source, output_file)
