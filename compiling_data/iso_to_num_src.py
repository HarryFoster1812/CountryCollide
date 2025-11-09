import json
import pycountry

def create_alpha2_to_numeric_mapping(output_file):
    mapping = {}

    for country in pycountry.countries:
        # numeric is a string like "840" → convert to int for clarity
        mapping[country.alpha_2] = int(country.numeric)

    with open(output_file, 'w', encoding='utf-8') as out:
        json.dump(mapping, out, indent=2, ensure_ascii=False)

    print(f"✅ Created mapping of {len(mapping)} country codes to numeric IDs in '{output_file}'")


if __name__ == "__main__":
    output_file = input("Enter output filename: ").strip()
    create_alpha2_to_numeric_mapping(output_file)
