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

// Очередь уведомлений
let notificationQueue = [];
let isShowingNotification = false;

// Утилиты для работы с API
const api = {
    async request(endpoint, options = {}) {
        try {
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
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

            const url = `${API_BASE_URL}/api${endpoint}`;
            console.log('Отправка запроса к API:', {
                url,
                options: requestOptions
            });
            
            const response = await fetch(url, requestOptions);
            
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

    // Безопасный показ уведомлений с очередью
    async showNotification(message, isError = false) {
        // Добавляем уведомление в очередь
        notificationQueue.push({ message, isError });
        
        // Если уже показывается уведомление, выходим
        if (isShowingNotification) {
            return;
        }
        
        // Показываем уведомления из очереди
        while (notificationQueue.length > 0) {
            isShowingNotification = true;
            const notification = notificationQueue[0];
            
            try {
                if (!tg) {
                    alert(notification.message);
                } else {
                    await new Promise((resolve) => {
                        try {
                            tg.showAlert(notification.message, () => resolve());
                        } catch (error) {
                            console.error('Ошибка при показе уведомления:', error);
                            alert(notification.message);
                            resolve();
                        }
                    });
                }
            } catch (error) {
                console.error('Ошибка при показе уведомления:', error);
                alert(notification.message);
            }
            
            // Удаляем показанное уведомление из очереди
            notificationQueue.shift();
        }
        
        isShowingNotification = false;
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
            // Пробуем инициализировать пользователя
            return await this.request(`/init/${telegramId}`);
        } catch (error) {
            // Если произошла ошибка, пробуем получить профиль
            if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
                return await this.request(`/users/${telegramId}`);
            }
            throw error;
        }
    },

    // Методы для работы с профилем
    async createProfile(data) {
        return this.request(`/users/${data.telegram_id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async getProfile(telegramId) {
        return this.request(`/users/${telegramId}`);
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

        return this.request(`/users/${telegramId}/photo`, {
            method: 'POST',
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