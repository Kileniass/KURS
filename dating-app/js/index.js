document.addEventListener('DOMContentLoaded', async () => {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    let currentProfile = null;
    let currentUserId = null;

    // Устанавливаем текст кнопок сразу
    likeBtn.innerHTML = 'Лайк';
    dislikeBtn.innerHTML = 'Дизлайк';

    // Базовые пути для изображений
    const IMAGES_BASE_PATH = '/image';
    const DEFAULT_PROFILE_IMAGE = `${IMAGES_BASE_PATH}/hero-image.jpg`;

    // Функция для безопасной загрузки изображений
    function setImageWithFallback(imgElement, src, fallbackSrc = DEFAULT_PROFILE_IMAGE) {
        if (!imgElement) return;
        
        imgElement.onerror = () => {
            console.warn(`Ошибка загрузки изображения: ${src}, используем запасное`);
            imgElement.src = fallbackSrc;
            imgElement.onerror = null; // Убираем обработчик чтобы избежать рекурсии
        };
        imgElement.src = src || fallbackSrc;
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