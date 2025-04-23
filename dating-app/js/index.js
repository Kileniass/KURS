document.addEventListener('DOMContentLoaded', async () => {
    let tgApp = null;
    let currentUserId = null;
    let currentProfile = null;

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
        const user = await tgApp.api.getProfile(telegramId);
        console.log('Профиль пользователя получен:', user);

        if (!user) {
            throw new Error('Не удалось получить профиль пользователя');
        }

        currentUserId = user.id;
        console.log('Текущий ID пользователя:', currentUserId);

        // Загружаем следующий профиль
        currentProfile = await tgApp.api.getNextProfile(telegramId);
        console.log('Следующий профиль загружен:', currentProfile);

        if (!currentProfile) {
            throw new Error('Нет доступных профилей');
        }

        // Обновляем UI
        const profileName = document.getElementById('profileName');
        const profileAge = document.getElementById('profileAge');
        const profileCar = document.getElementById('profileCar');
        const profileRegion = document.getElementById('profileRegion');
        const profileAbout = document.getElementById('profileAbout');
        const profilePhoto = document.getElementById('profilePhoto');

        if (profileName) profileName.textContent = currentProfile.name;
        if (profileAge) profileAge.textContent = `${currentProfile.age} лет`;
        if (profileCar) profileCar.textContent = currentProfile.car;
        if (profileRegion) profileRegion.textContent = currentProfile.region;
        if (profileAbout) profileAbout.textContent = currentProfile.about;
        
        if (profilePhoto) {
            tgApp.api.setImageWithFallback(profilePhoto, currentProfile.photo_url);
        }

        // Обработчики кнопок
        const likeButton = document.getElementById('likeButton');
        const dislikeButton = document.getElementById('dislikeButton');

        if (likeButton) {
            likeButton.addEventListener('click', async () => {
                try {
                    if (!currentProfile || !telegramId) {
                        throw new Error('Нет активного профиля или telegram_id');
                    }

                    await tgApp.api.likeProfile(currentProfile.id, telegramId);
                    tgApp.api.showNotification('Лайк отправлен!');
                    
                    // Загружаем следующий профиль
                    currentProfile = await tgApp.api.getNextProfile(telegramId);
                    if (currentProfile) {
                        // Обновляем UI
                        if (profileName) profileName.textContent = currentProfile.name;
                        if (profileAge) profileAge.textContent = `${currentProfile.age} лет`;
                        if (profileCar) profileCar.textContent = currentProfile.car;
                        if (profileRegion) profileRegion.textContent = currentProfile.region;
                        if (profileAbout) profileAbout.textContent = currentProfile.about;
                        if (profilePhoto) {
                            tgApp.api.setImageWithFallback(profilePhoto, currentProfile.photo_url);
                        }
                    } else {
                        tgApp.api.showNotification('Больше нет доступных профилей');
                    }
                } catch (error) {
                    console.error('Ошибка при отправке лайка:', error);
                    tgApp.api.showNotification(error.message, true);
                }
            });
        }

        if (dislikeButton) {
            dislikeButton.addEventListener('click', async () => {
                try {
                    if (!currentProfile || !telegramId) {
                        throw new Error('Нет активного профиля или telegram_id');
                    }

                    await tgApp.api.dislikeProfile(currentProfile.id, telegramId);
                    tgApp.api.showNotification('Дизлайк отправлен');
                    
                    // Загружаем следующий профиль
                    currentProfile = await tgApp.api.getNextProfile(telegramId);
                    if (currentProfile) {
                        // Обновляем UI
                        if (profileName) profileName.textContent = currentProfile.name;
                        if (profileAge) profileAge.textContent = `${currentProfile.age} лет`;
                        if (profileCar) profileCar.textContent = currentProfile.car;
                        if (profileRegion) profileRegion.textContent = currentProfile.region;
                        if (profileAbout) profileAbout.textContent = currentProfile.about;
                        if (profilePhoto) {
                            tgApp.api.setImageWithFallback(profilePhoto, currentProfile.photo_url);
                        }
                    } else {
                        tgApp.api.showNotification('Больше нет доступных профилей');
                    }
                } catch (error) {
                    console.error('Ошибка при отправке дизлайка:', error);
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