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
                'Origin': 'https://kileniass.github.io',
                'Access-Control-Allow-Origin': 'https://kileniass.github.io',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin'
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

// Инициализация приложения
tg.ready();
tg.expand();

class TelegramWebApp {
    constructor() {
        this.API_BASE_URL = 'https://tg-bd.onrender.com/api';
        this.device_id = null;
        this.api = {
            init: async () => {
                try {
                    const response = await request(`${this.API_BASE_URL}/init`, {
                        method: 'POST'
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    this.device_id = data.device_id;
                    return data;
                } catch (error) {
                    console.error('Error initializing user:', error);
                    throw error;
                }
            },

            getProfile: async () => {
                try {
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}`);
                } catch (error) {
                    console.error('Error getting profile:', error);
                    throw error;
                }
            },

            updateProfile: async (profileData) => {
                try {
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}`, {
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
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    const response = await fetch(`${this.API_BASE_URL}/users/${this.device_id}/photo`, {
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
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    const response = await request(`${this.API_BASE_URL}/users/${this.device_id}/next`);
                    return response.profile;
                } catch (error) {
                    console.error('Error getting next profile:', error);
                    throw error;
                }
            },

            likeProfile: async (targetId) => {
                try {
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}/like/${targetId}`, {
                        method: 'POST'
                    });
                } catch (error) {
                    console.error('Error liking profile:', error);
                    throw error;
                }
            },

            dislikeProfile: async (targetId) => {
                try {
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}/dislike/${targetId}`, {
                        method: 'POST'
                    });
                } catch (error) {
                    console.error('Error disliking profile:', error);
                    throw error;
                }
            },

            getMatches: async () => {
                try {
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}/matches`);
                } catch (error) {
                    console.error('Error getting matches:', error);
                    throw error;
                }
            },

            getDeviceId: () => {
                return this.device_id;
            },

            showNotification: (message, isError = false) => {
                addNotification(message, isError);
            }
        };
    }
}

// Создаем глобальный экземпляр приложения
window.tgApp = new TelegramWebApp();

// API методы
const api = {
    // Получение telegram_id
    getTelegramId: () => {
        if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            throw new Error('Telegram WebApp не инициализирован');
        }
        return tg.initDataUnsafe.user.id;
    },

    // Инициализация пользователя
    initUser: async (telegramId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка инициализации: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при инициализации пользователя:', error);
            throw error;
        }
    },

    // Получение профиля
    getProfile: async (telegramId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}`);
            
            if (!response.ok) {
                throw new Error(`Ошибка получения профиля: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при получении профиля:', error);
            throw error;
        }
    },

    // Получение следующего профиля
    getNextProfile: async (telegramId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}/next`);
            
            if (!response.ok) {
                throw new Error(`Ошибка получения следующего профиля: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при получении следующего профиля:', error);
            throw error;
        }
    },

    // Лайк профиля
    likeProfile: async (targetId, telegramId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}/like/${targetId}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка отправки лайка: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при отправке лайка:', error);
            throw error;
        }
    },

    // Дизлайк профиля
    dislikeProfile: async (targetId, telegramId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}/dislike/${targetId}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка отправки дизлайка: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при отправке дизлайка:', error);
            throw error;
        }
    },

    // Получение лайков
    getLikes: async (telegramId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}/likes`);
            
            if (!response.ok) {
                throw new Error(`Ошибка получения лайков: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при получении лайков:', error);
            throw error;
        }
    },

    // Получение мэтчей
    getMatches: async (telegramId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}/matches`);
            
            if (!response.ok) {
                throw new Error(`Ошибка получения мэтчей: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при получении мэтчей:', error);
            throw error;
        }
    },

    // Обновление профиля
    updateProfile: async (telegramId, profileData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${telegramId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка обновления профиля: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error);
            throw error;
        }
    },

    // Загрузка фото
    uploadPhoto: async (telegramId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/users/${telegramId}/photo`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка загрузки фото: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка при загрузке фото:', error);
            throw error;
        }
    },

    // Установка изображения с запасным вариантом
    setImageWithFallback: (imgElement, photoUrl) => {
        if (!photoUrl) {
            imgElement.src = `${STATIC_BASE_URL}/photos/hero-image.jpg`;
            return;
        }

        // Проверяем, является ли URL абсолютным
        if (photoUrl.startsWith('http')) {
            imgElement.src = photoUrl;
        } else {
            // Если URL относительный, добавляем базовый путь
            imgElement.src = `${STATIC_BASE_URL}/${photoUrl}`;
        }

        // Обработка ошибок загрузки изображения
        imgElement.onerror = () => {
            imgElement.src = `${STATIC_BASE_URL}/photos/hero-image.jpg`;
        };
    },

    // Показать уведомление
    showNotification: (message, isError = false) => {
        if (tg && tg.showAlert) {
            tg.showAlert(message);
        } else {
            alert(message);
        }
    }
};

// Экспорт
window.tgApp = {
    tg,
    api,
    API_BASE_URL,
    STATIC_BASE_URL
}; 