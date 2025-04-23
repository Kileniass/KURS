document.addEventListener('DOMContentLoaded', async () => {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    let currentProfile = null;
    let currentUserId = null;
    let tgApp = null;

    // Устанавливаем текст кнопок сразу
    likeBtn.innerHTML = 'Лайк';
    dislikeBtn.innerHTML = 'Дизлайк';

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

    // Инициализация пользователя
    async function initUser() {
        try {
            // Ждем инициализации tgApp
            tgApp = await waitForTgApp();
            console.log('tgApp инициализирован');

            if (!tgApp.tg || !tgApp.tg.initDataUnsafe || !tgApp.tg.initDataUnsafe.user) {
                throw new Error('Telegram WebApp не инициализирован корректно');
            }

            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.tg.initDataUnsafe.user.id;
            console.log('Получен telegram_id:', telegramId);
            
            // Инициализируем пользователя на сервере
            const user = await tgApp.api.initUser(telegramId);
            if (!user || !user.user_id) {
                throw new Error('Не удалось получить данные пользователя');
            }
            
            currentUserId = user.user_id;
            console.log('User initialized:', user);
            
            // Загружаем первый профиль
            await loadNextProfile();
        } catch (error) {
            console.error('Error initializing user:', error);
            tgApp.api.showNotification('Ошибка при инициализации пользователя: ' + error.message, true);
        }
    }

    // Загрузка следующего профиля
    async function loadNextProfile() {
        try {
            if (!currentUserId) {
                throw new Error('User ID не найден');
            }

            const profile = await tgApp.api.getNextProfile(currentUserId);
            
            if (!profile) {
                tgApp.api.setImageWithFallback(
                    document.getElementById('profilePhoto'),
                    null
                );
                document.getElementById('profileName').textContent = 'Нет доступных профилей';
                document.getElementById('profileAbout').textContent = 'Попробуйте позже';
                document.getElementById('profileCar').textContent = '';
                return;
            }
            
            currentProfile = profile;
            
            // Заполняем данные профиля
            const profilePhoto = document.getElementById('profilePhoto');
            if (profilePhoto) {
                tgApp.api.setImageWithFallback(profilePhoto, currentProfile.photo_url);
            }
            
            const profileName = document.getElementById('profileName');
            if (profileName) {
                profileName.textContent = `${currentProfile.name}, ${currentProfile.age}`;
            }
            
            const profileAbout = document.getElementById('profileAbout');
            if (profileAbout) {
                profileAbout.textContent = currentProfile.about || 'Нет описания';
            }
            
            const profileCar = document.getElementById('profileCar');
            if (profileCar) {
                profileCar.textContent = currentProfile.car || 'Не указано';
            }
            
            // Обновляем текст кнопок
            likeBtn.innerHTML = 'Лайк';
            dislikeBtn.innerHTML = 'Дизлайк';
            
        } catch (error) {
            console.error('Error loading profile:', error);
            tgApp.api.showNotification('Ошибка при загрузке профиля: ' + error.message, true);
        }
    }

    // Обработчик кнопки лайка
    likeBtn.addEventListener('click', async () => {
        if (!currentProfile || !currentUserId) {
            tgApp.api.showNotification('Профиль не загружен', true);
            return;
        }
        
        try {
            const result = await tgApp.api.likeProfile(currentProfile.id, currentUserId);
            
            if (result.match) {
                tgApp.api.showNotification('У вас новое совпадение!');
            } else {
                tgApp.api.showNotification('Профиль понравился!');
            }
            
            await loadNextProfile();
        } catch (error) {
            console.error('Error liking profile:', error);
            tgApp.api.showNotification('Ошибка при отправке лайка: ' + error.message, true);
        }
    });

    // Обработчик кнопки дизлайка
    dislikeBtn.addEventListener('click', async () => {
        if (!currentProfile || !currentUserId) {
            tgApp.api.showNotification('Профиль не загружен', true);
            return;
        }
        
        try {
            await tgApp.api.dislikeProfile(currentProfile.id, currentUserId);
            await loadNextProfile();
        } catch (error) {
            console.error('Error disliking profile:', error);
            tgApp.api.showNotification('Ошибка при отправке дизлайка: ' + error.message, true);
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 