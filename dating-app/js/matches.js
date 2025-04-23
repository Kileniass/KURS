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

        // Получаем мэтчи
        const matches = await tgApp.api.getMatches(telegramId);
        console.log('Мэтчи получены:', matches);

        const matchesContainer = document.getElementById('matchesContainer');
        if (!matchesContainer) {
            throw new Error('Контейнер для мэтчей не найден');
        }

        if (!matches || matches.length === 0) {
            matchesContainer.innerHTML = '<p class="no-matches">У вас пока нет мэтчей</p>';
            return;
        }

        // Создаем карточки для каждого мэтча
        matches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'match-card';
            
            card.innerHTML = `
                <div class="match-photo">
                    <img src="${match.photo_url || 'default-avatar.png'}" alt="Фото пользователя">
                </div>
                <div class="match-info">
                    <h3>${match.name}</h3>
                    <p>${match.age} лет</p>
                    <p>${match.car}</p>
                    <p>${match.region}</p>
                    <p class="about">${match.about || 'Нет описания'}</p>
                </div>
            `;

            matchesContainer.appendChild(card);
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