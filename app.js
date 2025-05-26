require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const weatherRoutes = require('./routes/weather');

// Configure EJS as the view engine
app.set('view engine', 'ejs');

// Set up middleware to serve static files from the public directory
app.use(express.static('public'));
app.use(express.json()); // Middleware to parse JSON request bodies

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Create a basic GET route for / that renders the index.ejs view
app.get('/', (req, res) => {
    res.render('index');
});

// Mount the weather routes
app.use('/api', weatherRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
    console.error("================ ERROR ================");
    console.error("Error Time:", new Date().toISOString());
    console.error("Error Path:", req.originalUrl);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack ? err.stack.split('\n').slice(0,5).join('\n') : 'No stack'); // Log first 5 lines of stack
    console.error("=====================================");

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({ error: message });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
