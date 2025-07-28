import os

TO_AUDACITY_PIPE = "\\\\.\\pipe\\ToAudacity"
FROM_AUDACITY_PIPE = "\\\\.\\pipe\\FromAudacity"

try:
    # Test writing to the pipe
    with open(TO_AUDACITY_PIPE, 'w') as to_pipe:
        to_pipe.write("Help:\n")
        print("Command sent to Audacity.")

    # Test reading from the pipe
    with open(FROM_AUDACITY_PIPE, 'r') as from_pipe:
        response = from_pipe.readline().strip()
        print(f"Response from Audacity: {response}")
except FileNotFoundError:
    print("Named pipe not found. Ensure Audacity is running and mod-script-pipe is enabled.")
except Exception as e:
    print(f"Error: {e}")