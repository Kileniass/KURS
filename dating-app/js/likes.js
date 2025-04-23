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

    // Функция для загрузки лайков
    async function loadLikes() {
        try {
            // Ждем инициализации tgApp
            tgApp = await waitForTgApp();
            console.log('tgApp инициализирован');

            if (!tgApp.tg || !tgApp.tg.initDataUnsafe || !tgApp.tg.initDataUnsafe.user) {
                throw new Error('Telegram WebApp не инициализирован корректно');
            }

            const telegramId = tgApp.tg.initDataUnsafe.user.id;
            const likes = await tgApp.api.getLikes(telegramId);

            const heroContainer = document.querySelector('.hero__container');
            
            if (!likes || likes.length === 0) {
                // Если лайков нет, показываем сообщение по умолчанию
                heroContainer.innerHTML = `
                    <div class="hero__content">
                        <div class="hero__icon">
                            <img src="image/icon_like.png" alt="Иконка сердца" class="img__heart">
                        </div>
                        <div class="hero__message">
                            <p class="hero__text">Здесь пока никого нет.</p>
                            <p class="hero__text">Вас пока никто не лайкнул, не огорчайся, это временно.</p>
                        </div>
                        <div class="hero__button">
                            <a href="index.html" target="_self" class="btn__view-profiles">
                                <span class="btn__text">Смотреть анкеты</span>
                            </a>
                        </div>
                    </div>
                `;
                return;
            }

            // Если есть лайки, создаем новую разметку
            heroContainer.innerHTML = `
                <div class="likes">
                    <div class="likes__container">
                        <h2 class="likes__title">Вас лайкнули</h2>
                        <div class="likes__list"></div>
                    </div>
                </div>
            `;

            const likesList = document.querySelector('.likes__list');

            // Добавляем карточки пользователей
            likes.forEach(user => {
                const card = document.createElement('div');
                card.className = 'like-card';
                card.innerHTML = `
                    <img src="" alt="${user.name}" class="like-card__image">
                    <div class="like-card__content">
                        <h3 class="like-card__name">${user.name}</h3>
                        <p class="like-card__car">${user.car || 'Автомобиль не указан'}</p>
                        <p class="like-card__about">${user.about || 'Нет описания'}</p>
                        <button class="like-card__button" data-user-id="${user.id}">Ответить взаимностью</button>
                    </div>
                `;
                
                // Устанавливаем изображение с запасным вариантом
                const imgElement = card.querySelector('.like-card__image');
                tgApp.api.setImageWithFallback(imgElement, user.photo_url);
                
                likesList.appendChild(card);
            });

            // Добавляем обработчики для кнопок
            document.querySelectorAll('.like-card__button').forEach(button => {
                button.addEventListener('click', async () => {
                    try {
                        const userId = button.dataset.userId;
                        await tgApp.api.likeProfile(userId, telegramId);
                        
                        // Показываем уведомление об успешном матче
                        tgApp.api.showNotification('Поздравляем! У вас взаимная симпатия!');

                        // Обновляем список лайков
                        loadLikes();
                    } catch (error) {
                        console.error('Error matching users:', error);
                        tgApp.api.showNotification('Ошибка при создании пары: ' + error.message, true);
                    }
                });
            });

        } catch (error) {
            console.error('Error loading likes:', error);
            if (tgApp && tgApp.api) {
                tgApp.api.showNotification('Ошибка при загрузке лайков: ' + error.message, true);
            } else {
                alert('Ошибка при загрузке лайков: ' + error.message);
            }
        }
    }

    // Загружаем лайки при загрузке страницы
    await loadLikes();
}); 