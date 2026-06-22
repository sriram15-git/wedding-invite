import urllib.request
import urllib.parse
import urllib.error
import json
import os
import base64

WISHES_FILE = "wishes.json"
DECRYPTION_KEY = "KarthikRadhika2026"

def decrypt_phone(cipher_text, key):
    if not cipher_text or cipher_text == "not specified":
        return "not specified"
    try:
        # Decode base64
        decoded_bytes = base64.b64decode(cipher_text.encode('utf-8'))
        decoded = decoded_bytes.decode('latin1')
        
        # XOR decryption
        result = ""
        for i, char in enumerate(decoded):
            char_code = ord(char) ^ ord(key[i % len(key)])
            result += chr(char_code)
        return result
    except Exception:
        # Fallback to returning original string in case it wasn't encrypted
        return cipher_text

def download_wishes():
    print("=" * 60)
    print("         WEDDING INVITATION RSVP DATABASE SYNC")
    print("=" * 60)
    
    # Get deployment URL
    default_url = "http://localhost:8000"
    vercel_url = input(f"Enter your Vercel URL (or press Enter for local '{default_url}'): ").strip()
    if not vercel_url:
        vercel_url = default_url
    
    # Ensure it starts with http/https and strip trailing slash
    if not vercel_url.startswith("http://") and not vercel_url.startswith("https://"):
        vercel_url = "https://" + vercel_url
    vercel_url = vercel_url.rstrip("/")
    
    # Get admin key
    default_admin_key = "my-secret-wedding-key"
    admin_key = input(f"Enter your ADMIN_KEY (or press Enter for default): ").strip()
    if not admin_key:
        admin_key = default_admin_key
        
    url = f"{vercel_url}/api/wishes?admin={urllib.parse.quote(admin_key)}"
    print(f"\nConnecting to: {vercel_url}/api/wishes...")
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as res:
            data = res.read().decode('utf-8')
            wishes = json.loads(data)
            
            if not isinstance(wishes, list):
                print(f"Error: Expected a list of wishes, got: {type(wishes)}")
                return
                
            # Decrypt phone numbers and clean records
            decrypted_count = 0
            for item in wishes:
                if 'phone' in item:
                    orig_phone = item['phone']
                    decrypted_phone = decrypt_phone(orig_phone, DECRYPTION_KEY)
                    item['phone'] = decrypted_phone
                    if decrypted_phone != orig_phone and decrypted_phone != "not specified":
                        decrypted_count += 1
                else:
                    item['phone'] = "not specified"
            
            # Save directly into local wishes.json
            with open(WISHES_FILE, 'w', encoding='utf-8') as f:
                json.dump(wishes, f, indent=2, ensure_ascii=False)
                
            print("-" * 60)
            print(f"Sync complete! Saved {len(wishes)} RSVPs to '{WISHES_FILE}'")
            if decrypted_count > 0:
                print(f"Successfully decrypted {decrypted_count} phone number(s) locally.")
            print("=" * 60)
            
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("\n[Error 401] Unauthorized. Your ADMIN_KEY is incorrect.")
        elif e.code == 404:
            print("\n[Error 404] Could not find the endpoint. Check your URL.")
        else:
            print(f"\nFailed to fetch wishes (HTTP {e.code}): {e.reason}")
    except Exception as e:
        print(f"\nFailed to connect: {e}")

if __name__ == '__main__':
    # Set execution directory to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)
    download_wishes()
