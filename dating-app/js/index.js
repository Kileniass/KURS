document.addEventListener('DOMContentLoaded', async () => {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    let currentProfile = null;
    let currentUserId = null;

    // Базовые пути для изображений
    const IMAGES_BASE_PATH = '/dating-app/image';

    // Функция для безопасной загрузки изображений
    function setImageWithFallback(imgElement, src, fallbackSrc) {
        imgElement.onerror = () => {
            console.warn(`Ошибка загрузки изображения: ${src}, используем запасное`);
            imgElement.src = fallbackSrc;
            imgElement.onerror = null; // Убираем обработчик чтобы избежать рекурсии
        };
        imgElement.src = src;
    }

    // Инициализация пользователя
    async function initUser() {
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.api.getTelegramId();
            
            // Инициализируем пользователя на сервере
            const user = await tgApp.api.initUser(telegramId);
            currentUserId = telegramId;
            console.log('User initialized:', user);
            
            // Загружаем первый профиль
            await loadNextProfile();
        } catch (error) {
            console.error('Error initializing user:', error);
            tgApp.api.showNotification('Ошибка при инициализации пользователя');
        }
    }

    // Загрузка следующего профиля
    async function loadNextProfile() {
        try {
            const profile = await tgApp.api.getNextProfile(currentUserId);
            
            if (!profile) {
                setImageWithFallback(
                    document.getElementById('profilePhoto'),
                    `${IMAGES_BASE_PATH}/placeholder_image.jpg`,
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
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
                currentProfile.photo_url || `${IMAGES_BASE_PATH}/placeholder_image.jpg`,
                `${IMAGES_BASE_PATH}/placeholder_image.jpg`
            );
            document.getElementById('profileName').textContent = `${currentProfile.name}, ${currentProfile.age}`;
            document.getElementById('profileAbout').textContent = currentProfile.about || 'Нет описания';
            document.getElementById('profileCar').textContent = currentProfile.car || 'Не указано';
            
            // Обновляем иконки кнопок
            setImageWithFallback(
                document.querySelector('#likeBtn img'),
                `${IMAGES_BASE_PATH}/icon_like.svg`,
                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41M0wxMiAyMS4zNXoiLz48L3N2Zz4='
            );
            setImageWithFallback(
                document.querySelector('#dislikeBtn img'),
                `${IMAGES_BASE_PATH}/icon_dislike.svg`,
                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMjEuMzVsLTEuNDUtMS4zMkM1LjQgMTUuMzYgMiAxMi4yOCAyIDguNSAyIDUuNDIgNC40MiAzIDcuNSAzYzEuNzQgMCAzLjQxLjgxIDQuNSAyLjA5QzEzLjA5IDMuODEgMTQuNzYgMyAxNi41IDMgMTkuNTggMyAyMiA1LjQyIDIyIDguNWMwIDMuNzgtMy40IDYuODYtOC41NSAxMS41M0wxMiAyMS4zNXoiLz48L3N2Zz4='
            );
            
        } catch (error) {
            console.error('Error loading profile:', error);
            tgApp.api.showNotification('Ошибка при загрузке профиля');
        }
    }

    // Обработчик кнопки лайка
    likeBtn.addEventListener('click', async () => {
        if (!currentProfile) return;
        
        try {
            const result = await tgApp.api.likeProfile(currentProfile.telegram_id, currentUserId);
            
            if (result.is_match) {
                tgApp.api.showNotification('У вас новое совпадение!');
            } else {
                tgApp.api.showNotification('Профиль понравился!');
            }
            
            await loadNextProfile();
        } catch (error) {
            console.error('Error liking profile:', error);
            tgApp.api.showNotification('Ошибка при отправке лайка');
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
            tgApp.api.showNotification('Ошибка при отправке дизлайка');
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 