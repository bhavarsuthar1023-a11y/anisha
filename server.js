const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the same directory
app.use(express.static(path.join(__dirname)));

// Initialize SQLite Database
const db = new sqlite3.Database('./bookings.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create Bookings Table
        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            event_type TEXT NOT NULL,
            event_date TEXT NOT NULL,
            location TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            }
            db.run(`ALTER TABLE bookings ADD COLUMN location TEXT`, (alterErr) => {
                // Ignore alter errors if column exists
            });
        });
    }
});

// Booking Endpoint
app.post('/api/book', (req, res) => {
    const { name, email, event_type, event_date, location } = req.body;

    if (!name || !email || !event_type || !event_date || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `INSERT INTO bookings (name, email, event_type, event_date, location) VALUES (?, ?, ?, ?, ?)`;
    const params = [name, email, event_type, event_date, location];

    db.run(sql, params, function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to create booking' });
        }
        res.status(201).json({ 
            message: 'Booking successfully created! We will contact you shortly.',
            bookingId: this.lastID 
        });
    });
});

// Admin Endpoint to view all bookings
app.get('/api/bookings', (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            data: rows
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
