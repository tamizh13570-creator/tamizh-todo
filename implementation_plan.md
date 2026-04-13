# Add User Accounts, OTP Verification, and Data Sync

We need to upgrade the current local-only Todo application to support user accounts and remote data storage so your data syncs across all your devices.

## The Requirements
1. **Sign Up/Login**: Users can sign up with a Gmail/Email account and password.
2. **OTP Verification**: A verification step (OTP/link) sent to the provided email to activate the new account.
3. **Cross-device Sync**: Save task data to a database instead of browser `localStorage` so it persists and loads on any device you log into.

## Architectural Options

Since the app is currently a purely static front-end app (HTML/CSS/JS), we need to introduce a backend.

> [!IMPORTANT]
> Please review the two options below and let me know which one you prefer to proceed with!

### Option 1: Firebase / Firestore (Recommended)
We use Google's Firebase platform which is designed exactly for this kind of app.
- **Auth**: Firebase handles the Email/Password creation and can send an Email Verification link/OTP out of the box securely.
- **Database**: Cloud Firestore syncs your JSON task data (`appData`) across devices seamlessly.
- **Hosting**: You can deploy the front-end for free.
- **Your Tasks**: You would just need to go to [firebase.google.com](https://firebase.google.com/), create a free project, enable "Email/Password" Auth, and give me the configuration code.

### Option 2: Custom Node.js Server & SQLite Backend
We build a custom backend server directly in this project.
- **Server**: I will create an `server.js` using Node/Express.
- **Auth & OTP**: I will implement custom sign-up/login logic, and use a library called `nodemailer` to send the OTP email.
- **Database**: I will use SQLite (a local file database) to store users and task data.
- **Your Tasks**: You will need to generate a "Gmail App Password" so the Node server can send emails from your Gmail account. Additionally, to access it from other devices, you will need to host this server online (e.g., on Render, Heroku, or a VPS).

## Proposed Changes (Assuming Option 2 - Custom Server, as a fallback)

If we build it ourselves:

### 1. Backend API (`server.js`)
#### [NEW] `server.js`
- Express server configuration.
- Endpoints:
  - `POST /api/register` (creates user, sends OTP)
  - `POST /api/verify-otp` (verifies account)
  - `POST /api/login` (authenticates, returns JWT token)
  - `GET /api/sync` (fetches user data)
  - `POST /api/sync` (saves user data)

#### [NEW] `db.js`
- SQLite setup with `users` and `tasks_data` tables.

### 2. Frontend Updates
#### [MODIFY] `index.html`
- Add Login / Register modals and UI overlay.
- Add OTP Verification modal.

#### [MODIFY] `styles.css`
- Styles for the new auth modals.

#### [MODIFY] `script.js`
- Instead of just saving to `localStorage`, update `loadData()` and `saveData()` to sync with our new backend API using `fetch()`.
- Add auth handling logic (saving the JWT token).

## Open Questions

> [!CAUTION]
> 1. Which approach do you prefer? **Option 1 (Firebase)** is much easier for cross-device usage without paying for hosting. **Option 2 (Custom Node API)** is better if you want absolute control over the code but requires hosting setup to make it work across different devices on different networks.
> 2. If you pick Option 2, are you okay with providing a dummy OTP (like always '123456') during your local testing until you set up your Gmail App Password for SMTP integration?
