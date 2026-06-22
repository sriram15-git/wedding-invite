import fs from 'fs';
import path from 'path';

// If running on Vercel with KV database attached
const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  // CORS Headers for secure access
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isVercel = !!KV_REST_API_URL;

  // GET: Fetch all guest wishes
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const adminQuery = url.searchParams.get('admin');
      const adminHeader = req.headers['x-admin-key'];
      const inputKey = adminQuery || adminHeader;
      
      const actualAdminKey = process.env.ADMIN_KEY || "my-secret-wedding-key";
      const isAuthorized = inputKey === actualAdminKey;

      let wishes = [];

      if (isVercel) {
        // Read from Vercel KV store
        const response = await fetch(`${KV_REST_API_URL}/get/wedding_wishes`, {
          headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` }
        });
        if (response.ok) {
          const result = await response.json();
          const wishesStr = result.result;
          wishes = wishesStr ? JSON.parse(wishesStr) : [];
        } else {
          return res.status(500).json({ error: "Failed to read from Vercel KV" });
        }
      } else {
        // Local: Read wishes from wishes.json
        const filePath = path.join(process.cwd(), 'wishes.json');
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          wishes = JSON.parse(fileData || '[]');
        }
      }

      // If not authorized, sanitize output by stripping phone numbers
      if (!isAuthorized) {
        wishes = wishes.map(wish => {
          const { phone, ...rest } = wish;
          return rest;
        });
      }

      return res.status(200).json(wishes);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST: Add new guest wish
  if (req.method === 'POST') {
    try {
      const newWish = req.body;
      if (!newWish || !newWish.name) {
        return res.status(400).json({ error: "Invalid wish payload" });
      }

      let wishes = [];

      if (isVercel) {
        // Get existing wishes from Vercel KV
        const getRes = await fetch(`${KV_REST_API_URL}/get/wedding_wishes`, {
          headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` }
        });
        if (getRes.ok) {
          const result = await getRes.json();
          wishes = result.result ? JSON.parse(result.result) : [];
        }

        // Append new wish
        wishes.unshift(newWish); // Prepend to list

        // Save back to Vercel KV
        const setRes = await fetch(`${KV_REST_API_URL}/set/wedding_wishes`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(JSON.stringify(wishes)) // Stringify twice because Redis stores string values
        });

        if (setRes.ok) {
          return res.status(200).json({ status: "success" });
        }
        return res.status(500).json({ error: "Failed to save to Vercel KV" });
      } else {
        // Local: Read local file, append wish, and save
        const filePath = path.join(process.cwd(), 'wishes.json');
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          wishes = JSON.parse(fileData || '[]');
        }
        wishes.unshift(newWish);
        fs.writeFileSync(filePath, JSON.stringify(wishes, null, 2), 'utf8');
        return res.status(200).json({ status: "success" });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
