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
        document.getElementById('name').value = profile.name || '';
        document.getElementById('age').value = profile.age || '';
        document.getElementById('car').value = profile.car || '';
        document.getElementById('region').value = profile.region || '';
        document.getElementById('about').value = profile.about || '';

        // Устанавливаем фото профиля
        if (profile.photo_url) {
            tgApp.api.setImageWithFallback('profilePhoto', profile.photo_url);
        }

        // Обработчик загрузки фото
        const photoInput = document.getElementById('photo');
        if (photoInput) {
            photoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const photoUrl = await tgApp.api.uploadPhoto(telegramId, file);
                        tgApp.api.setImageWithFallback('profilePhoto', photoUrl);
                        tgApp.api.showNotification('Фото успешно загружено');
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
                    name: document.getElementById('name').value,
                    age: document.getElementById('age').value,
                    car: document.getElementById('car').value,
                    region: document.getElementById('region').value,
                    about: document.getElementById('about').value
                };

                try {
                    await tgApp.api.createProfile(telegramId, formData);
                    tgApp.api.showNotification('Профиль успешно обновлен');
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