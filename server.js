require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

const JWT_SECRET = process.env.JWT_SECRET || 'tamizh_todo_secret_key_2026';

// ── 1. Register ────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required.' });
    if (username.trim().length < 3)
        return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username.trim().toLowerCase(), hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE'))
                        return res.status(400).json({ error: 'Username already taken. Choose a different one.' });
                    return res.status(500).json({ error: 'Database error.' });
                }
                // Auto-login: generate token right away
                const token = jwt.sign({ userId: this.lastID, username: username.trim().toLowerCase() }, JWT_SECRET, { expiresIn: '365d' });
                console.log(`[AUTH] New user registered: ${username}`);
                res.json({ token, username: username.trim().toLowerCase(), message: 'Account created! Welcome to Tamizh Todo.' });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// ── 2. Login ───────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required.' });

    db.get('SELECT id, username, password FROM users WHERE username = ?', [username.trim().toLowerCase()], async (err, user) => {
        if (!user) return res.status(404).json({ error: 'Username not found. Please check and try again.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password. Please try again.' });

        // Token valid for 1 year — user stays logged in across devices
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '365d' });
        console.log(`[AUTH] User logged in: ${user.username}`);
        res.json({ token, username: user.username, message: 'Logged in successfully!' });
    });
});

// ── Auth middleware ────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. Please log in.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Session expired. Please log in again.' });
        req.user = user;
        next();
    });
};

// ── 3. Get synced data ─────────────────────────────────────────
app.get('/api/data/sync', authenticateToken, (req, res) => {
    db.get('SELECT app_data FROM user_data WHERE user_id = ?', [req.user.userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (row && row.app_data) {
            res.json({ data: JSON.parse(row.app_data) });
        } else {
            res.json({ data: null }); // New account — no remote data yet
        }
    });
});

// ── 4. Save / sync data ────────────────────────────────────────
app.post('/api/data/sync', authenticateToken, (req, res) => {
    const appData = req.body.data;
    if (!appData) return res.status(400).json({ error: 'No data provided.' });

    const stringData = JSON.stringify(appData);
    db.get('SELECT user_id FROM user_data WHERE user_id = ?', [req.user.userId], (err, row) => {
        if (row) {
            db.run('UPDATE user_data SET app_data = ? WHERE user_id = ?', [stringData, req.user.userId], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to update data.' });
                res.json({ message: 'Data synced.' });
            });
        } else {
            db.run('INSERT INTO user_data (user_id, app_data) VALUES (?, ?)', [req.user.userId, stringData], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to save data.' });
                res.json({ message: 'Data saved.' });
            });
        }
    });
});

// ── Frontend fallback ──────────────────────────────────────────
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Tamizh Todo Server running at http://localhost:${PORT}`);
});
