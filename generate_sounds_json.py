import os
import json

def generate_json(directory, output_file):
    try:
        # List all files in the directory
        files = [f for f in os.listdir(directory) if f.endswith('.flac')]
        
        # Write the filenames to a JSON file
        with open(output_file, 'w') as json_file:
            json.dump(files, json_file, indent=4)
        
        print(f"JSON file '{output_file}' generated successfully!")
    except Exception as e:
        print(f"Error: {e}")

# Directory containing the .flac files
input_directory = r"C:\Users\nkodikal\OneDrive - azureford\Documents\JavaScript\e_tabla_V3\sounds\taals"  # Adjust the path as needed
output_json = r"C:\Users\nkodikal\OneDrive - azureford\Documents\JavaScript\e_tabla_V3\sounds\taals\taals.json"  # Adjust the path as needed

generate_json(input_directory, output_json)