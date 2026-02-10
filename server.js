const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize Database Table
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database table "contacts" is ready.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

// In-Memory Storage (Fallback if no DB)
let localContacts = [];

// API Endpoint for Contact Form
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        if (process.env.DATABASE_URL) {
            const result = await pool.query(
                'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *',
                [name, email, message]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } else {
            // Local Fallback
            const newContact = {
                id: localContacts.length + 1,
                name,
                email,
                message,
                created_at: new Date()
            };
            localContacts.push(newContact);
            console.log('Saved locally:', newContact);
            res.status(201).json({ success: true, data: newContact });
        }
    } catch (err) {
        console.error('Error saving contact:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to Get All Contacts (For Admin)
app.get('/api/contact', async (req, res) => {
    try {
        if (process.env.DATABASE_URL) {
            const result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
            res.json({ success: true, data: result.rows });
        } else {
            // Local Fallback
            res.json({ success: true, data: localContacts.reverse() });
        }
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    initDb();
});
