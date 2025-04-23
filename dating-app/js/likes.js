// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Базовый путь к изображениям
const IMAGES_BASE_PATH = 'https://tg-bd.onrender.com/static';

// Функция для установки изображения с запасным вариантом
function setImageWithFallback(imgElement, photoUrl) {
    if (!photoUrl) {
        imgElement.src = `${IMAGES_BASE_PATH}/hero-image.jpg`;
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
        imgElement.src = `${IMAGES_BASE_PATH}/hero-image.jpg`;
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    let tgApp = null;
    let sessionId = null;

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

        // Получаем session_id
        sessionId = await tgApp.api.getSessionId();
        console.log('Получен session_id:', sessionId);

        // Загружаем лайки
        const likes = await tgApp.api.getLikes(sessionId);
        console.log('Лайки получены:', likes);

        const likesContainer = document.getElementById('likesContainer');
        if (!likesContainer) {
            throw new Error('Контейнер для лайков не найден');
        }

        if (!likes || likes.length === 0) {
            likesContainer.innerHTML = '<p class="no-likes">У вас пока нет лайков</p>';
            return;
        }

        // Создаем карточки для каждого лайка
        likesContainer.innerHTML = '';
        likes.forEach(like => {
            const card = document.createElement('div');
            card.className = 'like-card';
            
            card.innerHTML = `
                <div class="like-photo">
                    <img src="${like.photo_url || `${tgApp.STATIC_BASE_URL}/photos/hero-image.jpg`}" alt="${like.name}">
                </div>
                <div class="like-info">
                    <h3>${like.name}, ${like.age}</h3>
                    <p class="car-info">${like.car}</p>
                    <p class="region">${like.region}</p>
                    <p class="about">${like.about || 'Нет описания'}</p>
                    <button class="like-button" data-user-id="${like.id}">Ответить лайком</button>
                </div>
            `;

            likesContainer.appendChild(card);
        });

        // Добавляем обработчики для кнопок лайка
        document.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', async () => {
                try {
                    const userId = button.dataset.userId;
                    if (!userId || !sessionId) {
                        throw new Error('Не удалось получить ID пользователя или session_id');
                    }

                    await tgApp.api.likeProfile(userId, sessionId);
                    tgApp.api.showNotification('Лайк отправлен!');
                    
                    // Удаляем карточку после успешного лайка
                    button.closest('.like-card').remove();
                    
                    // Проверяем, остались ли еще лайки
                    if (document.querySelectorAll('.like-card').length === 0) {
                        likesContainer.innerHTML = '<p class="no-likes">У вас пока нет лайков</p>';
                    }
                } catch (error) {
                    console.error('Ошибка при отправке лайка:', error);
                    tgApp.api.showNotification(error.message, true);
                }
            });
        });

    } catch (error) {
        console.error('Ошибка при загрузке лайков:', error);
        if (tgApp && tgApp.api) {
            tgApp.api.showNotification(error.message, true);
        } else {
            alert(error.message);
        }
    }
}); 