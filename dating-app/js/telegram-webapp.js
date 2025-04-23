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

// Функция для отправки запросов к API
async function request(url, options = {}) {
    try {
        console.log('Отправка запроса к API:', { url, ...options });
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://kileniass.github.io'
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        console.log('Получен ответ:', response);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Получены данные:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Функция для установки изображения с запасным вариантом
function setImageWithFallback(imgElement, photoUrl) {
    if (!imgElement) {
        console.error('Элемент изображения не найден');
        return;
    }

    if (!photoUrl) {
        console.log('URL фото не указан, используем изображение по умолчанию');
        imgElement.src = `${STATIC_BASE_URL}/photos/hero-image.jpg`;
        return;
    }

    // Проверяем, является ли URL абсолютным
    const fullUrl = photoUrl.startsWith('http') ? photoUrl : `${API_BASE_URL}${photoUrl}`;
    console.log('Устанавливаем изображение:', fullUrl);

    imgElement.src = fullUrl;
    imgElement.onerror = () => {
        console.error('Ошибка загрузки изображения:', fullUrl);
        imgElement.src = `${STATIC_BASE_URL}/photos/hero-image.jpg`;
    };
}

// Утилиты для работы с API
const api = {
    // Метод для создания/обновления профиля
    async createProfile(profileData) {
        try {
            const response = await request(`${API_BASE_URL}/profiles`, {
                method: 'POST',
                body: JSON.stringify(profileData)
            });
            return response;
        } catch (error) {
            console.error('Ошибка при создании профиля:', error);
            throw new Error('Не удалось сохранить профиль: ' + error.message);
        }
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