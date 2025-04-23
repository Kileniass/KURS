document.addEventListener('DOMContentLoaded', async () => {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    let currentProfile = null;
    let currentUserId = null;

    // Инициализация пользователя
    async function initUser() {
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.tg.initDataUnsafe.user.id.toString();
            
            // Инициализируем пользователя на сервере
            const user = await tgApp.api.initUser(telegramId);
            currentUserId = telegramId;
            console.log('User initialized:', user);
            
            // Загружаем первый профиль
            await loadNextProfile();
        } catch (error) {
            console.error('Error initializing user:', error);
            tgApp.tg.showAlert('Ошибка при инициализации пользователя');
        }
    }

    // Загрузка следующего профиля
    async function loadNextProfile() {
        try {
            const profile = await tgApp.api.getNextProfile(currentUserId);
            
            if (!profile) {
                document.getElementById('profilePhoto').src = 'image/placeholder_image.jpg';
                document.getElementById('profileName').textContent = 'Нет доступных профилей';
                document.getElementById('profileAbout').textContent = 'Попробуйте позже';
                document.getElementById('profileCar').textContent = '';
                return;
            }
            
            currentProfile = profile;
            
            // Заполняем данные профиля
            document.getElementById('profilePhoto').src = currentProfile.photo_url || 'image/placeholder_image.jpg';
            document.getElementById('profileName').textContent = `${currentProfile.name}, ${currentProfile.age}`;
            document.getElementById('profileAbout').textContent = currentProfile.about || 'Нет описания';
            document.getElementById('profileCar').textContent = currentProfile.car || 'Не указано';
            
        } catch (error) {
            console.error('Error loading profile:', error);
            tgApp.tg.showAlert('Ошибка при загрузке профиля');
        }
    }

    // Обработчик кнопки лайка
    likeBtn.addEventListener('click', async () => {
        if (!currentProfile) return;
        
        try {
            const result = await tgApp.api.likeProfile(currentProfile.telegram_id, currentUserId);
            
            if (result.is_match) {
                tgApp.tg.showAlert('У вас новое совпадение!');
            } else {
                tgApp.tg.showAlert('Профиль понравился!');
            }
            
            await loadNextProfile();
        } catch (error) {
            console.error('Error liking profile:', error);
            tgApp.tg.showAlert('Ошибка при отправке лайка');
        }
    });

    // Обработчик кнопки дизлайка
    dislikeBtn.addEventListener('click', async () => {
        if (!currentProfile) return;
        
        try {
            await tgApp.api.dislikeProfile(currentProfile.telegram_id, currentUserId);
            await loadNextProfile();
        } catch (error) {
            console.error('Error disliking profile:', error);
            tgApp.tg.showAlert('Ошибка при отправке дизлайка');
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 