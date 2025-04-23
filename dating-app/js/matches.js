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

        // Загружаем матчи
        const matches = await tgApp.api.getMatches(sessionId);
        console.log('Матчи получены:', matches);

        const matchesContainer = document.getElementById('matchesContainer');
        if (!matchesContainer) {
            throw new Error('Контейнер для матчей не найден');
        }

        if (!matches || matches.length === 0) {
            matchesContainer.innerHTML = '<p class="no-matches">У вас пока нет совпадений</p>';
            return;
        }

        // Создаем карточки для каждого матча
        matchesContainer.innerHTML = '';
        matches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'match-card';
            
            card.innerHTML = `
                <div class="match-photo">
                    <img src="${match.photo_url || `${tgApp.STATIC_BASE_URL}/photos/hero-image.jpg`}" alt="${match.name}">
                </div>
                <div class="match-info">
                    <h3>${match.name}, ${match.age}</h3>
                    <p class="car-info">${match.car}</p>
                    <p class="region">${match.region}</p>
                    <p class="about">${match.about || 'Нет описания'}</p>
                    <a href="https://t.me/${match.username}" target="_blank" class="match-button">Написать в Telegram</a>
                </div>
            `;

            matchesContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Ошибка при загрузке матчей:', error);
        if (tgApp && tgApp.api) {
            tgApp.api.showNotification(error.message, true);
        } else {
            alert(error.message);
        }
    }
}); 