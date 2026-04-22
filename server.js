require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const JWT_SECRET = process.env.JWT_SECRET || 'tamizh_todo_secret_key_2026';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many authentication attempts. Please try again later.' }
});

// ─── REGISTER ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input: Username must be at least 3 characters and password at least 6.' });
    }

    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username.toLowerCase(), hashedPassword]
        );
        const userId = result.rows[0].id;
        const token = jwt.sign({ userId, username: username.toLowerCase() }, JWT_SECRET, { expiresIn: '365d' });
        console.log(`[AUTH] New user registered: ${username}`);
        res.json({ token, username: username.toLowerCase(), message: 'Account created! Welcome to Tamizh Todo.' });
    } catch (e) {
        if (e.code === '23505') { // PostgreSQL unique violation
            return res.status(400).json({ error: 'Username already taken. Choose a different one.' });
        }
        console.error('[AUTH] Register error:', e.message);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
app.post('/api/auth/login', authLimiter, [
    body('username').trim().notEmpty().escape(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const { username, password } = req.body;

    try {
        const result = await db.query(
            'SELECT id, username, password FROM users WHERE username = $1',
            [username.toLowerCase()]
        );
        const user = result.rows[0];
        if (!user) return res.status(404).json({ error: 'Username not found. Please check and try again.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password. Please try again.' });

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '365d' });
        console.log(`[AUTH] User logged in: ${user.username}`);
        res.json({ token, username: user.username, message: 'Logged in successfully!' });
    } catch (e) {
        console.error('[AUTH] Login error:', e.message);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────
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

// ─── DELETE ACCOUNT ──────────────────────────────────────────────────────────
app.delete('/api/auth/delete', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM user_data WHERE user_id = $1', [req.user.userId]);
        await db.query('DELETE FROM users WHERE id = $1', [req.user.userId]);
        console.log(`[AUTH] User account deleted: ${req.user.username}`);
        res.json({ message: 'Account permanently deleted.' });
    } catch (e) {
        console.error('[AUTH] Delete error:', e.message);
        res.status(500).json({ error: 'Failed to delete account.' });
    }
});

// ─── GET DATA (SYNC) ─────────────────────────────────────────────────────────
app.get('/api/data/sync', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT app_data FROM user_data WHERE user_id = $1',
            [req.user.userId]
        );
        const row = result.rows[0];
        if (row && row.app_data) {
            res.json({ data: JSON.parse(row.app_data) });
        } else {
            res.json({ data: null });
        }
    } catch (e) {
        console.error('[SYNC] GET error:', e.message);
        res.status(500).json({ error: 'Database error.' });
    }
});

// ─── SAVE DATA (SYNC) ────────────────────────────────────────────────────────
app.post('/api/data/sync', authenticateToken, async (req, res) => {
    const appData = req.body.data;
    if (!appData) return res.status(400).json({ error: 'No data provided.' });

    const stringData = JSON.stringify(appData);

    try {
        const existing = await db.query(
            'SELECT user_id FROM user_data WHERE user_id = $1',
            [req.user.userId]
        );

        if (existing.rows.length > 0) {
            await db.query(
                'UPDATE user_data SET app_data = $1 WHERE user_id = $2',
                [stringData, req.user.userId]
            );
        } else {
            await db.query(
                'INSERT INTO user_data (user_id, app_data) VALUES ($1, $2)',
                [req.user.userId, stringData]
            );
        }
        res.json({ message: 'Data synced.' });
    } catch (e) {
        console.error('[SYNC] POST error:', e.message);
        res.status(500).json({ error: 'Failed to sync data.' });
    }
});

// ─── CATCH ALL → serve index.html ────────────────────────────────────────────
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Tamizh Todo Server running at http://localhost:${PORT}`);
});
