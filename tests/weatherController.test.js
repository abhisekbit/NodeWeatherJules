// tests/weatherController.test.js
const { getWeatherData, getCitySuggestions } = require('../controllers/weatherController');
const fetch = require('node-fetch');

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const originalEnv = process.env;

beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    fetch.mockClear();
});

afterAll(() => {
    process.env = originalEnv;
});

describe('getWeatherData with API 2.5', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;

    beforeEach(() => {
        mockRequest = (query) => ({ query });
        mockResponse = () => {
            const res = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            return res;
        };
        mockNext = jest.fn();
        process.env.OPENWEATHER_API_KEY = 'test-api-key-2.5';
    });
    

    it('should successfully fetch and process data using API 2.5', async () => {
        const mockGeoData = [{ lat: 34.05, lon: -118.24, name: 'Los Angeles', country: 'US', state: 'CA' }];
        const mockCurrentWeatherData = {
            weather: [{ description: 'clear sky', icon: '01d' }],
            main: { temp: 22.5, humidity: 45 },
            rain: { '1h': 0.2 },
            dt: Math.floor(Date.now() / 1000)
        };
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to start of day for consistent date handling
        
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(now.getDate() + 1);
        tomorrowDate.setHours(12, 0, 0, 0);
        const dtTomorrow12 = Math.floor(tomorrowDate.getTime() / 1000);
        tomorrowDate.setHours(15, 0, 0, 0);
        const dtTomorrow15 = Math.floor(tomorrowDate.getTime() / 1000);
        tomorrowDate.setHours(18, 0, 0, 0);
        const dtTomorrow18 = Math.floor(tomorrowDate.getTime() / 1000);

        const dayAfterTomorrowDate = new Date(now);
        dayAfterTomorrowDate.setDate(now.getDate() + 2);
        dayAfterTomorrowDate.setHours(12, 0, 0, 0);
        const dtDayAfterTomorrow12 = Math.floor(dayAfterTomorrowDate.getTime() / 1000);
        dayAfterTomorrowDate.setHours(15, 0, 0, 0);
        const dtDayAfterTomorrow15 = Math.floor(dayAfterTomorrowDate.getTime() / 1000);
        dayAfterTomorrowDate.setHours(18, 0, 0, 0);
        const dtDayAfterTomorrow18 = Math.floor(dayAfterTomorrowDate.getTime() / 1000);

        const twoDaysAfterTomorrowDate = new Date(now);
        twoDaysAfterTomorrowDate.setDate(now.getDate() + 3);
        twoDaysAfterTomorrowDate.setHours(12, 0, 0, 0);
        const dtTwoDaysAfterTomorrow12 = Math.floor(twoDaysAfterTomorrowDate.getTime() / 1000);
        twoDaysAfterTomorrowDate.setHours(15, 0, 0, 0);
        const dtTwoDaysAfterTomorrow15 = Math.floor(twoDaysAfterTomorrowDate.getTime() / 1000);
        twoDaysAfterTomorrowDate.setHours(18, 0, 0, 0);
        const dtTwoDaysAfterTomorrow18 = Math.floor(twoDaysAfterTomorrowDate.getTime() / 1000);

        const mockForecastData = {
            list: [
                // First day - broken clouds with snow
                { dt: dtTomorrow12, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                { dt: dtTomorrow15, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                { dt: dtTomorrow18, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                // Second day - broken clouds with snow
                { dt: dtDayAfterTomorrow12, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                { dt: dtDayAfterTomorrow15, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                { dt: dtDayAfterTomorrow18, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                // Third day - broken clouds with snow
                { dt: dtTwoDaysAfterTomorrow12, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                { dt: dtTwoDaysAfterTomorrow15, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
                { dt: dtTwoDaysAfterTomorrow18, main: { temp: 24, temp_min: 21, temp_max: 26, humidity: 60 }, weather: [{ description: 'broken clouds', icon: '04d' }], snow: {'3h': 0.5} },
            ]
        };

        fetch
            .mockResolvedValueOnce(new Response(JSON.stringify(mockGeoData), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(mockCurrentWeatherData), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(mockForecastData), { status: 200 }));

        const req = mockRequest({ city: 'Los Angeles' });
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);
        
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(fetch.mock.calls[0][0]).toContain('/geo/1.0/direct?q=Los%20Angeles');
        expect(fetch.mock.calls[1][0]).toContain('/data/2.5/weather?lat=34.05&lon=-118.24');
        expect(fetch.mock.calls[2][0]).toContain('/data/2.5/forecast?lat=34.05&lon=-118.24');

        expect(res.json).toHaveBeenCalled();
        const result = res.json.mock.calls[0][0];

        expect(result.current).toEqual(expect.objectContaining({
            temp: 22.5,
            humidity: 45,
            precipitation: 0.2,
            description: 'clear sky',
            icon: '01d',
            cityInfo: 'Los Angeles, CA, US'
        }));

        expect(result.forecast).toHaveLength(2);

        // Check first forecast day (Tomorrow)
        expect(result.forecast[0]).toEqual(expect.objectContaining({
            date: expect.any(String),
            high: 24,
            low: 24,
            humidity: 60,
            precipitation: 1.5,
            description: 'broken clouds',
            icon: '04d'
        }));
        // Check second forecast day (Day After Tomorrow)
        expect(result.forecast[1]).toEqual(expect.objectContaining({
            date: expect.any(String),
            high: 24,
            low: 24,
            humidity: 60,
            precipitation: 1.5,
            description: 'broken clouds',
            icon: '04d'
        }));

        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with 500 if API key is missing', async () => {
        delete process.env.OPENWEATHER_API_KEY;
        const req = mockRequest({ city: 'TestCity' });
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            message: 'OpenWeatherMap API key is missing. Please set it in the .env file.'
        }));
    });
    
    it('should call next with 404 if city not found (geocoding returns empty array)', async () => {
        fetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
        const req = mockRequest({ city: 'UnknownCity' });
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 404,
            message: 'City "UnknownCity" not found.'
        }));
        expect(fetch).toHaveBeenCalledTimes(1); // Only geocoding call
    });

    it('should call next with error if geocoding API fails', async () => {
        const error = new Error('Geo API Down');
        error.statusCode = 500;
        fetch.mockRejectedValueOnce(error);
        const req = mockRequest({ city: 'TestCity' });
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            message: 'Failed to fetch weather data due to an unexpected server error.'
        }));
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should call next with error if current weather API fails', async () => {
        const mockGeoData = [{ lat: 34.05, lon: -118.24, name: 'Los Angeles' }];
        const error = new Error('Current API Down');
        error.statusCode = 502;
        fetch
            .mockResolvedValueOnce(new Response(JSON.stringify(mockGeoData), { status: 200 }))
            .mockRejectedValueOnce(error);
        
        const req = mockRequest({ city: 'TestCity' });
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            message: 'Failed to fetch weather data due to an unexpected server error.'
        }));
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should call next with error if forecast API fails', async () => {
        const mockGeoData = [{ lat: 34.05, lon: -118.24, name: 'Los Angeles' }];
        const mockCurrentWeatherData = { main: { temp: 25, humidity: 50 }, weather: [{description: 'clear', icon: '01d'}] };
        const error = new Error('Forecast API Down');
        error.statusCode = 503;
        fetch
            .mockResolvedValueOnce(new Response(JSON.stringify(mockGeoData), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(mockCurrentWeatherData), { status: 200 }))
            .mockRejectedValueOnce(error);

        const req = mockRequest({ city: 'TestCity' });
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            message: 'Failed to fetch weather data due to an unexpected server error.'
        }));
        expect(fetch).toHaveBeenCalledTimes(3);
    });
});

