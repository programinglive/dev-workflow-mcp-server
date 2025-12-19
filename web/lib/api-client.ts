// API configuration
const API_BASE_URL = 'https://hollywood-andrew-cycle-genre.trycloudflare.com';

export const apiClient = {
    async login(username: string, password: string) {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();

        // Store JWT token if present
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        return data;
    },

    async logout() {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        // Clear token
        localStorage.removeItem('token');

        return response.json();
    },

    async getCurrentUser() {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers,
                credentials: 'include',
            });

            if (!response.ok) {
                return null;
            }

            return response.json();
        } catch (error) {
            return null;
        }
    },

    async getHistory() {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/history`, {
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch history');
        }

        return response.json();
    },

    async createHistory(data: {
        task_type: string;
        description: string;
        commit_message?: string;
        tests_passed?: boolean;
        documentation_type?: string;
    }) {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/history`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create history entry');
        }

        return response.json();
    },
};
