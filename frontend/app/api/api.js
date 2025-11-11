import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const admin = localStorage.getItem('adminToken');
            const operator = localStorage.getItem('operatorToken');
            const customer = localStorage.getItem('authToken');
            const token = admin || operator || customer || '';

            config.headers = config.headers || {};
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                delete config.headers.Authorization;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;