// getCitySuggestions tests should largely remain the same as they use the same geocoding API.
// Re-include them here for completeness and ensure they still pass.
describe('getCitySuggestions with API 1.0 (still valid)', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;

    beforeEach(() => {
        mockRequest = (query) => ({ query });
        mockResponse = () => {
            const res = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            res.send = jest.fn().mockReturnValue(res);
            return res;
        };
        mockNext = jest.fn();
        process.env.OPENWEATHER_API_KEY = 'test-api-key-2.5'; // Use the same key
    });

    it('should return 204 if search query is less than 2 characters', async () => {
        const req = mockRequest({ search: 'L' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });
    
    it('should return 500 if API key is missing for suggestions', async () => {
        delete process.env.OPENWEATHER_API_KEY;
        const req = mockRequest({ search: 'London' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            message: 'OpenWeatherMap API key is missing for suggestions. Please set it in the .env file.'
        }));
    });

    it('should return city suggestions successfully', async () => {
        const mockApiSuggestions = [
            { name: 'London', country: 'GB', state: 'England' },
            { name: 'London', country: 'US', state: 'OH' }
        ];
        fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiSuggestions), { status: 200 }));
        
        const req = mockRequest({ search: 'London' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.openweathermap.org/geo/1.0/direct?q=London&limit=5'));
        expect(res.json).toHaveBeenCalledWith([
            'London, England, GB',
            'London, OH, US'
        ]);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array if geocoding API finds no suggestions', async () => {
        fetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
        const req = mockRequest({ search: 'NonExistentCity123' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        expect(res.json).toHaveBeenCalledWith([]);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if geocoding API for suggestions fails', async () => {
        const error = new Error('Suggestions API Down');
        error.statusCode = 500;
        fetch.mockRejectedValueOnce(error);
        const req = mockRequest({ search: 'TestSearch' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            message: 'Failed to fetch city suggestions due to an unexpected server error.'
        }));
    });
});
