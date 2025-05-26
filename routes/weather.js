// routes/weather.js
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/weather', weatherController.getWeatherData);
router.get('/cities', weatherController.getCitySuggestions); // Add this line

module.exports = router;
