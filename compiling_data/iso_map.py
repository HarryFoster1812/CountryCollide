import json
import pycountry
from difflib import get_close_matches

def get_iso_code(name):
    # Direct match first
    country = pycountry.countries.get(name=name)
    if country:
        return country.alpha_2

    # Manual fallback mapping
    fallback = {
        "Ivory Coast": "CI",
        "The Bahamas": "BS",
        "Bolivia": "BO",
        "Brunei": "BN",
        "Democratic Republic of the Congo": "CD",
        "Republic of the Congo": "CG",
        "Czech Republic": "CZ",
        "Iran": "IR",
        "South Korea": "KR",
        "North Korea": "KP",
        "Kosovo": "XK",
        "Laos": "LA",
        "Moldova": "MD",
        "Macedonia": "MK",
        "Russia": "RU",
        "Swaziland": "SZ",
        "Syria": "SY",
        "East Timor": "TL",
        "Turkey": "TR",
        "Taiwan": "TW",
        "United Republic of Tanzania": "TZ",
        "USA": "US",
        "Venezuela": "VE",
        "Vietnam": "VN",
        "French Southern and Antarctic Lands": "TF",
        "Guinea Bissau": "GW",
        "Somaliland": "EZ",
        "Republic of Serbia": "RS",
        "England": "GB",
        "West Bank": "PS",
        "Northern Cyprus": "CY"
    }
    if name in fallback:
        return fallback[name]

    # Fuzzy match fallback
    names = [c.name for c in pycountry.countries]
    match = get_close_matches(name, names, n=1, cutoff=0.8)
    if match:
        country = pycountry.countries.get(name=match[0])
        if country:
            return country.alpha_2

    return None


def fix_null_codes(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Normalize input: if it's a list, turn it into a dict with None values
    if isinstance(data, list):
        # If list of lists (pairs)
        if all(isinstance(x, list) and len(x) == 2 for x in data):
            mapping = {name: code for name, code in data}
        else:
            mapping = {name: None for name in data}
    else:
        mapping = data

    fixed = {}
    nulls_fixed = []
    still_null = []

    for country, code in mapping.items():
        if code is None:
            new_code = get_iso_code(country)
            if new_code:
                fixed[country] = new_code
                nulls_fixed.append((country, new_code))
            else:
                fixed[country] = None
                still_null.append(country)
        else:
            fixed[country] = code

    with open(output_file, 'w', encoding='utf-8') as out:
        json.dump(fixed, out, indent=2, ensure_ascii=False)

    print(f"✅ Fixed {len(nulls_fixed)} missing codes. Saved to '{output_file}'.")
    if still_null:
        print("\n⚠️ Still unmatched countries:")
        for name in still_null:
            print(" -", name)


if __name__ == "__main__":
    input_file = input("Enter input mapping filename: ").strip()
    output_file = input("Enter output filename: ").strip()
    fix_null_codes(input_file, output_file)
