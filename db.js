const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_data (
                user_id INTEGER PRIMARY KEY,
                app_data TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log('✅ PostgreSQL connected and tables ready.');
    } catch (err) {
        console.error('❌ Database init error:', err.message);
        process.exit(1);
    }
}

initDB();

module.exports = pool;
