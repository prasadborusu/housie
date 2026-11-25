# 🎟️ HOUSEY — Modern Real-time Multiplayer Tambola (Housie / Bingo)

A complete, modern, responsive multiplayer Tambola web application built with **React 19**, **Tailwind CSS v4**, **Node.js**, **Express**, **Socket.IO**, and **Supabase**.

---

## 🌟 Highlights & Features

- **🎨 Modern Visual Design**:
  - Warm off-white background (`#FAF8F5`)
  - Deep dark navy text (`#0F172A`)
  - Emerald green accents (`#059669` / `#10B981`) & Amber awards (`#F59E0B`)
  - Rounded cards, subtle elevation shadows, and polished mobile-first responsive layout.
- **🔐 Privacy First**:
  - Name and email validation on entry (no passwords required).
  - Emails are kept strictly private on the server and are **never** broadcasted or disclosed to other players.
- **🛡️ Hidden Admin Portal & 4-Digit Passcode Lock**:
  - **Master Lock**: Secured by 4-digit PIN (default **`123`** / **`1234`**, configurable via `ADMIN_PIN` in `.env`).
  - **Hidden Access Points**:
    1. Triple-click (3 clicks) on the HOUSEY **"H"** logo in the top bar.
    2. Direct URL: `http://localhost:3001/?admin=true` or `/admin`.
    3. Discreet "Admin Portal" link at the bottom of the join room screen.
  - **Admin-Only Room Creation**: Regular players can **only join** games. Only the Admin can create and configure game rooms!
  - **Room Pass Key**: When creating a room, Admin can optionally set a **Room Pass Key** (e.g. `9999`). Players must enter both the 4-digit Room Code and the Pass Key to enter.
  - **Live Room Management**: Admin can monitor all active rooms, view player counts, copy codes & pass keys, or terminate rooms.
