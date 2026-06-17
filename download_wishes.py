import urllib.request
import urllib.error
import json
import os

DB_URL = "https://kvdb.io/A4r9M2B8u6c3D1z9fG8p/wedding_karthik_radhika_2026"
WISHES_FILE = "wishes.json"

def download_wishes():
    print("Connecting to cloud database...")
    try:
        req = urllib.request.Request(DB_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as res:
            data = res.read().decode('utf-8')
            wishes = json.loads(data)
            
            # Save directly into local wishes.json
            with open(WISHES_FILE, 'w', encoding='utf-8') as f:
                json.dump(wishes, f, indent=2, ensure_ascii=False)
                
            print(f"Success! Sync complete. {len(wishes)} guest RSVPs downloaded and saved locally in '{WISHES_FILE}'!")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("\n[Notice] No guest RSVPs have been submitted on the live site yet.")
            print("The cloud database is currently empty. Once your guests begin to submit RSVPs, they will appear here.")
            
            # Initialize wishes.json as an empty list if it does not exist
            if not os.path.exists(WISHES_FILE):
                with open(WISHES_FILE, 'w', encoding='utf-8') as f:
                    json.dump([], f)
                print(f"Initialized local database file: '{WISHES_FILE}'")
        else:
            print(f"Failed to fetch wishes from cloud (HTTP {e.code}): {e.reason}")
    except Exception as e:
        print(f"Failed to fetch wishes from cloud: {e}")

if __name__ == '__main__':
    # Set execution directory to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)
    download_wishes()
