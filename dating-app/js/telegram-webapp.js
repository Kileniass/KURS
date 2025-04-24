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
        
        if (tg && tg.showPopup) {
            try {
                await tg.showPopup({
                    message: message,
                    buttons: [{ type: 'ok' }]
                });
                lastNotificationTime = Date.now();
            } catch (error) {
                console.error('Ошибка при показе уведомления:', error);
                alert(message);
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

class TelegramWebApp {
    constructor() {
        this.API_BASE_URL = API_BASE_URL;
        this.device_id = localStorage.getItem('device_id');
        this.isInitialized = false;
        this.initPromise = this.initialize();

        this.api = {
            initUser: async (deviceId) => {
                try {
                    await this.initPromise;
                    // Сохраняем device_id
                    this.device_id = deviceId;
                    localStorage.setItem('device_id', deviceId);
                    
                    // Инициализируем пользователя
                    const response = await request(`${this.API_BASE_URL}/init`, {
                        method: 'POST',
                        body: JSON.stringify({ device_id: deviceId })
                    });
                    
                    return response;
                } catch (error) {
                    console.error('Error in initUser:', error);
                    throw error;
                }
            },

            init: async () => {
                try {
                    await this.initPromise;
                    if (!this.device_id) {
                        const response = await request(`${this.API_BASE_URL}/init`, {
                            method: 'POST'
                        });
                        this.device_id = response.device_id;
                        localStorage.setItem('device_id', this.device_id);
                    }
                    return { device_id: this.device_id };
                } catch (error) {
                    console.error('Error initializing:', error);
                    throw error;
                }
            },

            getProfile: async () => {
                try {
                    await this.initPromise;
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}`);
                } catch (error) {
                    if (error.message.includes('404')) {
                        return null; // Профиль не найден
                    }
                    throw error;
                }
            },

            createProfile: async (profileData) => {
                try {
                    await this.initPromise;
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users`, {
                        method: 'POST',
                        body: JSON.stringify({ ...profileData, device_id: this.device_id })
                    });
                } catch (error) {
                    console.error('Error creating profile:', error);
                    throw error;
                }
            },

            updateProfile: async (profileData) => {
                try {
                    await this.initPromise;
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
                    await this.initPromise;
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}/photo`, {
                        method: 'POST',
                        body: formData
                    });
                } catch (error) {
                    console.error('Error uploading photo:', error);
                    throw error;
                }
            },

            getNextProfile: async () => {
                try {
                    await this.initPromise;
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}/next`);
                } catch (error) {
                    console.error('Error getting next profile:', error);
                    throw error;
                }
            },

            likeProfile: async (targetId) => {
                try {
                    await this.initPromise;
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
                    await this.initPromise;
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
                    await this.initPromise;
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}/matches`);
                } catch (error) {
                    console.error('Error getting matches:', error);
                    throw error;
                }
            },

            getLikes: async () => {
                try {
                    await this.initPromise;
                    if (!this.device_id) {
                        throw new Error('Device ID not initialized');
                    }
                    return await request(`${this.API_BASE_URL}/users/${this.device_id}/likes`);
                } catch (error) {
                    console.error('Error getting likes:', error);
                    throw error;
                }
            },

            getDeviceId: () => {
                return this.device_id;
            },

            showNotification: (message, isError = false) => {
                addNotification(message, isError);
            },

            setImageWithFallback: (imgElement, photoUrl) => {
                if (!photoUrl) {
                    imgElement.src = `${STATIC_BASE_URL}/photos/hero-image.jpg`;
                    return;
                }

                if (photoUrl.startsWith('http')) {
                    imgElement.src = photoUrl;
                } else {
                    imgElement.src = `${STATIC_BASE_URL}/${photoUrl}`;
                }

                imgElement.onerror = () => {
                    imgElement.src = `${STATIC_BASE_URL}/photos/hero-image.jpg`;
                };
            }
        };
    }

    async initialize() {
        return new Promise((resolve) => {
            if (!tg) {
                throw new Error('Telegram WebApp не найден');
            }

            const checkReady = () => {
                if (tg.initData && tg.initDataUnsafe) {
                    tg.ready();
                    tg.expand();
                    this.isInitialized = true;
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };

            checkReady();
        });
    }

    isReady() {
        return this.isInitialized;
    }
}

// Создаем глобальный экземпляр приложения
window.tgApp = new TelegramWebApp(); 