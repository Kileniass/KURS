// Базовый путь к изображениям
const IMAGES_BASE_PATH = 'https://tg-bd.onrender.com/static';
const DEFAULT_PROFILE_IMAGE = `${IMAGES_BASE_PATH}/hero-image.jpg`;

// Функция для установки изображения с запасным вариантом
function setImageWithFallback(imgElement, photoUrl) {
    if (!photoUrl) {
        imgElement.src = DEFAULT_PROFILE_IMAGE;
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
        console.warn('Ошибка загрузки изображения:', photoUrl);
        imgElement.src = DEFAULT_PROFILE_IMAGE;
    };
}

// Функция инициализации пользователя
async function initializeUser() {
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

    // Инициализация пользователя
    async function initUser() {
        try {
            // Ждем инициализации tgApp
            tgApp = await waitForTgApp();
            console.log('tgApp инициализирован');

            if (!tgApp.tg || !tgApp.tg.initDataUnsafe || !tgApp.tg.initDataUnsafe.user) {
                throw new Error('Telegram WebApp не инициализирован корректно');
            }

            const telegramId = tgApp.tg.initDataUnsafe.user.id;
            console.log('Получен telegram_id:', telegramId);
            
            // Инициализируем пользователя на сервере
            const user = await tgApp.api.initUser(telegramId);
            console.log('User initialized:', user);
            
            if (!user || !user.user_id) {
                throw new Error('Не удалось получить данные пользователя');
            }

            // Проверяем, является ли пользователь новым
            if (user.is_new) {
                // Если пользователь новый, перенаправляем на страницу создания профиля
                window.location.href = 'profile-change.html';
                return;
            }

            // Если пользователь существует, проверяем наличие профиля
            if (!user.name || !user.age || !user.car || !user.region) {
                // Если профиль не заполнен, перенаправляем на страницу создания профиля
                window.location.href = 'profile-change.html';
                return;
            }

            // Если профиль заполнен, перенаправляем на главную страницу
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Error initializing user:', error);
            if (tgApp && tgApp.api) {
                tgApp.api.showNotification('Ошибка при инициализации пользователя: ' + error.message, true);
            } else {
                alert('Ошибка при инициализации пользователя: ' + error.message);
            }
        }
    }

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Страница загружена, начинаем инициализацию');
    await initializeUser();
}); 