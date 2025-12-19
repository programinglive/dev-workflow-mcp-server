// API configuration
const API_BASE_URL = 'https://hollywood-andrew-cycle-genre.trycloudflare.com';

export const apiClient = {
    async login(username: string, password: string) {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for cookies
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        return response.json();
    },

    async logout() {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        return response.json();
    },

    async getCurrentUser() {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include',
        });

        if (!response.ok) {
            if (response.status === 401) {
                return null; // Not authenticated
            }
            throw new Error('Failed to get current user');
        }

        return response.json();
    },

    async getHistory() {
        const response = await fetch(`${API_BASE_URL}/api/history`, {
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
        const response = await fetch(`${API_BASE_URL}/api/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
