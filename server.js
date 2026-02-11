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
// Database Connection
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

// Initialize Database Table
const initDb = async () => {
    if (!pool) {
        console.log('No DATABASE_URL found. Running in local mode (in-memory).');
        return;
    }
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS slider_images (
                id SERIAL PRIMARY KEY,
                image_url TEXT NOT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS partners (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                logo_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database table "contacts" is ready.');

        // Seeding Slider Images if Empty
        const sliderCount = await pool.query('SELECT COUNT(*) FROM slider_images');
        if (parseInt(sliderCount.rows[0].count) === 0) {
            console.log('Seeding initial slider images...');
            await pool.query(`
                INSERT INTO slider_images (image_url) VALUES 
                ('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&h=1080&fit=crop'),
                ('https://images.unsplash.com/photo-1558494949-efc025793ad1?q=80&w=1920&h=1080&fit=crop');
            `);
        }
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

// In-Memory Storage (Fallback if no DB)
let localContacts = [];
let localSlider = [
    { id: 1, image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop', active: true },
    { id: 2, image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop', active: true },
    { id: 3, image_url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?q=80&w=2070&auto=format&fit=crop', active: true },
    { id: 4, image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop', active: true }
];
let localPartners = [
    { id: 1, name: 'Partner 1', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/2560px-Microsoft_logo_%282012%29.svg.png' },
    { id: 2, name: 'Partner 2', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2560px-Google_2015_logo.svg.png' }
];

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
            res.json(result.rows);
        } else {
            res.json(localContacts.reverse());
        }
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- SLIDER APIs ---

app.get('/api/slider', async (req, res) => {
    try {
        if (process.env.DATABASE_URL) {
            const result = await pool.query('SELECT * FROM slider_images ORDER BY id ASC'); // Changed to prevent shuffling on refresh if needed
            res.json(result.rows);
        } else {
            res.json(localSlider);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/slider', async (req, res) => {
    const { image_url } = req.body;
    try {
        if (process.env.DATABASE_URL) {
            const result = await pool.query('INSERT INTO slider_images (image_url) VALUES ($1) RETURNING *', [image_url]);
            res.json(result.rows[0]);
        } else {
            const newItem = { id: Date.now(), image_url, active: true };
            localSlider.push(newItem);
            res.json(newItem);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/slider/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (process.env.DATABASE_URL) {
            await pool.query('DELETE FROM slider_images WHERE id = $1', [id]);
            res.json({ success: true });
        } else {
            localSlider = localSlider.filter(i => i.id != id);
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PARTNER APIs ---

app.get('/api/partners', async (req, res) => {
    try {
        if (process.env.DATABASE_URL) {
            const result = await pool.query('SELECT * FROM partners ORDER BY id ASC');
            res.json(result.rows);
        } else {
            res.json(localPartners);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/partners', async (req, res) => {
    const { name, logo_url } = req.body;
    try {
        if (process.env.DATABASE_URL) {
            const result = await pool.query('INSERT INTO partners (name, logo_url) VALUES ($1, $2) RETURNING *', [name, logo_url]);
            res.json(result.rows[0]);
        } else {
            const newItem = { id: Date.now(), name, logo_url };
            localPartners.push(newItem);
            res.json(newItem);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/partners/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (process.env.DATABASE_URL) {
            await pool.query('DELETE FROM partners WHERE id = $1', [id]);
            res.json({ success: true });
        } else {
            localPartners = localPartners.filter(p => p.id != id);
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    initDb();
});
