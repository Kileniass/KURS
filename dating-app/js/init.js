// Функция инициализации пользователя
async function initializeUser() {
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

        // Инициализируем пользователя
        const user = await tgApp.api.initUser(telegramId);
        console.log('Пользователь инициализирован:', user);

        if (!user) {
            throw new Error('Не удалось инициализировать пользователя');
        }

        // Загружаем следующий профиль
        const nextProfile = await tgApp.api.getNextProfile(telegramId);
        console.log('Следующий профиль загружен:', nextProfile);

        if (!nextProfile || !nextProfile.profile) {
            throw new Error('Нет доступных профилей');
        }

        const currentProfile = nextProfile.profile;

        // Обновляем UI
        const profileName = document.getElementById('profileName');
        const profileAge = document.getElementById('profileAge');
        const profileCar = document.getElementById('profileCar');
        const profileRegion = document.getElementById('profileRegion');
        const profileAbout = document.getElementById('profileAbout');
        const profilePhoto = document.getElementById('profilePhoto');

        if (profileName) profileName.textContent = currentProfile.name || 'Не указано';
        if (profileAge) profileAge.textContent = currentProfile.age ? `${currentProfile.age} лет` : 'Не указано';
        if (profileCar) profileCar.textContent = currentProfile.car || 'Не указано';
        if (profileRegion) profileRegion.textContent = currentProfile.region || 'Не указано';
        if (profileAbout) profileAbout.textContent = currentProfile.about || 'Нет описания';
        
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

                    const result = await tgApp.api.likeProfile(currentProfile.id, telegramId);
                    if (result.match) {
                        tgApp.api.showNotification('У вас новый мэтч!');
                    } else {
                        tgApp.api.showNotification('Лайк отправлен!');
                    }
                    
                    // Загружаем следующий профиль
                    const nextProfile = await tgApp.api.getNextProfile(telegramId);
                    if (nextProfile && nextProfile.profile) {
                        const profile = nextProfile.profile;
                        // Обновляем UI
                        if (profileName) profileName.textContent = profile.name || 'Не указано';
                        if (profileAge) profileAge.textContent = profile.age ? `${profile.age} лет` : 'Не указано';
                        if (profileCar) profileCar.textContent = profile.car || 'Не указано';
                        if (profileRegion) profileRegion.textContent = profile.region || 'Не указано';
                        if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
                        if (profilePhoto) {
                            tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
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
                    const nextProfile = await tgApp.api.getNextProfile(telegramId);
                    if (nextProfile && nextProfile.profile) {
                        const profile = nextProfile.profile;
                        // Обновляем UI
                        if (profileName) profileName.textContent = profile.name || 'Не указано';
                        if (profileAge) profileAge.textContent = profile.age ? `${profile.age} лет` : 'Не указано';
                        if (profileCar) profileCar.textContent = profile.car || 'Не указано';
                        if (profileRegion) profileRegion.textContent = profile.region || 'Не указано';
                        if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
                        if (profilePhoto) {
                            tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
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
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Страница загружена, начинаем инициализацию');
    await initializeUser();
}); 