- **☁️ Supabase Cloud Database**:
  - Optional cloud persistence for rooms, players, tickets, game state, and winning claims.
  - Automated fallback to high-speed in-memory mode if Supabase credentials are not configured.
  - Ready-to-run schema file provided in [`supabase_schema.sql`](file:///d:/New%20folder%20(8)/tambola/supabase_schema.sql).
- **🔢 4-Digit Room Code Screen**:
  - 4 individual numeric input boxes with auto-focus, automatic advance, backspace navigation, arrow key support, and full paste handling (e.g. pasting `"4829"` splits across all 4 boxes).
  - Dedicated Pass Key field when joining protected rooms.
  - State preservation when navigating back.
- **👥 Waiting Room Lobby**:
  - Real-time player synchronization for joins and leaves.
  - One-click **Copy Room Code** and **Share Direct Link** (`?room=XXXX`).
  - Real-time player roster with host badge and connection status.
  - Live preview of player's certified Tambola ticket.
  - Interactive "How to Win" rules guide.
- **🎫 Certified Fair 90-Number Tambola Tickets**:
  - Strict standard Tambola layout: **3 rows, 9 columns, exactly 15 numbers (5 numbers per row)**.
  - Standard column distribution: Col 1 (`1–9`), Col 2 (`10–19`), ..., Col 9 (`80–90`).
  - Numbers strictly sorted in ascending order from top to bottom.
  - Each column has at least 1 number and at most 3 numbers.
- **⚡ Authentic Manual Marking**:
  - Players actively listen for the call and tap their numbers to mark them with a green checkmark stamp.
  - If an uncalled number is tapped, an alert informs the player (*"Number X has not been called yet!"*) so they stay on track.
  - Giant animated number ball with sound synthesis and pop-in keyframe animations.
  - Web Audio API chime sounds + speech synthesis announcer (*"Number 42!"*) with mute and voice toggles.
  - Recent call roll (last 5 numbers called) and 1–90 Master Board modal.
  - Session reconnection: players can refresh without losing their ticket or progress.
- **👑 Host / Admin Game Controls**:
  - **Start Game**
  - **Pause / Resume** auto-caller
  - **Next Number** (manual single number draw)
  - **Configurable Auto-Call Speeds**: 3s (Fast), 5s (Normal), 8s (Relaxed), 10s (Casual)
  - **End Game**
  - **Play Again / New Round** (resets numbers, issues fresh tickets, keeps players in the room)
- **🏆 Secure Server-Side Winning Claims**:
  - Validates all claims securely on the backend against the player's actual ticket and the server's set of called numbers:
    1. **⚡ Early Five**: First to strike any 5 numbers anywhere on the ticket.
    2. **🥇 Top Line**: All 5 numbers in the top row.
    3. **🥈 Middle Line**: All 5 numbers in the middle row.
    4. **🥉 Bottom Line**: All 5 numbers in the bottom row.
    5. **👑 Full House**: All 15 numbers on the ticket.
  - **Bogus Claim Protection**: Rejects bogus claims with detailed explanation of missing numbers, playing an error buzz.
  - **Duplicate Claim Protection**: Prevents duplicate claims once a category has been awarded.
  - **Celebration Effects**: Confetti bursts, fanfare chimes, and instant room-wide winner announcements.

---

## 📁 Project Architecture

```
tambola/
├── client/                     # Frontend Application (React 19 + Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header, branding with 3-click secret admin trigger, sound toggles
│   │   │   ├── HomeScreen.jsx      # Welcome screen, name + email validation, Enter Game
│   │   │   ├── RoomCodeScreen.jsx  # 4-digit numeric input with auto-advance, paste & pass key field
│   │   │   ├── AdminPage.jsx       # 4-digit PIN lock screen, room creator, pass key setup, live monitor
│   │   │   ├── LobbyScreen.jsx     # Waiting room, player roster, ticket preview, host controls
│   │   │   ├── LiveGameScreen.jsx  # Current number ball, call history, manual ticket, claims, host panel
│   │   │   ├── TambolaTicket.jsx   # 3x9 certified Tambola ticket with manual daubing & row progress
│   │   │   ├── ClaimsSection.jsx   # 5 prize categories with live progress & claim buttons
│   │   │   ├── HostControls.jsx    # Host auto-draw, pause, resume, speed, and manual call
│   │   │   ├── BoardModal.jsx      # Full 1-90 master board drawer/modal
│   │   │   ├── ResultsScreen.jsx   # Leaderboard of winners, stats, Play Again button
│   │   │   ├── LeaveModal.jsx      # Leave game confirmation dialog
│   │   │   └── Toast.jsx           # Notification toast alerts
│   │   ├── utils/
│   │   │   ├── socket.js           # Socket.IO client instance with auto-reconnection
│   │   │   └── sound.js            # Web Audio API sound generator & speech announcer
│   │   ├── App.jsx                 # Master application controller & state machine
│   │   ├── index.css               # Styling, animations, custom scrollbars
│   │   └── main.jsx
│   ├── vite.config.js              # Vite configuration with proxy
│   └── package.json
├── server/                     # Backend Application (Node.js + Express + Socket.IO + Supabase)
│   ├── server.js                   # Express server, Socket.IO handlers, room store, auto-caller, admin API
│   ├── supabase.js                 # Supabase client integration & sync handlers
│   ├── ticketGenerator.js          # Certified 3x9 Tambola ticket generator algorithm
│   └── claims.js                   # Server-side validation logic for all 5 claims
├── tests/                      # Automated Verification & Test Suite
│   ├── verify_game.js              # 100 ticket validation & unit tests for claim logic
│   ├── verify_multiplayer_socket.js# Multi-client socket integration & privacy tests
│   └── verify_admin_and_supabase.js# Admin PIN lock, pass key & Supabase sync tests
├── .env.example                # Example environment variables
├── .env                        # Local environment variables
├── supabase_schema.sql         # Supabase PostgreSQL schema script
├── package.json
└── README.md
```

---

## ⚡ Connecting Supabase (Optional Cloud Database)

HOUSEY runs out of the box with zero configuration in high-performance in-memory mode. To persist game rooms and winning claims to Supabase:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard and run [`supabase_schema.sql`](file:///d:/New%20folder%20(8)/tambola/supabase_schema.sql).
3. In your `.env` file, fill in your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-service-role-or-anon-key
   ADMIN_PIN=123
   ```
4. Restart the server (`npm start`). You will see:
   ```
   ✓ Supabase client initialized successfully.
   HOUSEY Tambola Server listening on port 3001
   Supabase Database: Connected
   Admin Lock PIN active: 123
   ```

---

## 🔒 Accessing the Hidden Admin Page

The Admin Page is hidden from ordinary players:
1. **Logo Secret**: Click the green **"H"** logo in the top navbar **3 times**.
2. **Direct Link**: Navigate to `http://localhost:3001/?admin=true` or `/admin`.
3. **Lock Screen**: Enter the 4-digit PIN: **`123`** (or `1234`).
4. **Admin Capabilities**:
   - Create new game rooms with custom 4-digit codes.
   - Set an optional **Pass Key** (e.g. `8888`) so only invited players with the pass key can enter.
   - Monitor and terminate active rooms.
   - View Supabase cloud sync status.

---

## 🚀 Running the App

```cmd
# Start full-stack server on port 3001
npm start

# Or run tests
node tests/verify_game.js
node tests/verify_multiplayer_socket.js
node tests/verify_admin_and_supabase.js
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!
