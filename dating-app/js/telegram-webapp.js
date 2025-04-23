// Инициализация Telegram WebApp
let tg = null;

// Базовый путь к API
const API_BASE_URL = 'https://tg-bd.onrender.com';
const API_PATH = '/api';
const STATIC_BASE_URL = 'https://tg-bd.onrender.com';

// Очередь уведомлений
let notificationQueue = [];
let isShowingNotification = false;
let lastNotificationTime = 0;
const MIN_NOTIFICATION_INTERVAL = 2000; // Минимальный интервал между уведомлениями

// Функция для показа уведомлений с очередью
async function showNextNotification() {
    if (isShowingNotification || notificationQueue.length === 0) return;
    
    const now = Date.now();
    if (now - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
        setTimeout(showNextNotification, MIN_NOTIFICATION_INTERVAL);
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
                    // Если попап уже открыт, ждем и пробуем снова
                    notificationQueue.unshift({ message, isError });
                    setTimeout(showNextNotification, MIN_NOTIFICATION_INTERVAL);
                } else {
                    console.error('Ошибка при показе уведомления:', error);
                    // Используем обычный alert как запасной вариант
                    alert(message);
                }
            }
        } else {
            alert(message);
            lastNotificationTime = Date.now();
        }
    } finally {
        isShowingNotification = false;
        // Планируем следующее уведомление с задержкой
        if (notificationQueue.length > 0) {
            setTimeout(showNextNotification, MIN_NOTIFICATION_INTERVAL);
        }
    }
}

// Функция для добавления уведомления в очередь
function addNotification(message, isError = false) {
    // Проверяем, нет ли уже такого же сообщения в очереди
    if (!notificationQueue.some(n => n.message === message)) {
        notificationQueue.push({ message, isError });
        showNextNotification();
    }
}

// Утилиты для работы с API
const api = {
    // Функция для установки изображения с запасным вариантом
    setImageWithFallback(imgElement, photoUrl) {
        if (!imgElement) {
            console.error('Image element is null');
            return;
        }

        if (!photoUrl) {
            imgElement.src = `${STATIC_BASE_URL}/static/photos/hero-image.jpg`;
            return;
        }

        // Проверяем, является ли URL абсолютным
        if (photoUrl.startsWith('http')) {
            imgElement.src = photoUrl;
        } else {
            // Если URL относительный, добавляем базовый путь
            // Проверяем, начинается ли путь с /uploads
            if (photoUrl.startsWith('/uploads')) {
                imgElement.src = `${STATIC_BASE_URL}${photoUrl}`;
            } else {
                imgElement.src = `${STATIC_BASE_URL}/uploads/${photoUrl}`;
            }
        }

        // Обработка ошибок загрузки изображения
        imgElement.onerror = () => {
            console.warn('Ошибка загрузки изображения:', imgElement.src);
            imgElement.src = `${STATIC_BASE_URL}/static/photos/hero-image.jpg`;
        };
    },

    async request(endpoint, options = {}) {
        try {
            const defaultHeaders = {
                'Accept': 'application/json',
                'X-Client-Version': '1.0.0',
                'X-Request-ID': Math.random().toString(36).substring(7)
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

            // Формируем полный URL
            const url = `${API_BASE_URL}${API_PATH}${endpoint}`;
            console.log('Отправка запроса к API:', {
                url,
                method: options.method || 'GET',
                headers: requestOptions.headers
            });

            const response = await fetch(url, requestOptions);
            console.log('Получен ответ:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || `Ошибка сервера: ${response.status}`;
                } catch {
                    errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Получены данные:', data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            addNotification(error.message, true);
            throw error;
        }
    },

    // Получение session_id из WebApp
    async getSessionId() {
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user || !tg.initDataUnsafe.user.id) {
            throw new Error('Данные пользователя недоступны');
        }
        
        const telegramId = tg.initDataUnsafe.user.id;
        const response = await this.request(`/init/${telegramId}`);
        return response.session_id;
    },

    // Методы для работы с профилем
    async createProfile(data) {
        return this.request(`/users/${data.session_id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async getProfile(sessionId) {
        return this.request(`/users/${sessionId}`);
    },

    async getNextProfile(currentSessionId) {
        return this.request(`/profiles/next?current_user_id=${currentSessionId}`);
    },

    async likeProfile(userId, currentSessionId) {
        return this.request(`/profiles/${userId}/like?current_user_id=${currentSessionId}`, {
            method: 'POST'
        });
    },

    async dislikeProfile(userId, currentSessionId) {
        return this.request(`/profiles/${userId}/dislike?current_user_id=${currentSessionId}`, {
            method: 'POST'
        });
    },

    async getMatches(sessionId) {
        return this.request(`/matches/${sessionId}`);
    },

    async getLikes(sessionId) {
        return this.request(`/likes/${sessionId}`);
    },

    async uploadPhoto(sessionId, file) {
        try {
            if (!sessionId) {
                throw new Error('Session ID is required');
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/photos/upload/${sessionId}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to upload photo');
            }

            const data = await response.json();
            return data.photo_url;
        } catch (error) {
            console.error('Error uploading photo:', error);
            addNotification('Ошибка загрузки фотографии: ' + error.message, true);
            throw error;
        }
    },

    showNotification(message, isError = false) {
        addNotification(message, isError);
    },

    async initUser(telegramId) {
        try {
            const response = await this.request(`/init/${telegramId}`, 'GET');
            
            if (response.is_new) {
                // Если пользователь новый, перенаправляем на страницу создания профиля
                window.location.href = 'profile-change.html';
            } else {
                // Если пользователь существует, сохраняем его данные
                this.user = {
                    id: response.user_id,
                    session_id: response.session_id,
                    name: response.name,
                    age: response.age,
                    car: response.car,
                    region: response.region,
                    about: response.about,
                    photo_url: response.photo_url
                };
                
                // Перенаправляем на главную страницу
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error initializing user:', error);
            this.showNotification('Ошибка инициализации пользователя');
        }
    }
};

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

// Инициализируем Telegram WebApp и экспортируем объект для использования в других файлах
document.addEventListener('DOMContentLoaded', () => {
    tg = initTelegramWebApp();
    window.tgApp = {
        tg,
        api,
        STATIC_BASE_URL
    };
}); 