/**
 * Comprehensive tests for axios.js
 * Covers all interceptor branches for full coverage.
 */

describe('Axios configuration and interceptors', () => {
  let mockAxios;
  let api;

  beforeEach(() => {
    jest.resetModules(); // Clear module cache so interceptors re-register

    // Mock axios.create() to simulate the axios instance
    mockAxios = {
      defaults: { baseURL: '', headers: {} },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    jest.doMock('axios', () => ({
      create: jest.fn(() => mockAxios),
    }));

    // Re-import our custom axios instance AFTER mocking axios
    api = require('./axios').default;
  });

  it('should create axios instance with correct defaults', () => {
    expect(mockAxios.defaults.baseURL).toBe('http://localhost:5000/api');
    expect(mockAxios.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should attach both request and response interceptors', () => {
    expect(mockAxios.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(mockAxios.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it('request interceptor adds Authorization header when token exists', async () => {
    localStorage.setItem('token', 'abc123');
    const requestHandler = mockAxios.interceptors.request.use.mock.calls[0][0];

    const config = await requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  it('request interceptor leaves headers unchanged when no token', async () => {
    localStorage.removeItem('token');
    const requestHandler = mockAxios.interceptors.request.use.mock.calls[0][0];

    const config = await requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('request interceptor rejects error', async () => {
    const errorHandler = mockAxios.interceptors.request.use.mock.calls[0][1];
    const error = new Error('Network failure');
    await expect(errorHandler(error)).rejects.toThrow('Network failure');
  });

  it('response interceptor returns the same response on success', async () => {
    const successHandler = mockAxios.interceptors.response.use.mock.calls[0][0];
    const response = { data: { ok: true } };
    const result = await successHandler(response);
    expect(result).toBe(response);
  });

  it('response interceptor logs and rejects error properly', async () => {
    console.error = jest.fn();
    const errorHandler = mockAxios.interceptors.response.use.mock.calls[0][1];

    const error = { response: { data: { message: 'Unauthorized' } }, message: '401' };
    await expect(errorHandler(error)).rejects.toThrow('401');
    expect(console.error).toHaveBeenCalledWith('API Error:', { message: 'Unauthorized' });
  });
});
