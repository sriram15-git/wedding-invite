import urllib.request
import json
import base64

# Encrypt helper to simulate client JS
def encrypt_phone(text, key):
    cleaned = "".join([c for c in text if c.isdigit() or c in "+- ()"])
    result = ""
    for i, char in enumerate(cleaned):
        char_code = ord(char) ^ ord(key[i % len(key)])
        result += chr(char_code)
    return base64.b64encode(result.encode('latin1')).decode('utf-8')

# 1. Create a mock RSVP payload
# Note: Name is empty to test the "not specified" default!
payload = {
    "name": "not specified",
    "phone": encrypt_phone("9876543210", "KarthikRadhika2026"),
    "attendance": "not specified",
    "wishes": "Wishing you both a lifetime of happiness!",
    "timestamp": 1781298492000
}

url = "http://localhost:8000/api/wishes"

print("Sending POST request to local server...")
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as res:
        print("POST Response Status:", res.status)
        print("POST Response Data:", res.read().decode('utf-8'))
except Exception as e:
    print("POST Failed:", e)
