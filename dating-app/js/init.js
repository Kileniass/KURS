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
    let tg;
    try {
        tg = window.Telegram.WebApp;
        if (!tg) {
            throw new Error('Telegram WebApp не инициализирован');
        }
        console.log('Начало инициализации пользователя');
        
        // Получаем telegram_id из Telegram WebApp
        if (!tg.initDataUnsafe || !tg.initDataUnsafe.user || !tg.initDataUnsafe.user.id) {
            throw new Error('Не удалось получить ID пользователя из Telegram WebApp');
        }
        
        const telegramId = tg.initDataUnsafe.user.id.toString();
        console.log('Получен telegram_id:', telegramId);
        
        try {
            // Пытаемся получить профиль пользователя
            const user = await tgApp.api.getProfile(telegramId);
            console.log('Пользователь найден:', user);
            
            // Проверяем, заполнен ли профиль
            if (!user || !user.name) {
                console.log('Профиль не заполнен, перенаправление на страницу заполнения профиля');
                window.location.href = 'profile-change.html';
                return;
            }
            
        } catch (error) {
            if (error.message.includes('404')) {
                // Если пользователь не найден, создаем новый профиль
                console.log('Пользователь не найден, создаем новый профиль');
                await tgApp.api.initUser(telegramId);
                window.location.href = 'profile-change.html';
                return;
            }
            throw error;
        }
        
        // Проверяем текущую страницу
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        console.log('Текущая страница:', currentPage);
        
        if (currentPage === 'index.html') {
            console.log('Проверка профиля на главной странице');
            // Если мы на главной странице, проверяем профиль
            const user = await tgApp.api.getProfile(telegramId);
            if (!user || !user.name) {
                console.log('Профиль не найден или не заполнен, перенаправление');
                window.location.href = 'profile-change.html';
                return;
            }
        }
        
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        if (tg) {
            tg.showAlert('Ошибка при инициализации приложения: ' + error.message);
        }
        
        // В случае ошибки перенаправляем на создание профиля
        if (!window.location.pathname.includes('profile-change.html')) {
            console.log('Перенаправление на страницу создания профиля из-за ошибки');
            window.location.href = 'profile-change.html';
        }
    }
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница загружена, начинаем инициализацию');
    initializeUser();
}); 