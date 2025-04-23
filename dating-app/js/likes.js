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

// Функция для загрузки лайков
async function loadLikes() {
    try {
        const telegramId = tg.initDataUnsafe.user.id.toString();
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
            setImageWithFallback(imgElement, user.photo_url);
            
            likesList.appendChild(card);
        });

        // Добавляем обработчики для кнопок
        document.querySelectorAll('.like-card__button').forEach(button => {
            button.addEventListener('click', async () => {
                try {
                    const userId = button.dataset.userId;
                    await tgApp.api.matchUsers(telegramId, userId);
                    
                    // Показываем уведомление об успешном матче
                    tg.showAlert('Поздравляем! У вас взаимная симпатия! Теперь вы можете начать общение.');

                    // Обновляем список лайков
                    loadLikes();
                } catch (error) {
                    console.error('Error matching users:', error);
                    tg.showAlert('Произошла ошибка при создании пары');
                }
            });
        });

    } catch (error) {
        console.error('Error loading likes:', error);
        tg.showAlert('Ошибка при загрузке лайков');
    }
}

// Загружаем лайки при загрузке страницы
document.addEventListener('DOMContentLoaded', loadLikes); 