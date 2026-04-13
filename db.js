const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create users table — simple username + password, no email, no OTP
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);

        // Create user_data table to store each user's appData JSON
        db.run(`CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            app_data TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
    }
});

module.exports = db;
