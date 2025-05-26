// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const searchButton = document.getElementById('search-button');
    const currentTempEl = document.getElementById('current-temp');
    const currentHumidityEl = document.getElementById('current-humidity');
    const currentPrecipitationEl = document.getElementById('current-precipitation');
    const currentDescriptionEl = document.getElementById('current-description');
    // const currentWeatherIconImg = document.getElementById('current-weather-icon'); // For OpenWeatherMap icons
    const currentWeatherMIcon = document.getElementById('current-weather-micon'); // For Material Symbols
    const suggestionsList = document.getElementById('suggestions-list');

    // Basic mapping from OpenWeatherMap icon codes to Material Symbols (expand as needed)
    const weatherIconMap = {
        '01d': 'clear_day', '01n': 'clear_night',
        '02d': 'partly_cloudy_day', '02n': 'partly_cloudy_night',
        '03d': 'cloud', '03n': 'cloud',
        '04d': 'cloudy', '04n': 'cloudy', // Or 'filter_drama' for broken clouds
        '09d': 'rainy', '09n': 'rainy', // Shower rain
        '10d': 'rainy', '10n': 'rainy', // Rain
        '11d': 'thunderstorm', '11n': 'thunderstorm',
        '13d': 'ac_unit', '13n': 'ac_unit', // Snow (ac_unit is a placeholder, better: 'weather_snowy' or 'cloudy_snowing')
        '50d': 'foggy', '50n': 'foggy', // Mist
    };

    searchButton.addEventListener('click', async () => {
        const city = cityInput.value;
        if (!city) {
            alert('Please enter a city name.');
            return;
        }

        // Simple loading state
        currentDescriptionEl.textContent = 'Loading...';
        currentTempEl.textContent = '--';
        currentHumidityEl.textContent = '--';
        currentPrecipitationEl.textContent = '--';
        currentWeatherMIcon.textContent = 'hourglass_empty';
        // currentWeatherIconImg.style.display = 'none';


        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Update current weather display
            if (data.current) {
                currentTempEl.textContent = data.current.temp;
                currentHumidityEl.textContent = data.current.humidity;
                currentPrecipitationEl.textContent = data.current.precipitation;
                currentDescriptionEl.textContent = data.current.description;
                
                // Using Material Icons based on OpenWeatherMap icon code
                const materialIconName = weatherIconMap[data.current.icon] || 'thermostat'; // Default icon
                currentWeatherMIcon.textContent = materialIconName;

                // If using OpenWeatherMap icons directly:
                // currentWeatherIconImg.src = `http://openweathermap.org/img/wn/${data.current.icon}@2x.png`;
                // currentWeatherIconImg.alt = data.current.description;
                // currentWeatherIconImg.style.display = 'block';
            } else {
                currentDescriptionEl.textContent = 'Could not fetch current weather.';
            }

            // Update forecast display
            const forecastContainer = document.getElementById('forecast-container');
            if (data.forecast && data.forecast.length > 0) {
                data.forecast.forEach((dayData, index) => {
                    const dayElement = document.getElementById(`forecast-day-${index}`);
                    if (dayElement) {
                        dayElement.querySelector('.forecast-date').textContent = dayData.date;
                        dayElement.querySelector('.forecast-icon').textContent = weatherIconMap[dayData.icon] || 'thermostat';
                        dayElement.querySelector('.forecast-description').textContent = dayData.description;
                        dayElement.querySelector('.forecast-high').textContent = dayData.high;
                        dayElement.querySelector('.forecast-low').textContent = dayData.low;
                        dayElement.querySelector('.forecast-humidity').textContent = dayData.humidity;
                        dayElement.querySelector('.forecast-precipitation').textContent = dayData.precipitation;
                    }
                });
            } else {
                // Clear or hide forecast if no data
                for (let i = 0; i < 3; i++) {
                    const dayElement = document.getElementById(`forecast-day-${i}`);
                    if (dayElement) {
                        dayElement.querySelector('.forecast-date').textContent = 'N/A';
                        dayElement.querySelector('.forecast-icon').textContent = 'block';
                        dayElement.querySelector('.forecast-description').textContent = 'No forecast data';
                        dayElement.querySelector('.forecast-high').textContent = '--';
                        dayElement.querySelector('.forecast-low').textContent = '--';
                        dayElement.querySelector('.forecast-humidity').textContent = '--';
                        dayElement.querySelector('.forecast-precipitation').textContent = '--';
                    }
                }
            }

        } catch (error) {
            console.error('Failed to fetch weather:', error);
            currentDescriptionEl.textContent = `Error: ${error.message}`;
            currentWeatherMIcon.textContent = 'error';
        }
    });

    cityInput.addEventListener('input', async () => {
        const searchText = cityInput.value;

        if (searchText.length < 2) { // Start suggesting after 2 characters
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/cities?search=${encodeURIComponent(searchText)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch suggestions');
            }
            const suggestions = await response.json();

            suggestionsList.innerHTML = ''; // Clear previous suggestions
            if (suggestions.length > 0) {
                suggestions.forEach(suggestionText => {
                    const item = document.createElement('div'); // Use div for items, style as needed
                    item.textContent = suggestionText;
                    item.style.padding = '8px';
                    item.style.cursor = 'pointer';
                    item.addEventListener('click', () => {
                        cityInput.value = suggestionText; // Populate input with suggestion
                        suggestionsList.innerHTML = '';
                        suggestionsList.style.display = 'none';
                    });
                    item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f0f0f0');
                    item.addEventListener('mouseleave', () => item.style.backgroundColor = 'white');
                    suggestionsList.appendChild(item);
                });
                suggestionsList.style.display = 'block';
            } else {
                suggestionsList.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (event) => {
        if (!cityInput.contains(event.target) && !suggestionsList.contains(event.target)) {
            suggestionsList.style.display = 'none';
        }
    });
});
