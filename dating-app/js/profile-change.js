document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profileForm');
    const saveButton = document.getElementById('saveButton');
    const photoInput = document.getElementById('car-image');
    const photoPreview = document.getElementById('carImagePreview');
    let photoFile = null;
    let currentUser = null;
    let tgApp = null;

    // Функция для показа уведомлений через API
    function showNotification(message, isError = false) {
        if (window.tgApp && window.tgApp.api) {
            window.tgApp.api.showNotification(message, isError);
        } else {
            if (isError) console.error('Ошибка:', message);
            alert(message);
        }
    }

    // Функция ожидания инициализации tgApp с таймаутом
    function waitForTgApp(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (window.tgApp) {
                    resolve(window.tgApp);
                } else if (Date.now() - startTime >= timeout) {
                    reject(new Error('Таймаут ожидания инициализации Telegram WebApp'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    // Инициализация пользователя
    async function initUser() {
        try {
            // Ждем инициализации tgApp
            tgApp = await waitForTgApp();
            console.log('tgApp инициализирован');

            if (!tgApp.tg) {
                throw new Error('Telegram WebApp не инициализирован корректно');
            }

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
                if (currentUser.photo_url) {
                    tgApp.api.setImageWithFallback(photoPreview, currentUser.photo_url);
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
            if (!window.tgApp) {
                throw new Error('Telegram WebApp не инициализирован');
            }

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
            let photoUrl = currentUser?.photo_url;
            if (photoFile) {
                try {
                    const uploadResult = await tgApp.api.uploadPhoto(photoFile, telegramId);
                    if (uploadResult && uploadResult.photo_url) {
                        photoUrl = uploadResult.photo_url;
                        console.log('Фото успешно загружено:', photoUrl);
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке фото:', error);
                    showNotification('Ошибка при загрузке фото. Профиль будет сохранен без нового фото.', true);
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