import http.server
import json
import os
import sys

PORT = 8000
WISHES_FILE = 'wishes.json'

import urllib.parse

class WeddingInviteHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/api/wishes':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Read wishes from wishes.json
            wishes = []
            if os.path.exists(WISHES_FILE):
                try:
                    with open(WISHES_FILE, 'r', encoding='utf-8') as f:
                        wishes = json.load(f)
                except Exception as e:
                    print(f"Error reading {WISHES_FILE}: {e}")
            else:
                # Initialize empty file with default structure
                with open(WISHES_FILE, 'w', encoding='utf-8') as f:
                    json.dump([], f)
            
            # Check for admin key
            query_params = urllib.parse.parse_qs(parsed_url.query)
            admin_key = query_params.get('admin', [''])[0]
            admin_header = self.headers.get('x-admin-key', '')
            input_key = admin_key or admin_header
            
            actual_admin_key = os.environ.get('ADMIN_KEY', 'my-secret-wedding-key')
            is_authorized = (input_key == actual_admin_key)
            
            # Scrub phone numbers if not authorized
            if not is_authorized:
                scrubbed_wishes = []
                for wish in wishes:
                    wish_copy = wish.copy()
                    if 'phone' in wish_copy:
                        del wish_copy['phone']
                    scrubbed_wishes.append(wish_copy)
                wishes = scrubbed_wishes
                    
            self.wfile.write(json.dumps(wishes).encode('utf-8'))
        else:
            # Serve static files normally
            super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/api/wishes':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                new_wish = json.loads(post_data.decode('utf-8'))
                
                # Read existing wishes
                wishes = []
                if os.path.exists(WISHES_FILE):
                    try:
                        with open(WISHES_FILE, 'r', encoding='utf-8') as f:
                            wishes = json.load(f)
                    except Exception as e:
                        print(f"Error reading wishes: {e}")
                
                # Append new wish
                wishes.append(new_wish)
                
                # Save wishes back to wishes.json
                with open(WISHES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(wishes, f, indent=2, ensure_ascii=False)
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # Ensure working directory is the folder of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)
    
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, WeddingInviteHandler)
    print(f"Starting local Wedding Invitation backend server on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        sys.exit(0)
