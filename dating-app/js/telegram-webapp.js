// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Конфигурация API
const API_BASE_URL = 'https://tg-bd.onrender.com';

// Утилиты для работы с API
const api = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            tg.showAlert('Произошла ошибка при выполнении запроса');
            throw error;
        }
    },

    // Инициализация пользователя
    async initUser(telegramId) {
        return this.request(`/api/init/${telegramId}`);
    },

    // Методы для работы с профилем
    async createProfile(data) {
        return this.request(`/api/users/${data.telegram_id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async getProfile(telegramId) {
        return this.request(`/api/users/${telegramId}`);
    },

    async getNextProfile(currentUserId) {
        return this.request(`/profiles/next?current_user_id=${currentUserId}`);
    },

    async likeProfile(userId, currentUserId) {
        return this.request(`/profiles/${userId}/like?current_user_id=${currentUserId}`, {
            method: 'POST'
        });
    },

    async dislikeProfile(userId, currentUserId) {
        return this.request(`/profiles/${userId}/dislike?current_user_id=${currentUserId}`, {
            method: 'POST'
        });
    },

    async getMatches(userId) {
        return this.request(`/matches/${userId}`);
    },

    async updateAbout(userId, about) {
        return this.request('/profiles/about', {
            method: 'PUT',
            body: JSON.stringify({
                user_id: userId,
                about: about
            })
        });
    }
};

// Экспорт для использования в других файлах
window.tgApp = {
    tg,
    api
}; 