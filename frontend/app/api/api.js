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
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                // ensure Authorization removed if no token
                if (config.headers) delete config.headers.Authorization;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;