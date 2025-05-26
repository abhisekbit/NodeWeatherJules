// controllers/weatherController.js
const fetch = require('node-fetch');

const getWeatherData = async (req, res, next) => {
    const { city } = req.query;

    if (!city) {
        const err = new Error('City parameter is required');
        err.statusCode = 400;
        return next(err);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        const err = new Error('OpenWeatherMap API key is missing. Please set it in the .env file.');
        err.statusCode = 500;
        return next(err);
    }

    try {
        // Step 1: Geocoding (remains the same)
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
        console.log(`Fetching geocoding data from: ${geoUrl.replace(apiKey, 'YOUR_API_KEY')}`);
        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            let errorMsg = `Geocoding API error: ${geoResponse.status} ${geoResponse.statusText}`;
            try { const eData = await geoResponse.json(); errorMsg = eData.message || errorMsg; } catch (e) {}
            const err = new Error(errorMsg); err.statusCode = geoResponse.status; return next(err);
        }
        const geoData = await geoResponse.json();
        if (!geoData || geoData.length === 0) {
            const err = new Error(`City "${city}" not found.`); err.statusCode = 404; return next(err);
        }
        const { lat, lon, name: foundCityName, country, state } = geoData[0];
        console.log(`Geocoded "${city}" to: ${foundCityName}, ${state ? state + ', ' : ''}${country} (Lat: ${lat}, Lon: ${lon})`);

        // Step 2: Get Current Weather Data (API 2.5)
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        console.log(`Fetching current weather from: ${currentWeatherUrl.replace(apiKey, 'YOUR_API_KEY')}`);
        const currentWeatherResponse = await fetch(currentWeatherUrl);

        if (!currentWeatherResponse.ok) {
            let errorMsg = `Current Weather API error: ${currentWeatherResponse.status} ${currentWeatherResponse.statusText}`;
            try { const eData = await currentWeatherResponse.json(); errorMsg = eData.message || errorMsg; } catch (e) {}
            const err = new Error(errorMsg); err.statusCode = currentWeatherResponse.status; return next(err);
        }
        const currentWeatherData = await currentWeatherResponse.json();

        // Step 3: Get 5-day/3-hour Forecast Data (API 2.5)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        console.log(`Fetching forecast from: ${forecastUrl.replace(apiKey, 'YOUR_API_KEY')}`);
        const forecastResponse = await fetch(forecastUrl);

        if (!forecastResponse.ok) {
            let errorMsg = `Forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`;
            try { const eData = await forecastResponse.json(); errorMsg = eData.message || errorMsg; } catch (e) {}
            const err = new Error(errorMsg); err.statusCode = forecastResponse.status; return next(err);
        }
        const forecastData = await forecastResponse.json();

        // Process Current Weather
        const processedCurrentWeather = {
            temp: currentWeatherData.main.temp,
            humidity: currentWeatherData.main.humidity,
            precipitation: (currentWeatherData.rain && currentWeatherData.rain['1h'] ? currentWeatherData.rain['1h'] : 0) || (currentWeatherData.snow && currentWeatherData.snow['1h'] ? currentWeatherData.snow['1h'] : 0),
            description: currentWeatherData.weather[0].description,
            icon: currentWeatherData.weather[0].icon,
            cityInfo: `${foundCityName}${state ? ', ' + state : ''}, ${country}`
        };

        // Process 5-day/3-hour Forecast into daily summaries
        const dailyForecasts = {};
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0]; // Get YYYY-MM-DD
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    temps: [],
                    humidities: [],
                    precipitations: [],
                    weatherCounts: {}, // To find most common weather
                    icons: [], // Store all icons for the day
                    descriptions: [], // Store all descriptions for the day
                    dt: item.dt // Store one dt for sorting/display date
                };
            }
            dailyForecasts[date].temps.push(item.main.temp);
            dailyForecasts[date].humidities.push(item.main.humidity);
            dailyForecasts[date].precipitations.push((item.rain && item.rain['3h'] ? item.rain['3h'] : 0) + (item.snow && item.snow['3h'] ? item.snow['3h'] : 0));
            
            const weatherKey = `${item.weather[0].description}-${item.weather[0].icon}`;
            dailyForecasts[date].weatherCounts[weatherKey] = (dailyForecasts[date].weatherCounts[weatherKey] || 0) + 1;
            // Storing all icons and descriptions to pick the one corresponding to mostCommonWeatherKey later
            dailyForecasts[date].icons.push(item.weather[0].icon);
            dailyForecasts[date].descriptions.push(item.weather[0].description);
        });

        const processedForecast = Object.keys(dailyForecasts).map(dateStr => {
            const dayData = dailyForecasts[dateStr];
            let mostCommonWeatherKey = null;
            let maxCount = 0;
            
            // Determine the most common weather condition for the day
            for (const key in dayData.weatherCounts) {
                if (dayData.weatherCounts[key] > maxCount) {
                    maxCount = dayData.weatherCounts[key];
                    mostCommonWeatherKey = key;
                }
            }
            
            let finalDesc = dayData.descriptions[0] || 'N/A'; // Default to first description
            let finalIcon = dayData.icons[0] || '01d'; // Default to first icon

            if (mostCommonWeatherKey) {
                [finalDesc, finalIcon] = mostCommonWeatherKey.split('-');
            }
            
            return {
                // Use the stored dt to create the date string, ensuring it's from the actual day's data
                date: new Date(dayData.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                high: Math.max(...dayData.temps),
                low: Math.min(...dayData.temps),
                humidity: Math.round(dayData.humidities.reduce((a, b) => a + b, 0) / dayData.humidities.length), // Average humidity, rounded
                precipitation: dayData.precipitations.reduce((a, b) => a + b, 0), // Sum of precipitation for the day
                description: finalDesc,
                icon: finalIcon
            };
        }).sort((a,b) => { // Sort by date to ensure chronological order
            // Convert "Mon, Jan 1" style dates to actual Date objects for comparison
            // This assumes the year is the current year, which is generally fine for forecasts.
            const dateA = new Date(a.date.split(',')[1].trim() + ", " + new Date().getFullYear());
            const dateB = new Date(b.date.split(',')[1].trim() + ", " + new Date().getFullYear());
            return dateA - dateB;
        });
        
        const todayStr = new Date(currentWeatherData.dt * 1000).toISOString().split('T')[0];
        
        let finalForecastDays = processedForecast.filter(dayForecast => {
            // Create a comparable date string (YYYY-MM-DD) from the forecast day's "Day, Mon D" string
            // This is a simplified approach; for full robustness, ensure year consistency if forecast spans year-end
            const forecastDateObj = new Date(dayForecast.date.split(',')[1].trim() + ", " + new Date().getFullYear());
            const forecastDateStr = forecastDateObj.toISOString().split('T')[0];
            return forecastDateStr > todayStr;
        }).slice(0, 3); // Take the next 3 distinct future days


        res.json({
            current: processedCurrentWeather,
            forecast: finalForecastDays 
        });

    } catch (error) {
        console.error('Error in getWeatherData controller:', error);
        const err = new Error('Failed to fetch weather data due to an unexpected server error.');
        err.statusCode = 500;
        next(err);
    }
};

