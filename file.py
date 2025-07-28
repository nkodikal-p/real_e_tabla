import os
import requests

# URLs of the ogg files to download
file_urls = {
    "Dha": "https://cdn.freesound.org/previews/56/56144_693224-lq.ogg",
    "Dhin": "https://cdn.freesound.org/previews/56/56145_693224-lq.ogg",
    "Ge": "https://cdn.freesound.org/previews/56/56146_693224-lq.ogg",
    "Ke": "https://cdn.freesound.org/previews/56/56147_693224-lq.ogg",
    "Na": "https://cdn.freesound.org/previews/56/56148_693224-lq.ogg",
    "Re": "https://cdn.freesound.org/previews/56/56149_693224-lq.ogg",
    "Ta": "https://cdn.freesound.org/previews/56/56150_693224-lq.ogg",
    "Te": "https://cdn.freesound.org/previews/56/56151_693224-lq.ogg",
    "Tin": "https://cdn.freesound.org/previews/56/56152_693224-lq.ogg",
    "Tun": "https://cdn.freesound.org/previews/56/56153_693224-lq.ogg"
}

# Ensure the sounds directory exists
os.makedirs('sounds', exist_ok=True)

# Function to download files
def download_files():
    for filename, url in file_urls.items():
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()  # Check if the request was successful
            with open(f'sounds/{filename}.ogg', 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)
            print(f"Downloaded {filename}.ogg")
        except requests.exceptions.RequestException as e:
            print(f"Failed to download {filename}.ogg: {e}")

download_files()

# get filenames without extension in sounds folder and store in a list
# return the list
def get_filenames():
    # get all files in sounds folder
    files = os.listdir(r"C:\Users\nkodikal\Documents\JavaScript\e_tabla\sounds")
    # get filenames without extension
    filenames = [file for file in files]
    # create a dictionary with filenames without extension as key and filenames with extension as value
    filenames = {file.split(".")[0]: file for file in filenames}
    return filenames

print(get_filenames())

