import json
import sys
import os

def main():
    # Ensure a folder was provided
    if len(sys.argv) < 2:
        print("Usage: python combine_json.py <folder_with_transformed_json>")
        sys.exit(1)

    input_folder = sys.argv[1]

    # Ensure input folder exists
    if not os.path.isdir(input_folder):
        print(f"Error: Folder '{input_folder}' not found.")
        sys.exit(1)

    # Get all .json files in the folder
    json_files = [f for f in os.listdir(input_folder) if f.lower().endswith(".json")]

    if not json_files:
        print(f"No JSON files found in '{input_folder}'.")
        sys.exit(0)

    combined_data = {}

    # Process each JSON file
    for filename in json_files:
        file_path = os.path.join(input_folder, filename)
        print(f"📄 Reading: {filename}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if not isinstance(data, dict):
                print(f"  ⚠️ Skipping {filename}: not a JSON object.")
                continue

            # Merge logic — combine fields for same country code
            for country_code, country_data in data.items():
                if country_code not in combined_data:
                    combined_data[country_code] = country_data
                else:
                    # Merge nested dictionaries, preferring non-null / non-empty values
                    for key, value in country_data.items():
                        if value not in [None, "", []]:
                            combined_data[country_code][key] = value

        except json.JSONDecodeError as e:
            print(f"  ❌ Error parsing {filename}: {e}")
        except Exception as e:
            print(f"  ❌ Error reading {filename}: {e}")

    # Output file path — in the current working directory
    output_file = os.path.join(os.getcwd(), "combined.json")

    # Write combined JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(combined_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Combined JSON written to: {output_file}")
    print(f"📦 Total countries combined: {len(combined_data)}")

if __name__ == "__main__":
    main()
