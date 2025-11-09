import json
import sys
import os

def main():
    # Ensure a folder was provided
    if len(sys.argv) < 2:
        print("Usage: python transform.py <input_folder>")
        sys.exit(1)

    input_folder = sys.argv[1]

    # Ensure input folder exists
    if not os.path.isdir(input_folder):
        print(f"Error: Folder '{input_folder}' not found.")
        sys.exit(1)

    # Output folder
    output_dir = "correct_json"
    os.makedirs(output_dir, exist_ok=True)

    # Get all .json files in the folder
    json_files = [f for f in os.listdir(input_folder) if f.lower().endswith(".json")]

    if not json_files:
        print(f"No JSON files found in '{input_folder}'.")
        sys.exit(0)

    # Process each JSON file
    for filename in json_files:
        input_file = os.path.join(input_folder, filename)
        print(f"📄 Processing: {filename}")

        # Read JSON data
        try:
            with open(input_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"  ❌ Error: Failed to parse JSON in '{filename}': {e}")
            continue

        # Transform data
        try:
            result = {}
            for item in data:
                # Get code from flagCode or cca2
                code = item.get("flagCode") or item.get("cca2")
                if not code:
                    print(f"  ⚠️  Skipping item in '{filename}' (no flagCode or cca2 found)")
                    continue

                # Copy all other keys except the one used as the code
                cleaned_item = {k: v for k, v in item.items() if k not in ("flagCode", "cca2")}
                result[code] = cleaned_item

        except Exception as e:
            print(f"  ❌ Error processing '{filename}': {e}")
            continue

        # Write to output folder
        output_file = os.path.join(output_dir, filename)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"  ✅ Saved to: {output_file}")

        # Delete the original file
        try:
            os.remove(input_file)
            print(f"  🗑️  Deleted: {input_file}")
        except OSError as e:
            print(f"  ⚠️  Warning: Could not delete '{filename}': {e}")

    print("\n🎉 All JSON files processed successfully!")

if __name__ == "__main__":
    main()

