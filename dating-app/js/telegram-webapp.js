// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Базовые пути
const API_BASE_URL = 'https://tg-bd.onrender.com/api';
const STATIC_BASE_URL = 'https://tg-bd.onrender.com/static';

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
            },
            credentials: 'include'
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

// API методы
const api = {
    init: async () => {
        try {
            const response = await request(`${API_BASE_URL}/init`, {
                method: 'POST'
            });
            return response;
        } catch (error) {
            console.error('Error initializing user:', error);
            throw error;
        }
    },

    getProfile: async () => {
        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                throw new Error('Device ID not found');
            }
            return await request(`${API_BASE_URL}/users/${deviceId}`);
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    },

    updateProfile: async (profileData) => {
        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                throw new Error('Device ID not found');
            }
            return await request(`${API_BASE_URL}/users/${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    uploadPhoto: async (formData) => {
        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                throw new Error('Device ID not found');
            }
            const response = await fetch(`${API_BASE_URL}/users/${deviceId}/photo`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Origin': 'https://kileniass.github.io'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw error;
        }
    },

    getNextProfile: async () => {
        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                throw new Error('Device ID not found');
            }
            const response = await request(`${API_BASE_URL}/users/${deviceId}/next`);
            return response.profile;
        } catch (error) {
            console.error('Error getting next profile:', error);
            throw error;
        }
    },

    likeProfile: async (targetId) => {
        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                throw new Error('Device ID not found');
            }
            return await request(`${API_BASE_URL}/users/${deviceId}/like/${targetId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error liking profile:', error);
            throw error;
        }
    },

    dislikeProfile: async (targetId) => {
        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                throw new Error('Device ID not found');
            }
            return await request(`${API_BASE_URL}/users/${deviceId}/dislike/${targetId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error disliking profile:', error);
            throw error;
        }
    },

    getMatches: async () => {
        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                throw new Error('Device ID not found');
            }
            return await request(`${API_BASE_URL}/users/${deviceId}/matches`);
        } catch (error) {
            console.error('Error getting matches:', error);
            throw error;
        }
    },

    showNotification: (message, isError = false) => {
        if (tg && tg.showPopup) {
            tg.showPopup({
                title: isError ? 'Ошибка' : 'Уведомление',
                message: message,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(message);
        }
    }
};

// Инициализация приложения
tg.ready();
tg.expand();

// Экспорт
window.tgApp = {
    tg,
    api,
    API_BASE_URL,
    STATIC_BASE_URL
}; 