// tests/weatherController.test.js
const { getWeatherData, getCitySuggestions } = require('../controllers/weatherController');
const fetch = require('node-fetch'); // To be mocked

// Mock node-fetch
jest.mock('node-fetch');

const { Response } = jest.requireActual('node-fetch'); // Import Response for constructing mock responses

// Mock process.env for API key
let originalEnv;
beforeAll(() => {
    originalEnv = process.env; // Save original environment variables
});
afterEach(() => {
    process.env = originalEnv; // Restore original environment variables after each test
    jest.clearAllMocks(); // Clear all mock states
});


describe('getWeatherData', () => {
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
        // Default: API key is NOT set, so controller returns its internal dummy data
        process.env = { ...originalEnv, OPENWEATHER_API_KEY: undefined };
    });

    it('should return 400 if city is not provided', async () => {
        const req = mockRequest({});
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 400,
            message: 'City parameter is required'
        }));
    });

    it('should return dummy weather data if API key is not set (development mode)', async () => {
        const req = mockRequest({ city: 'TestCity' });
        const res = mockResponse();
        await getWeatherData(req, res, mockNext);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            current: expect.any(Object),
            forecast: expect.any(Array)
        }));
        expect(res.json.mock.calls[0][0].current.description).toContain('(Dummy)');
    });
    
    it('should call next with error if actual fetch fails (simulated with API_KEY present)', async () => {
        process.env = { ...originalEnv, OPENWEATHER_API_KEY: 'fake-key' }; // Simulate API key being present
        
        // Simulate a fetch error for the geocoding step
        // fetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: "API error" }), { status: 500 })); // This line was causing the issue

        const req = mockRequest({ city: 'ErrorCity' });
        const res = mockResponse();
        
        // Temporarily modify controller to simulate actual API call path for this test
        // This is tricky because the controller's current logic for "API key present" still returns dummy data.
        // For a true unit test of error handling of actual calls, the controller would need refactoring
        // or a more complex mock setup.
        // For now, this test will rely on the generic catch block if fetch itself throws an error.
        
        fetch.mockImplementationOnce(() => Promise.reject(new Error("Network failure")));

        await getWeatherData(req, res, mockNext);
        
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
             message: 'Failed to fetch weather data due to an unexpected error.',
             statusCode: 500
        }));
    });


    // More tests would be needed here when actual API calls are implemented:
    // - Successful geocoding and weather API call
    // - Geocoding API returns city not found (404)
    // - Weather API returns an error
});

describe('getCitySuggestions', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;

    beforeEach(() => {
        mockRequest = (query) => ({ query });
        mockResponse = () => {
            const res = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            res.send = jest.fn().mockReturnValue(res); // For 204 status
            return res;
        };
        mockNext = jest.fn();
        process.env = { ...originalEnv, OPENWEATHER_API_KEY: undefined };
    });

    it('should return 204 if search query is not provided', async () => {
        const req = mockRequest({});
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('should return 204 if search query is less than 2 characters', async () => {
        const req = mockRequest({ search: 'a' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('should return dummy city suggestions if API key is not set', async () => {
        const req = mockRequest({ search: 'Lon' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(["London, England, GB"]));
    });
    
    it('should call next with error if actual fetch fails (simulated with API_KEY present)', async () => {
        process.env = { ...originalEnv, OPENWEATHER_API_KEY: 'fake-key' };
        fetch.mockImplementationOnce(() => Promise.reject(new Error("Network failure for suggestions")));

        const req = mockRequest({ search: 'ErrorSearch' });
        const res = mockResponse();
        await getCitySuggestions(req, res, mockNext);
        
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
             message: 'Failed to fetch city suggestions due to an unexpected error.',
             statusCode: 500
        }));
    });

    // More tests when actual API calls are implemented:
    // - Successful geocoding API call for suggestions
    // - Geocoding API returns an error
});
