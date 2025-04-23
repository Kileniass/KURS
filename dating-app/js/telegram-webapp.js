// Инициализация Telegram WebApp
let tg = null;

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

        // Проверяем наличие initData
        if (!tg.initData) {
            console.warn('initData не найден');
        }

        // Активируем WebApp
        tg.ready();
        tg.expand();

        console.log('Telegram WebApp инициализирован:', {
            version: tg.version,
            platform: tg.platform,
            initDataUnsafe: tg.initDataUnsafe
        });

        return tg;
    } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
        return null;
    }
}

// Очередь уведомлений
let notificationQueue = [];
let isShowingNotification = false;
let lastNotificationTime = 0;

// Функция для показа уведомлений с очередью
async function showNextNotification() {
    if (isShowingNotification || notificationQueue.length === 0) return;
    
    // Проверяем, прошло ли достаточно времени с последнего уведомления
    const now = Date.now();
    if (now - lastNotificationTime < 1000) {
        setTimeout(showNextNotification, 1000);
        return;
    }
    
    isShowingNotification = true;
    const { message, isError } = notificationQueue.shift();
    
    try {
        if (isError) {
            console.error('Ошибка:', message);
        }
        
        if (tg && tg.showAlert) {
            try {
                await tg.showAlert(message);
                lastNotificationTime = Date.now();
            } catch (error) {
                if (error.message === 'WebAppPopupOpened') {
                    // Возвращаем сообщение обратно в очередь
                    notificationQueue.unshift({ message, isError });
                    setTimeout(showNextNotification, 1000);
                } else {
                    console.error('Ошибка при показе уведомления:', error);
                }
            }
        } else {
            alert(message);
            lastNotificationTime = Date.now();
        }
    } finally {
        isShowingNotification = false;
        if (notificationQueue.length > 0) {
            setTimeout(showNextNotification, 1000);
        }
    }
}

// Утилиты для работы с API
const api = {
    async request(endpoint, options = {}) {
        try {
            const defaultHeaders = {
                'Accept': 'application/json'
            };

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
                method: options.method || 'GET'
            });
            
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || `Ошибка сервера: ${response.status}`;
                } catch {
                    errorMessage = `Ошибка сервера: ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('Получен ответ от API:', data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Формируем понятное сообщение об ошибке
            let errorMessage = 'Произошла ошибка при выполнении запроса';
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
            } else if (error.message.includes('NetworkError')) {
                errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
            } else {
                errorMessage = error.message;
            }
            
            // Добавляем уведомление в очередь
            this.showNotification(errorMessage, true);
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

    // Безопасный показ уведомлений через очередь
    showNotification(message, isError = false) {
        notificationQueue.push({ message, isError });
        showNextNotification();
    }
};

// Инициализируем Telegram WebApp и экспортируем объект для использования в других файлах
document.addEventListener('DOMContentLoaded', () => {
    tg = initTelegramWebApp();
    window.tgApp = {
        tg,
        api,
        STATIC_BASE_URL
    };
}); 