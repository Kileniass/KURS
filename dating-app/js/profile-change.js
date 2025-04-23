document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profileForm');
    const saveButton = document.getElementById('saveButton');
    const photoInput = document.getElementById('car-image');
    const photoPreview = document.getElementById('carImagePreview');
    let photoFile = null;
    let currentUser = null;

    // Базовый URL API
    const API_BASE_URL = 'https://tg-bd.onrender.com';

    // Функция для показа уведомлений
    function showNotification(message, isError = false) {
        try {
            if (!window.Telegram || !window.Telegram.WebApp) {
                console.error('Telegram WebApp не доступен');
                alert(message);
                return;
            }

            if (isError) {
                console.error(message);
                window.Telegram.WebApp.showAlert(message);
            } else {
                console.log(message);
                window.Telegram.WebApp.showAlert(message);
            }
        } catch (error) {
            console.error('Ошибка при показе уведомления:', error);
            alert(message);
        }
    }

    // Функция для выполнения API запросов
    async function apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка при выполнении запроса');
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Функция для загрузки фото
    async function uploadPhoto(file, telegramId) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/upload_photo/${telegramId}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке фото');
            }

            const data = await response.json();
            return data.photo_url;
        } catch (error) {
            console.error('Ошибка при загрузке фото:', error);
            throw error;
        }
    }

    // Инициализация пользователя
    async function initUser() {
        try {
            if (!window.Telegram || !window.Telegram.WebApp) {
                throw new Error('Telegram WebApp не инициализирован');
            }

            const tg = window.Telegram.WebApp;
            
            const telegramId = tg.initDataUnsafe?.user?.id;
            if (!telegramId) {
                throw new Error('Не удалось получить ID пользователя');
            }
            
            console.log('Получен telegram_id:', telegramId.toString());
            
            // Получаем данные пользователя
            try {
                currentUser = await apiRequest(`/user/${telegramId}`);
            } catch (error) {
                if (error.message.includes('404')) {
                    // Если пользователь не найден, создаем нового
                    currentUser = await apiRequest('/user', 'POST', { telegram_id: telegramId.toString() });
                } else {
                    throw error;
                }
            }

            console.log('Пользователь инициализирован:', currentUser);
            
            // Заполняем форму данными пользователя
            if (currentUser) {
                document.getElementById('name').value = currentUser.name || '';
                document.getElementById('age').value = currentUser.age || '';
                document.getElementById('bio').value = currentUser.about || '';
                document.getElementById('car-info').value = currentUser.car || '';
                document.getElementById('region').value = currentUser.region || '';
                
                if (currentUser.photo_url) {
                    photoPreview.src = currentUser.photo_url;
                }
            }
        } catch (error) {
            console.error('Ошибка при инициализации пользователя:', error);
            showNotification('Ошибка при инициализации пользователя: ' + error.message, true);
        }
    }

    // Предпросмотр фото
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверяем размер файла (не более 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Размер файла не должен превышать 5MB', true);
                return;
            }
            
            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                showNotification('Пожалуйста, выберите изображение', true);
                return;
            }
            
            photoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Обработка сохранения профиля
    saveButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            saveButton.disabled = true;
            
            const tg = window.Telegram?.WebApp;
            if (!tg || !tg.initDataUnsafe?.user?.id) {
                throw new Error('Не удалось получить данные пользователя');
            }
            
            const telegramId = tg.initDataUnsafe.user.id.toString();
            
            // Проверяем обязательные поля
            const name = document.getElementById('name').value.trim();
            const age = parseInt(document.getElementById('age').value);
            const car = document.getElementById('car-info').value.trim();
            const region = document.getElementById('region').value.trim();
            const about = document.getElementById('bio').value.trim();

            if (!name || !age || !car || !region) {
                throw new Error('Пожалуйста, заполните все обязательные поля');
            }

            if (age < 18 || age > 100) {
                throw new Error('Возраст должен быть от 18 до 100 лет');
            }
            
            // Создаем объект с данными профиля
            const profileData = {
                telegram_id: telegramId,
                name,
                age,
                car,
                region,
                about
            };
            
            // Если есть новое фото, загружаем его
            if (photoFile) {
                try {
                    const photoUrl = await uploadPhoto(photoFile, telegramId);
                    profileData.photo_url = photoUrl;
                } catch (error) {
                    console.error('Ошибка при загрузке фото:', error);
                    showNotification('Ошибка при загрузке фото. Профиль будет сохранен без фото.', true);
                }
            }
            
            // Обновляем профиль пользователя
            const updatedUser = await apiRequest(`/user/${telegramId}`, 'PUT', profileData);
            console.log('Профиль обновлен:', updatedUser);
            
            showNotification('Профиль успешно сохранен');
            
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка при сохранении профиля:', error);
            showNotification(error.message || 'Произошла ошибка при сохранении профиля', true);
        } finally {
            saveButton.disabled = false;
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 