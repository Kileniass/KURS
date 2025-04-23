document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация пользователя
    async function initUser() {
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.tg.initDataUnsafe.user.id.toString();
            
            // Инициализируем пользователя на сервере
            const user = await tgApp.api.initUser(telegramId);
            console.log('User initialized:', user);
            
            // Загружаем лайки
            await loadLikes(user.id);
        } catch (error) {
            console.error('Error initializing user:', error);
            tgApp.tg.showAlert('Ошибка при инициализации пользователя');
        }
    }

    // Загрузка лайков
    async function loadLikes(userId) {
        try {
            const matches = await tgApp.api.getMatches(userId);
            
            if (!matches || matches.length === 0) {
                // Если нет лайков, оставляем стандартное сообщение
                return;
            }
            
            // Если есть лайки, отображаем их
            const heroMessage = document.querySelector('.hero__message');
            const heroButton = document.querySelector('.hero__button');
            
            // Скрываем стандартное сообщение и кнопку
            heroMessage.style.display = 'none';
            heroButton.style.display = 'none';
            
            // Создаем список лайков
            const likesList = document.createElement('div');
            likesList.className = 'likes-list';
            
            // Добавляем каждый лайк в список
            matches.forEach(match => {
                const likeItem = document.createElement('div');
                likeItem.className = 'like-item';
                
                likeItem.innerHTML = `
                    <div class="like-item__photo">
                        <img src="${match.photo_url || 'image/placeholder_image.jpg'}" alt="Фото профиля">
                    </div>
                    <div class="like-item__info">
                        <h3 class="like-item__name">${match.name}, ${match.age}</h3>
                        <p class="like-item__car">${match.car || 'Не указано'}</p>
                    </div>
                `;
                
                likesList.appendChild(likeItem);
            });
            
            // Добавляем список в контейнер
            const heroContent = document.querySelector('.hero__content');
            heroContent.appendChild(likesList);
            
        } catch (error) {
            console.error('Error loading likes:', error);
            tgApp.tg.showAlert('Ошибка при загрузке лайков');
        }
    }

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 