// getCitySuggestions remains the same as it uses Geocoding API 1.0 which is fine.
const getCitySuggestions = async (req, res, next) => {
    const { search } = req.query;

    if (!search || search.length < 2) {
        return res.status(204).send();
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        const err = new Error('OpenWeatherMap API key is missing for suggestions. Please set it in the .env file.');
        err.statusCode = 500;
        return next(err);
    }

    try {
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(search)}&limit=5&appid=${apiKey}`;
        console.log(`Fetching city suggestions from: ${geoUrl.replace(apiKey, 'YOUR_API_KEY')}`);
        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            let errorMsg = `City Suggestion API error: ${geoResponse.status} ${geoResponse.statusText}`;
            try { const eData = await geoResponse.json(); errorMsg = eData.message || errorMsg; } catch (e) {}
            const err = new Error(errorMsg); err.statusCode = geoResponse.status; return next(err);
        }
        const geoData = await geoResponse.json();
        if (!geoData || geoData.length === 0) {
            return res.json([]);
        }
        const suggestions = geoData.map(city => {
            let displayName = city.name;
            if (city.state) displayName += `, ${city.state}`;
            displayName += `, ${city.country}`;
            return displayName;
        });
        res.json(suggestions);
    } catch (error) {
        console.error('Error in getCitySuggestions controller:', error);
        const err = new Error('Failed to fetch city suggestions due to an unexpected server error.');
        err.statusCode = 500;
        next(err);
    }
};

module.exports = {
    getWeatherData,
    getCitySuggestions,
};
