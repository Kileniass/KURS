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

        // Инициализируем пользователя
        const user = await tgApp.api.init();
        console.log('Пользователь инициализирован:', user);

        // Получаем список совпадений
        const matches = await tgApp.api.getMatches();
        console.log('Получены совпадения:', matches);
        
        if (matches && matches.length > 0) {
            displayMatches(matches);
        } else {
            displayNoMatches();
        }

    } catch (error) {
        console.error('Error loading matches:', error);
        showError('Не удалось загрузить список совпадений');
    }
});

function displayMatches(matches) {
    const matchesContainer = document.querySelector('.matches-container');
    if (!matchesContainer) return;
    
    matchesContainer.innerHTML = '';

    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.innerHTML = `
            <div class="match-photo">
                <img src="${match.photo_url || '/image/default-profile.jpg'}" 
                     alt="Фото ${match.name || 'пользователя'}"
                     onerror="this.src='/image/default-profile.jpg'">
            </div>
            <div class="match-info">
                <h3>${match.name || 'Без имени'}</h3>
                <p class="age">${match.age ? `${match.age} лет` : 'Возраст не указан'}</p>
                <p class="car">${match.car || 'Автомобиль не указан'}</p>
                <p class="region">${match.region || 'Регион не указан'}</p>
                <p class="about">${match.about || 'Нет описания'}</p>
            </div>
        `;
        matchesContainer.appendChild(matchCard);
    });
}

function displayNoMatches() {
    const matchesContainer = document.querySelector('.matches-container');
    if (!matchesContainer) return;

    matchesContainer.innerHTML = `
        <div class="no-matches">
            <h2>Пока нет совпадений</h2>
            <p>Продолжайте искать и ставить лайки, чтобы найти единомышленников</p>
        </div>
    `;
}

function showError(message) {
    console.error(message);
    if (window.tgApp) {
        window.tgApp.api.showNotification(message, true);
    } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <p>${message}</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;
        document.body.appendChild(errorDiv);
    }
} 