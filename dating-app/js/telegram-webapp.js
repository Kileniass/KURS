// Инициализация Telegram WebApp
let tg = null;

// Базовый путь к API
const API_BASE_URL = 'https://tg-bd.onrender.com/api';
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
    // Получение telegram_id из WebApp
    getTelegramId() {
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user || !tg.initDataUnsafe.user.id) {
            throw new Error('Данные пользователя недоступны');
        }
        return tg.initDataUnsafe.user.id;
    },

    // Инициализация пользователя
    async initUser(telegramId) {
        return request(`${API_BASE_URL}/init/${telegramId}`);
    },

    // Методы для работы с профилем
    async getProfile(telegramId) {
        return request(`${API_BASE_URL}/users/${telegramId}`);
    },

    async createProfile(telegramId, profileData) {
        return request(`${API_BASE_URL}/users/${telegramId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...profileData, telegram_id: telegramId })
        });
    },

    async getNextProfile(telegramId) {
        return request(`${API_BASE_URL}/profiles/next?telegram_id=${telegramId}`);
    },

    async likeProfile(userId, telegramId) {
        return request(`${API_BASE_URL}/profiles/${userId}/like`, {
            method: 'POST',
            body: JSON.stringify({ telegram_id: telegramId })
        });
    },

    async dislikeProfile(userId, telegramId) {
        return request(`${API_BASE_URL}/profiles/${userId}/dislike`, {
            method: 'POST',
            body: JSON.stringify({ telegram_id: telegramId })
        });
    },

    async getMatches(telegramId) {
        return request(`${API_BASE_URL}/matches/${telegramId}`);
    },

    async getLikes(telegramId) {
        return request(`${API_BASE_URL}/likes/${telegramId}`);
    },

    async uploadPhoto(telegramId, file) {
        const formData = new FormData();
        formData.append('photo', file);
        
        const response = await fetch(`${API_BASE_URL}/photos/upload/${telegramId}`, {
            method: 'POST',
            body: formData,
            headers: {
                'Origin': 'https://kileniass.github.io'
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка загрузки фото: ${response.status}`);
        }

        const data = await response.json();
        return data.photo_url;
    },

    showNotification(message, isError = false) {
        addNotification(message, isError);
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