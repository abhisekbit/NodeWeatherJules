# Material 3 Weather Web App - NodeWeatherJules

NodeWeatherJules is a web application that provides current weather conditions and a 3-day forecast for a searched city. It features a clean, responsive user interface built with Material Web Components and a backend powered by Node.js and Express.

## Features

*   **Current Weather:** Displays temperature, humidity, precipitation, and weather description for the searched city.
*   **3-Day Forecast:** Shows the weather forecast for the next three days, including high/low temperatures, conditions, humidity, and precipitation.
*   **City Search with Autocomplete:** As you type a city name, suggestions appear to help you find the correct location.
*   **Responsive Design:** Adapts to different screen sizes for a good experience on desktop and mobile devices.
*   **Material 3 Styling:** Modern UI based on Material Design 3 principles.
*   **Unit Tests:** Backend logic is tested using Jest.
*   **CI/CD:** Automated testing via GitHub Actions.

## Tech Stack

*   **Backend:** Node.js, Express.js
*   **Frontend:** EJS (Embedded JavaScript templates), Material Web Components
*   **API:** OpenWeatherMap API (for weather data)
*   **Testing:** Jest
*   **CI/CD:** GitHub Actions

## Prerequisites

*   Node.js (LTS versions like 18.x or 20.x recommended)
*   npm (comes with Node.js)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/NodeWeatherJules.git # Replace with the actual repo URL
    cd NodeWeatherJules
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration (Secrets Management)

This application requires an API key from OpenWeatherMap to fetch weather data.

1.  **Get an API Key:**
    *   Sign up for a free account at [https://openweathermap.org/](https://openweathermap.org/).
    *   Subscribe to the **"One Call API 3.0"** (free for 1,000 calls/day) and ensure you have access to the **Geocoding API**. API keys are usually found on your account page.

2.  **Create `.env` file:**
    *   In the root directory of the project, create a copy of `.env.example` and name it `.env`.
        ```bash
        cp .env.example .env
        ```

3.  **Add API Key to `.env`:**
    *   Open the `.env` file and replace `YOUR_API_KEY_HERE` with your actual OpenWeatherMap API key:
        ```
        OPENWEATHER_API_KEY=YOUR_API_KEY_HERE
        ```

4.  **Gitignore:**
    *   The `.env` file is listed in `.gitignore` and will not (and should not) be committed to version control. This keeps your API key private.

## Running the Application Locally

1.  **Start the server:**
    ```bash
    npm start
    ```
2.  Open your browser and navigate to `http://localhost:3000` (or the port specified in your `.env` file or console output).

## Running Tests

Unit tests for the backend are written using Jest. To run them:

```bash
npm test
```

## Project Structure

```
/
├── .github/workflows/      # GitHub Actions CI workflows (e.g., ci.yml)
├── controllers/            # Backend logic for request handling (weatherController.js)
├── public/                 # Static assets
│   ├── css/style.css       # Main stylesheet
│   └── js/main.js          # Client-side JavaScript
├── routes/                 # Express route definitions (weather.js)
├── tests/                  # Jest unit tests (weatherController.test.js)
├── views/                  # EJS templates (index.ejs)
├── .env.example            # Example environment variables file
├── .gitignore              # Specifies intentionally untracked files
├── app.js                  # Main Express application file
├── package-lock.json       # Records exact versions of dependencies
├── package.json            # Project metadata, scripts, and dependencies
└── README.md               # This file
```

## CI/CD

Continuous Integration (CI) is set up using GitHub Actions. The workflow is defined in `.github/workflows/ci.yml`. It automatically runs tests on every push and pull request to the `main` branch, ensuring code quality and integration.

## Error Handling and Logging

*   **Backend:** Errors are handled by a centralized error-handling middleware in `app.js`. This middleware catches errors passed via `next(error)` from controllers and other middleware.
*   **Logging:** Basic request logging (method, URL, timestamp) and detailed error information (message, stack trace) are logged to the console, aiding in development and debugging.

## Future Improvements (Placeholder)

*   Implement actual API calls to OpenWeatherMap instead of relying solely on dummy data for all scenarios.
*   More robust error handling and user feedback on the client-side.
*   User accounts or saving favorite locations.
*   More detailed weather information (wind speed, UV index, etc.).
*   Dark mode / Theme switcher.