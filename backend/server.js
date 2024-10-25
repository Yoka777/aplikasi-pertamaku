import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import validator from 'validator';

const app = express();
app.use(express.json());

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200,
}));

// Set up SQLite database connection
const connection = new sqlite3.Database('./db/aplikasi.db');

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting middleware to all requests
app.use(limiter);

// Endpoint to get user by ID
app.get('/api/user/:id', (req, res) => {
  // Prepare SQL query using parameterized queries to prevent SQL injection
  const query = `SELECT * FROM users WHERE id = ?`;
  connection.all(query, [req.params.id], (error, results) => {
    if (error) {
      console.error(error); // Log the error for debugging
      return res.status(500).send('Internal Server Error'); // Respond with 500 status
    }
    res.json(results); // Return the user data as JSON
  });
});

// Endpoint to change user's email
app.post('/api/user/:id/change-email', (req, res) => {
  const newEmail = req.body.email;

  // Validate email format
  if (!validator.isEmail(newEmail)) {
    return res.status(400).send('Invalid email format'); // Respond with 400 if email is invalid
  }

  // Prepare SQL query using parameterized queries
  const query = `UPDATE users SET email = ? WHERE id = ?`;
  connection.run(query, [newEmail, req.params.id], function (err) {
    if (err) {
      console.error(err); // Log the error for debugging
      return res.status(500).send('Internal Server Error'); // Respond with 500 status
    }
    if (this.changes === 0) {
      res.status(404).send('User not found'); // Respond with 404 if no user was updated
    } else {
      res.status(200).send('Email updated successfully'); // Respond with success message
    }
  });
});

// Endpoint to serve files
app.get('/api/file', (req, res) => {
  const __filename = fileURLToPath(import.meta.url); 
  const __dirname = path.dirname(__filename); 

  // Join the path to ensure the requested file is within the files directory
  const filePath = path.join(__dirname, 'files', req.query.name);
  res.sendFile(filePath); // Send the requested file
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000'); // Log that the server is running
});
