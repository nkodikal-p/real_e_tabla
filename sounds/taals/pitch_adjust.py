import os
import sys

# Define input and output directories
INPUT_DIR = "input_audio_files"
OUTPUT_DIR = "processed_audio_output"

# Define paths for Audacity mod-script-pipe
TO_AUDACITY_PIPE = "\\.\\pipe\\ToAudacity"
FROM_AUDACITY_PIPE = "\\.\\pipe\\FromAudacity"

# Ensure the necessary directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

def send_command(command):
    """Sends a command string to Audacity."""
    try:
        with open(TO_AUDACITY_PIPE, 'w') as fp:
            fp.write(command + '\n')
            print(f"Sent: {command}")
    except FileNotFoundError:
        print(f"Error: Audacity pipe '{TO_AUDACITY_PIPE}' not found.")
        print("Please ensure Audacity is running and 'mod-script-pipe' is enabled in Preferences > Modules.")
        sys.exit(1)
    except Exception as e:
        print(f"Error sending command: {e}")
        sys.exit(1)

def get_response():
    """Reads the response from Audacity."""
    try:
        with open(FROM_AUDACITY_PIPE, 'r') as fp:
            response = fp.readline().strip()
            print(f"Received: {response}")
            return response
    except FileNotFoundError:
        print(f"Error: Audacity pipe '{FROM_AUDACITY_PIPE}' not found.")
        print("Please ensure Audacity is running and 'mod-script-pipe' is enabled in Preferences > Modules.")
        sys.exit(1)
    except Exception as e:
        print(f"Error receiving response: {e}")
        sys.exit(1)

def do_command(command):
    """Sends a command to Audacity and returns its response."""
    send_command(command)
    return get_response()

def process_file_with_bpm_adjustments(input_filepath):
    filename_with_ext = os.path.basename(input_filepath)
    filename_base, _ = os.path.splitext(filename_with_ext)

    # Extract BPM from the filename
    try:
        input_bpm = int(filename_base.split('_')[1])  # Assuming filename format: <name>_<bpm>_<pitch>
    except (IndexError, ValueError):
        print(f"Error: Unable to extract BPM from filename '{filename_with_ext}'. Ensure the filename format is correct.")
        return

    # Open the file in Audacity
    print(f"Opening file '{input_filepath}' in Audacity...")
    response = do_command(f'Open: Filename="{input_filepath}"')
    if "BatchCommand finished: OK" not in response:
        print(f"Failed to open file '{input_filepath}'. Response: {response}")
        return

    # Select all audio in the project
    do_command('SelectAll:')

    # Process each file to generate three versions with increased BPM
    for increment in [5, 10, 15]:
        target_bpm = input_bpm + increment
        percentage_change = ((target_bpm - input_bpm) / input_bpm) * 100

        # Step: Increase BPM
        print(f"Increasing BPM from {input_bpm} to {target_bpm} (+{increment} BPM)...")
        do_command(f'ChangeTempo: Percentage={percentage_change}')

        # Step: Export the modified file
        try:
            output_filename = f"{filename_base.split('_')[0]}_{target_bpm}_{filename_base.split('_')[2]}.flac"
            output_filepath = os.path.join(OUTPUT_DIR, output_filename)
            print(f"Exporting '{output_filepath}'...")
            response = do_command(f'Export2: Filename="{output_filepath}"')
            if "BatchCommand finished: OK" not in response:
                print(f"Failed to export file with BPM {target_bpm}. Response: {response}")
            else:
                print(f"Successfully exported '{output_filepath}'")
        except Exception as e:
            print(f"Error during export: {e}")

    # Close the project in Audacity
    print("Closing the project in Audacity...")
    do_command('Close: Save=0')

# Update main function to process all files in the input directory
def main():
    print("Starting Audacity batch processing script.")

    # Ensure input and output directories exist
    if not os.path.exists(INPUT_DIR):
        print(f"Input directory '{INPUT_DIR}' does not exist.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Process each file in the input directory
    for file_name in os.listdir(INPUT_DIR):
        if file_name.lower().endswith('.flac'):
            input_filepath = os.path.join(INPUT_DIR, file_name)
            process_file_with_bpm_adjustments(input_filepath)

    print("All files processed. Check the 'processed_audio_output' folder.")

# Entry point of the script
if __name__ == "__main__":
    main()