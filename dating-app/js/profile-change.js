document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profileForm');
    const saveButton = document.getElementById('saveButton');
    const photoInput = document.getElementById('car-image');
    const photoPreview = document.getElementById('carImagePreview');
    let photoFile = null;
    let currentUser = null;

    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;

    // Базовый путь к изображениям
    const IMAGES_BASE_PATH = 'https://tg-bd.onrender.com/static';
    const DEFAULT_PROFILE_IMAGE = `${IMAGES_BASE_PATH}/hero-image.jpg`;

    // Функция для установки изображения с запасным вариантом
    function setImageWithFallback(imgElement, photoUrl) {
        if (!photoUrl) {
            imgElement.src = DEFAULT_PROFILE_IMAGE;
            return;
        }

        // Проверяем, является ли URL абсолютным
        if (photoUrl.startsWith('http')) {
            imgElement.src = photoUrl;
        } else {
            // Если URL относительный, добавляем базовый путь
            imgElement.src = `${IMAGES_BASE_PATH}/${photoUrl}`;
        }

        // Обработка ошибок загрузки изображения
        imgElement.onerror = () => {
            imgElement.src = DEFAULT_PROFILE_IMAGE;
        };
    }

    // Функция для показа уведомлений
    function showNotification(message, isError = false) {
        tgApp.api.showNotification(message, isError);
    }

    // Инициализация пользователя
    async function initUser() {
        try {
            // Получаем telegram_id
            const telegramId = tgApp.api.getTelegramId();
            console.log('Получен telegram_id:', telegramId);
            
            // Инициализируем пользователя на сервере
            currentUser = await tgApp.api.initUser(telegramId);
            console.log('Пользователь инициализирован:', currentUser);
            
            // Заполняем форму данными пользователя
            if (currentUser) {
                document.getElementById('name').value = currentUser.name || '';
                document.getElementById('age').value = currentUser.age || '';
                document.getElementById('bio').value = currentUser.about || '';
                document.getElementById('car-info').value = currentUser.car || '';
                document.getElementById('region').value = currentUser.region || '';
                
                // Устанавливаем фото профиля
                setImageWithFallback(photoPreview, currentUser.photo_url);
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
            
            // Получаем telegram_id
            const telegramId = tgApp.api.getTelegramId();
            
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
            
            // Если есть новое фото, загружаем его
            let photoUrl = null;
            if (photoFile) {
                try {
                    const uploadResult = await tgApp.api.uploadPhoto(photoFile, telegramId);
                    if (uploadResult && uploadResult.photo_url) {
                        photoUrl = uploadResult.photo_url;
                        console.log('Фото успешно загружено:', photoUrl);
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке фото:', error);
                    showNotification('Ошибка при загрузке фото. Профиль будет сохранен без фото.', true);
                }
            }
            
            // Создаем объект с данными профиля
            const profileData = {
                telegram_id: telegramId,
                name,
                age,
                car,
                region,
                about,
                photo_url: photoUrl
            };
            
            // Обновляем профиль пользователя
            const updatedUser = await tgApp.api.createProfile(profileData);
            console.log('Профиль обновлен:', updatedUser);
            
            showNotification('Профиль успешно сохранен');
            
            // Добавляем небольшую задержку перед редиректом
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