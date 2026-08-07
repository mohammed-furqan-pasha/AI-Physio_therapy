# AI Physiotherapy — Setup

## 1. Install dependencies
```bash
npm install
```

## 2. Environment variables
Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project settings.
- `GOOGLE_GENAI_API_KEY` — from Google AI Studio (server-side only, never exposed to the client).
- `NEXT_PUBLIC_PEERJS_*` — leave blank to use PeerJS's free public broker (fine for dev / same-WiFi pairing).

## 3. Database
Run `supabase/schema.sql` once in your Supabase project's SQL editor. It creates the `sessions`
table (session summaries only — no live data) with row-level security so each user only sees their
own history.

Enable **Email OTP (magic link)** auth in Supabase Auth settings — this app uses passwordless login
so the same account works seamlessly across laptop and phone.

## 4. Run
```bash
npm run dev
```
Open the app on your laptop, sign in, click **Start Exercise Session** to get a QR code. Then open
the app on your phone (same account, or scan and it'll prompt login), click **Connect Camera**, and
scan the code. Both devices must be reachable over WebRTC (same local network works out of the box).

## Notes
- MediaPipe pose model + WASM assets are loaded from CDN on first use — an internet connection is
  required (this is a known MVP tradeoff, noted in the PWA section of the spec).
- No exercise/rep data is ever written to the database during a live session — only a single summary
  row is inserted when "Finish Session" is clicked.
- PDFs/images uploaded for report parsing are sent directly to Gemini as inline base64 data and are
  never persisted to disk or a storage bucket.
