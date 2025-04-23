// Инициализация Telegram WebApp
let tg = null;

function initTelegramWebApp() {
    try {
        if (!window.Telegram || !window.Telegram.WebApp) {
            throw new Error('Telegram WebApp не найден');
        }

        tg = window.Telegram.WebApp;

        // Проверяем наличие initData и валидируем его
        if (!tg.initData || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            console.warn('initData или данные пользователя не найдены, пробуем повторную инициализацию...');
            
            // Пробуем получить данные через небольшую задержку
            setTimeout(() => {
                if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                    console.log('Данные пользователя получены после задержки');
                    window.tgApp.tg = tg;
                } else {
                    console.error('Не удалось получить данные пользователя');
                }
            }, 1000);
        }

        console.log('Telegram WebApp инициализирован:', {
            version: tg.version,
            platform: tg.platform,
            initDataUnsafe: tg.initDataUnsafe
        });

        // Активируем WebApp
        tg.ready();
        tg.expand();

        return tg;
    } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
        return null;
    }
}

// Конфигурация API
const API_BASE_URL = 'https://tg-bd.onrender.com';

// Утилиты для работы с API
const api = {
    async request(endpoint, options = {}) {
        try {
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            };

            // Настройки запроса
            const requestOptions = {
                ...options,
                mode: 'cors',
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            };

            // Для FormData не устанавливаем Content-Type
            if (options.body instanceof FormData) {
                delete requestOptions.headers['Content-Type'];
            }

            console.log('Отправка запроса к API:', {
                url: `${API_BASE_URL}${endpoint}`,
                options: requestOptions
            });
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
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
            this.showNotification(error.message || 'Произошла ошибка при выполнении запроса', true);
            throw error;
        }
    },

    // Безопасный показ уведомлений
    showNotification(message, isError = false) {
        if (!tg) {
            alert(message);
            return;
        }

        try {
            // Используем только showAlert, так как showPopup может быть недоступен
            tg.showAlert(message);
        } catch (error) {
            console.error('Ошибка при показе уведомления:', error);
            // В случае ошибки показываем обычный alert
            alert(message);
        }
    },

    // Получение telegram_id с проверками
    getTelegramId() {
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user || !tg.initDataUnsafe.user.id) {
            throw new Error('Данные пользователя недоступны');
        }
        return tg.initDataUnsafe.user.id.toString();
    },

    // Инициализация пользователя
    async initUser(telegramId) {
        try {
            const user = await this.request(`/user/${telegramId}`);
            if (!user) {
                // Если пользователь не найден, создаем нового
                return await this.request('/user', {
                    method: 'POST',
                    body: JSON.stringify({ telegram_id: telegramId })
                });
            }
            return user;
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

// Инициализируем Telegram WebApp
tg = initTelegramWebApp();

// Экспорт для использования в других файлах
window.tgApp = {
    tg,
    api
}; 