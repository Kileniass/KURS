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

        // Обновляем UI
        const profileName = document.getElementById('profileName');
        const profileAge = document.getElementById('profileAge');
        const profileCar = document.getElementById('profileCar');
        const profileRegion = document.getElementById('profileRegion');
        const profileAbout = document.getElementById('profileAbout');
        const profilePhoto = document.getElementById('profilePhoto');

        if (profileName) profileName.textContent = profile.name || 'Не указано';
        if (profileAge) profileAge.textContent = profile.age ? `${profile.age} лет` : 'Не указано';
        if (profileCar) profileCar.textContent = profile.car || 'Не указано';
        if (profileRegion) profileRegion.textContent = profile.region || 'Не указано';
        if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
        
        if (profilePhoto) {
            tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
        }

        // Обработчик кнопки редактирования
        const editButton = document.getElementById('editButton');
        if (editButton) {
            editButton.addEventListener('click', () => {
                window.location.href = 'profile-change.html';
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