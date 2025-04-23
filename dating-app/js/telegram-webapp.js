// Инициализация Telegram WebApp
let tg;
try {
    if (!window.Telegram) {
        console.error('Telegram WebApp не найден');
        throw new Error('Telegram WebApp не найден');
    }
    tg = window.Telegram.WebApp;

    // Проверяем наличие initData
    if (!tg.initData) {
        console.error('initData не найден');
        throw new Error('initData не найден');
    }

    console.log('Telegram WebApp успешно инициализирован:', {
        version: tg.version,
        platform: tg.platform
    });

    // Активируем WebApp
    tg.ready();
    tg.expand();
} catch (error) {
    console.error('Ошибка при инициализации Telegram WebApp:', error);
}

// Конфигурация API
const API_BASE_URL = 'https://tg-bd.onrender.com';

// Утилиты для работы с API
const api = {
    async request(endpoint, options = {}) {
        try {
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Добавляем CORS заголовки
            const requestOptions = {
                ...options,
                mode: 'cors',
                credentials: 'include',
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            };

            console.log('Отправка запроса к API:', {
                url: `${API_BASE_URL}${endpoint}`,
                options: requestOptions
            });
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Ошибка API:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    errorData
                });
                throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Получен ответ от API:', data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Используем более безопасный способ показа ошибок
            if (tg && tg.showAlert) {
                try {
                    tg.showAlert('Произошла ошибка при выполнении запроса: ' + error.message);
                } catch (popupError) {
                    console.error('Ошибка при показе уведомления:', popupError);
                }
            }
            throw error;
        }
    },

    // Инициализация пользователя
    async initUser(telegramId) {
        try {
            return await this.request(`/user/${telegramId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                // Если пользователь не найден, создаем нового
                return await this.request('/user', {
                    method: 'POST',
                    body: JSON.stringify({ telegram_id: telegramId })
                });
            }
            throw error;
        }
    },

    // Методы для работы с профилем
    async createProfile(data) {
        return this.request(`/user/${data.telegram_id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async getProfile(telegramId) {
        return this.request(`/user/${telegramId}`);
    },

    async getNextProfile(currentUserId) {
        return this.request(`/next_profile/${currentUserId}`);
    },

    async likeProfile(userId, currentUserId) {
        return this.request(`/like/${currentUserId}/${userId}`, {
            method: 'POST'
        });
    },

    async dislikeProfile(userId, currentUserId) {
        return this.request(`/dislike/${currentUserId}/${userId}`, {
            method: 'POST'
        });
    },

    async getMatches(userId) {
        return this.request(`/matches/${userId}`);
    },

    async getLikes(userId) {
        return this.request(`/likes/${userId}`);
    },

    async matchUsers(userId1, userId2) {
        return this.request(`/match/${userId1}/${userId2}`, {
            method: 'POST'
        });
    },

    async uploadPhoto(file, telegramId) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request(`/upload_photo/${telegramId}`, {
            method: 'POST',
            headers: {
                // Не добавляем Content-Type, он будет установлен автоматически для FormData
            },
            body: formData
        });
    }
};

// Экспорт для использования в других файлах
window.tgApp = {
    tg,
    api
}; 