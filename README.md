# 📝 Tamizh Todo Daily Planner

A full-stack daily task planner web application with user authentication, cross-device data sync, and a beautiful UI. Built with **Node.js**, **Express**, **SQLite**, and vanilla **HTML/CSS/JavaScript**.

---

## ✨ Features

- 🔐 **User Authentication** — Register & login with username/password (JWT-secured)
- ☁️ **Cross-Device Sync** — Your tasks are saved to the server and synced across devices
- 📅 **Daily Task Management** — Add, complete, and delete tasks with ease
- 📊 **Task History & Analytics** — Track your most frequent tasks over time
- 🤖 **AI Chatbot** — Productivity insights powered by your task data
- 📱 **Responsive Design** — Optimized for both mobile and desktop screens
- 🌙 **Dark Mode** — Elegant dark-themed UI

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript     |
| Backend    | Node.js, Express.js                 |
| Database   | SQLite3 (via `sqlite3` npm package) |
| Auth       | JWT (`jsonwebtoken`), bcrypt        |
| Email      | Nodemailer (Gmail SMTP)             |
| Config     | dotenv                              |

---

## 📁 Project Structure

```
TODO/
├── index.html        # Main frontend page
├── styles.css        # Application styles
├── script.js         # Frontend JavaScript logic
├── server.js         # Express backend server
├── db.js             # SQLite database setup & connection
├── database.sqlite   # Auto-generated SQLite database file
├── package.json      # Project metadata & dependencies
├── .env              # Environment variables (not committed to Git)
└── .gitignore        # Git ignore rules
```

---

## 🚀 Running the Project Locally

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **Git** — [Download here](https://git-scm.com/)

Verify installation:
```bash
node -v
```

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

> Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

---

### Step 2 — Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- `express`, `cors`, `bcrypt`, `jsonwebtoken`, `nodemailer`, `sqlite3`, `dotenv`

---

### Step 3 — Configure Environment Variables

Create a `.env` file in the project root (it may already exist). Fill in the following:

```env
# Gmail credentials for OTP/email features
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_PASS=your_16_character_app_password

# JWT Secret — use any long random string
JWT_SECRET=your_super_secret_key_here
```

> **How to get a Gmail App Password:**
> 1. Go to your [Google Account](https://myaccount.google.com/)
> 2. Navigate to **Security → 2-Step Verification** (must be enabled)
> 3. Scroll down to **App passwords**
> 4. Generate a new app password and paste it as `GMAIL_PASS`

---

### Step 4 — Start the Server

```bash
node server.js
```

You should see:
```
✅ Tamizh Todo Server running at http://localhost:3000
Connected to the SQLite database.
```

---

### Step 5 — Open in Browser

Open your browser and go to:

```
http://localhost:3000
```

The app will load. **Register** a new account or **log in** with existing credentials to get started.

---

## 🔑 API Endpoints

| Method | Endpoint              | Description              | Auth Required |
|--------|-----------------------|--------------------------|---------------|
| POST   | `/api/auth/register`  | Register a new user      | ❌            |
| POST   | `/api/auth/login`     | Login and get JWT token  | ❌            |
| GET    | `/api/data/sync`      | Fetch user's saved data  | ✅            |
| POST   | `/api/data/sync`      | Save/update user's data  | ✅            |

---

## ⚙️ Environment Variables Reference

| Variable      | Description                                    | Required |
|---------------|------------------------------------------------|----------|
| `GMAIL_USER`  | Your Gmail address for sending emails          | Optional |
| `GMAIL_PASS`  | 16-character Gmail App Password                | Optional |
| `JWT_SECRET`  | Secret key for signing JWT tokens              | ✅ Yes   |
| `PORT`        | Port to run the server on (default: `3000`)    | Optional |

---

## 🗄️ Database

The app uses **SQLite** and automatically creates a `database.sqlite` file on first run. No manual database setup is needed.

Two tables are auto-created:

- **`users`** — Stores registered users (username + hashed password)
- **`user_data`** — Stores each user's task data as JSON

---

## 🐛 Troubleshooting

**`npm` is not recognized or blocked by PowerShell:**
```bash
# Use node directly instead
node server.js
```

**Port 3000 is already in use:**
```env
# Add this to your .env file to use a different port
PORT=3001
```

**Module not found errors:**
```bash
# Re-install dependencies
node -e "require('child_process').execSync('npm install', {stdio: 'inherit'})"
```

---

## 📄 License

This project is licensed under the **ISC License**.

---

> Made with ❤️ — Tamizh Todo Daily Planner
