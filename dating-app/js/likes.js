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

        // Обновляем UI
        const likesContainer = document.getElementById('likesContainer');
        if (likesContainer) {
            if (likes && likes.length > 0) {
                likesContainer.innerHTML = likes.map(like => `
                    <div class="like-item">
                        <img src="${like.photo_url || tgApp.STATIC_BASE_URL + '/photos/hero-image.jpg'}" alt="${like.name}" class="like-photo">
                        <div class="like-info">
                            <h3>${like.name}, ${like.age}</h3>
                            <p>${like.car || 'Автомобиль не указан'}</p>
                            <p>${like.region || 'Регион не указан'}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                likesContainer.innerHTML = '<p>У вас пока нет лайков</p>';
            }
        }

    } catch (error) {
        console.error('Ошибка при загрузке лайков:', error);
        if (tgApp && tgApp.api) {
            tgApp.api.showNotification(error.message, true);
        } else {
            alert(error.message);
        }
    }
}); 