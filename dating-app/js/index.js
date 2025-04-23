document.addEventListener('DOMContentLoaded', async () => {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    let currentProfile = null;
    let currentUserId = null;

    // Устанавливаем текст кнопок сразу
    likeBtn.innerHTML = 'Лайк';
    dislikeBtn.innerHTML = 'Дизлайк';

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

    // Инициализация пользователя
    async function initUser() {
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tg.api.getTelegramId();
            
            // Инициализируем пользователя на сервере
            const user = await tg.api.initUser(telegramId);
            currentUserId = telegramId;
            console.log('User initialized:', user);
            
            // Загружаем первый профиль
            await loadNextProfile();
        } catch (error) {
            console.error('Error initializing user:', error);
            tg.api.showNotification('Ошибка при инициализации пользователя');
        }
    }

    // Загрузка следующего профиля
    async function loadNextProfile() {
        try {
            const profile = await tg.api.getNextProfile(currentUserId);
            
            if (!profile) {
                setImageWithFallback(
                    document.getElementById('profilePhoto'),
                    DEFAULT_PROFILE_IMAGE
                );
                document.getElementById('profileName').textContent = 'Нет доступных профилей';
                document.getElementById('profileAbout').textContent = 'Попробуйте позже';
                document.getElementById('profileCar').textContent = '';
                return;
            }
            
            currentProfile = profile;
            
            // Заполняем данные профиля
            setImageWithFallback(
                document.getElementById('profilePhoto'),
                currentProfile.photo_url || DEFAULT_PROFILE_IMAGE
            );
            document.getElementById('profileName').textContent = `${currentProfile.name}, ${currentProfile.age}`;
            document.getElementById('profileAbout').textContent = currentProfile.about || 'Нет описания';
            document.getElementById('profileCar').textContent = currentProfile.car || 'Не указано';
            
            // Обновляем текст кнопок
            likeBtn.innerHTML = 'Лайк';
            dislikeBtn.innerHTML = 'Дизлайк';
            
        } catch (error) {
            console.error('Error loading profile:', error);
            tg.api.showNotification('Ошибка при загрузке профиля');
        }
    }

    // Обработчик кнопки лайка
    likeBtn.addEventListener('click', async () => {
        if (!currentProfile) return;
        
        try {
            const result = await tg.api.likeProfile(currentProfile.telegram_id, currentUserId);
            
            if (result.is_match) {
                tg.api.showNotification('У вас новое совпадение!');
            } else {
                tg.api.showNotification('Профиль понравился!');
            }
            
            await loadNextProfile();
        } catch (error) {
            console.error('Error liking profile:', error);
            tg.api.showNotification('Ошибка при отправке лайка');
        }
    });

    // Обработчик кнопки дизлайка
    dislikeBtn.addEventListener('click', async () => {
        if (!currentProfile) return;
        
        try {
            await tg.api.dislikeProfile(currentProfile.telegram_id, currentUserId);
            await loadNextProfile();
        } catch (error) {
            console.error('Error disliking profile:', error);
            tg.api.showNotification('Ошибка при отправке дизлайка');
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 