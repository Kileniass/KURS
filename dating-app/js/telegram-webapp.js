// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Базовый путь к API
const API_BASE_URL = 'https://tg-bd.onrender.com/api';
const STATIC_BASE_URL = 'https://tg-bd.onrender.com';

// Функция для установки изображения с запасным вариантом
function setImageWithFallback(imgElement, photoUrl) {
    if (!photoUrl) {
        imgElement.src = `${STATIC_BASE_URL}/static/photos/hero-image.jpg`;
        return;
    }

    // Проверяем, является ли URL абсолютным
    if (photoUrl.startsWith('http')) {
        imgElement.src = photoUrl;
    } else {
        // Если URL относительный, добавляем базовый путь
        imgElement.src = `${STATIC_BASE_URL}${photoUrl}`;
    }

    // Обработка ошибок загрузки изображения
    imgElement.onerror = () => {
        console.warn('Ошибка загрузки изображения:', photoUrl);
        imgElement.src = `${STATIC_BASE_URL}/static/photos/hero-image.jpg`;
    };
}

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

// Очередь уведомлений
let notificationQueue = [];
let isShowingNotification = false;

// Утилиты для работы с API
const api = {
    async request(endpoint, options = {}) {
        try {
            const defaultHeaders = {
                'Accept': 'application/json',
                'Origin': 'https://kileniass.github.io'
            };

            // Если отправляем JSON, добавляем заголовок Content-Type
            if (options.body && !(options.body instanceof FormData)) {
                defaultHeaders['Content-Type'] = 'application/json';
            }

            const requestOptions = {
                ...options,
                mode: 'cors',
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            };

            const url = `${API_BASE_URL}${endpoint}`;
            console.log('Отправка запроса к API:', {
                url,
                method: options.method || 'GET',
                headers: requestOptions.headers
            });
            
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка API:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(errorText || `Ошибка сервера: ${response.status}`);
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

    // Получение telegram_id
    getTelegramId() {
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user || !tg.initDataUnsafe.user.id) {
            throw new Error('Данные пользователя недоступны');
        }
        return tg.initDataUnsafe.user.id.toString();
    },

    // Инициализация пользователя
    async initUser(telegramId) {
        return this.request(`/init/${telegramId}`);
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

    async uploadPhoto(file, telegramId) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            console.log('Начало загрузки фото:', {
                filename: file.name,
                size: file.size,
                type: file.type
            });
            
            const response = await this.request(`/users/${telegramId}/photo`, {
                method: 'POST',
                body: formData
            });
            
            console.log('Фото успешно загружено:', response);
            return response;
        } catch (error) {
            console.error('Ошибка при загрузке фото:', error);
            throw error;
        }
    },

    // Безопасный показ уведомлений
    async showNotification(message, isError = false) {
        if (isError) {
            console.error('Ошибка:', message);
        }
        if (tg && tg.showAlert) {
            await tg.showAlert(message);
        } else {
            alert(message);
        }
    }
};

// Инициализируем Telegram WebApp
tg = initTelegramWebApp();

// Экспорт для использования в других файлах
window.tgApp = {
    tg,
    api
}; 