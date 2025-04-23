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

        // Получаем лайки
        const likes = await tgApp.api.getLikes(telegramId);
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
        likes.forEach(like => {
            const card = document.createElement('div');
            card.className = 'like-card';
            
            card.innerHTML = `
                <div class="like-photo">
                    <img src="${like.photo_url || 'default-avatar.png'}" alt="Фото пользователя">
                </div>
                <div class="like-info">
                    <h3>${like.name}</h3>
                    <p>${like.age} лет</p>
                    <p>${like.car}</p>
                    <p>${like.region}</p>
                    <button class="like-back" data-user-id="${like.id}">Лайкнуть в ответ</button>
                </div>
            `;

            likesContainer.appendChild(card);
        });

        // Добавляем обработчики для кнопок лайка
        document.querySelectorAll('.like-back').forEach(button => {
            button.addEventListener('click', async (e) => {
                try {
                    const userId = e.target.dataset.userId;
                    if (!userId || !telegramId) {
                        throw new Error('Не удалось получить ID пользователя или telegram_id');
                    }

                    await tgApp.api.likeProfile(userId, telegramId);
                    tgApp.api.showNotification('Лайк отправлен!');
                    
                    // Удаляем карточку после отправки лайка
                    e.target.closest('.like-card').remove();
                    
                    // Если больше нет лайков, показываем сообщение
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
        console.error('Ошибка при инициализации:', error);
        if (tgApp && tgApp.api) {
            tgApp.api.showNotification(error.message, true);
        } else {
            alert(error.message);
        }
    }
}); 