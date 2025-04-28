document.addEventListener('DOMContentLoaded', async () => {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    let currentProfile = null;

    // Устанавливаем текст кнопок сразу
    likeBtn.innerHTML = 'Лайк';
    dislikeBtn.innerHTML = 'Дизлайк';

    // Базовые пути для изображений
    const IMAGES_BASE_PATH = 'https://raw.githubusercontent.com/Kileniass/KURS/main/dating-app/image'; // Используем raw.githubusercontent.com
    const DEFAULT_PROFILE_IMAGE = `${IMAGES_BASE_PATH}/hero-image.jpg`;

    // Функция для безопасной загрузки изображений
    function setImageWithFallback(imgElement, src, fallbackSrc = DEFAULT_PROFILE_IMAGE) {
        if (!imgElement) return;

        imgElement.onerror = () => {
            console.warn(`Ошибка загрузки изображения: ${src}, используем запасное`);
            imgElement.src = fallbackSrc;
            imgElement.onerror = null; // Убираем обработчик чтобы избежать рекурсии
        };

        // Если src пустой, используем запасное изображение
        imgElement.src = src || fallbackSrc;
    }

    // Инициализация пользователя (если нужно)
    async function initUser() {
        try {

            // Инициализируем пользователя на сервере
            const user = await tgApp.api.initUser(telegramId);
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
            console.log('Запрос следующего профиля для пользователя с currentUserId = 2');

            // Выполняем запрос к серверу с жёстко заданным currentUserId
            const response = await fetch('https://tg-bd.onrender.com/api/profiles/next?current_user_id=2');
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const profile = await response.json();
            console.log('Ответ сервера:', profile);

            if (!profile) {
                // Если нет доступных профилей
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
            console.error('Ошибка при загрузке профиля:', error);
            tgApp.api.showNotification('Ошибка при загрузке профиля');
        }
    }

    // Обработчик кнопки лайка
    likeBtn.addEventListener('click', async () => {
        if (!currentProfile) return;

        try {
            const response = await fetch('https://tg-bd.onrender.com/api/profiles/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: currentProfile.telegram_id,
                    currentUserId: 2 // Жёстко задаём currentUserId
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const result = await response.json();
            if (result.is_match) {
                tgApp.api.showNotification('У вас новое совпадение!');
            } else {
                tgApp.api.showNotification('Профиль понравился!');
            }

            await loadNextProfile();
        } catch (error) {
            console.error('Ошибка при отправке лайка:', error);
            tgApp.api.showNotification('Ошибка при отправке лайка');
        }
    });

    // Обработчик кнопки дизлайка
    dislikeBtn.addEventListener('click', async () => {
        if (!currentProfile) return;

        try {
            const response = await fetch('https://tg-bd.onrender.com/api/profiles/dislike', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: currentProfile.telegram_id,
                    currentUserId: 2 // Жёстко задаём currentUserId
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            await loadNextProfile();
        } catch (error) {
            console.error('Ошибка при отправке дизлайка:', error);
            tgApp.api.showNotification('Ошибка при отправке дизлайка');
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
});