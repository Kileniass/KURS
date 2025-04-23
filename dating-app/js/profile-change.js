document.addEventListener('DOMContentLoaded', async () => {
    let tgApp = null;

    // Функция ожидания инициализации tgApp
    async function waitForTgApp(timeout = 5000) {
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

    try {
        // Ждем инициализации tgApp
        tgApp = await waitForTgApp();
        console.log('tgApp инициализирован');

        if (!tgApp.tg || !tgApp.tg.initDataUnsafe || !tgApp.tg.initDataUnsafe.user) {
            throw new Error('Telegram WebApp не инициализирован корректно');
        }

        // Получаем telegram_id
        const telegramId = tgApp.api.getTelegramId();
        console.log('Получен telegram_id:', telegramId);

        // Получаем профиль пользователя
        const profile = await tgApp.api.getProfile(telegramId);
        console.log('Профиль получен:', profile);

        // Заполняем форму данными профиля
        const nameInput = document.getElementById('name');
        const ageInput = document.getElementById('age');
        const carInput = document.getElementById('car');
        const regionInput = document.getElementById('region');
        const aboutInput = document.getElementById('about');
        const profilePhoto = document.getElementById('profilePhoto');

        if (nameInput) nameInput.value = profile.name || '';
        if (ageInput) ageInput.value = profile.age || '';
        if (carInput) carInput.value = profile.car || '';
        if (regionInput) regionInput.value = profile.region || '';
        if (aboutInput) aboutInput.value = profile.about || '';

        // Устанавливаем фото профиля
        if (profilePhoto && profile.photo_url) {
            tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
        }

        // Обработчик загрузки фото
        const photoInput = document.getElementById('photo');
        if (photoInput) {
            photoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const result = await tgApp.api.uploadPhoto(telegramId, file);
                        if (result && result.photo_url && profilePhoto) {
                            tgApp.api.setImageWithFallback(profilePhoto, result.photo_url);
                            tgApp.api.showNotification('Фото успешно загружено');
                        }
                    } catch (error) {
                        console.error('Ошибка при загрузке фото:', error);
                        tgApp.api.showNotification(error.message, true);
                    }
                }
            });
        }

        // Обработчик отправки формы
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = {
                    name: nameInput ? nameInput.value : '',
                    age: ageInput ? parseInt(ageInput.value) || null : null,
                    car: carInput ? carInput.value : '',
                    region: regionInput ? regionInput.value : '',
                    about: aboutInput ? aboutInput.value : ''
                };

                try {
                    await tgApp.api.updateProfile(telegramId, formData);
                    tgApp.api.showNotification('Профиль успешно обновлен');
                    // Возвращаемся на страницу профиля
                    window.location.href = 'profile.html';
                } catch (error) {
                    console.error('Ошибка при обновлении профиля:', error);
                    tgApp.api.showNotification(error.message, true);
                }
            });
        }

    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        if (tgApp && tgApp.api) {
            tgApp.api.showNotification(error.message, true);
        } else {
            alert(error.message);
        }
    }
}); 