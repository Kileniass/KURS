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
        imgElement.src = DEFAULT_PROFILE_IMAGE;
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

    // Загрузка профиля пользователя
    async function loadProfile() {
        try {
            // Ждем инициализации tgApp
            tgApp = await waitForTgApp();
            console.log('tgApp инициализирован');

            if (!tgApp.tg || !tgApp.tg.initDataUnsafe || !tgApp.tg.initDataUnsafe.user) {
                throw new Error('Telegram WebApp не инициализирован корректно');
            }

            const telegramId = tgApp.tg.initDataUnsafe.user.id;
            console.log('Получен telegram_id:', telegramId);
            
            // Получаем session_id
            const sessionId = await tgApp.api.getSessionId();
            console.log('Получен session_id:', sessionId);
            
            // Получаем профиль пользователя
            const profile = await tgApp.api.getProfile(sessionId);
            console.log('Профиль пользователя получен:', profile);
            
            if (!profile) {
                throw new Error('Профиль не найден');
            }

            // Заполняем данные профиля
            const profilePhoto = document.getElementById('profilePhoto');
            if (profilePhoto) {
                tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
            }
            
            const profileName = document.getElementById('profileName');
            if (profileName) {
                profileName.textContent = `${profile.name}, ${profile.age}`;
            }
            
            const profileAbout = document.getElementById('profileAbout');
            if (profileAbout) {
                profileAbout.textContent = profile.about || 'Нет описания';
            }
            
            const profileCar = document.getElementById('profileCar');
            if (profileCar) {
                profileCar.textContent = profile.car || 'Не указано';
            }
            
            const profileRegion = document.getElementById('profileRegion');
            if (profileRegion) {
                profileRegion.textContent = profile.region || 'Не указан';
            }

        } catch (error) {
            console.error('Ошибка при загрузке профиля:', error);
            if (tgApp && tgApp.api) {
                tgApp.api.showNotification('Ошибка при загрузке профиля: ' + error.message, true);
            } else {
                alert('Ошибка при загрузке профиля: ' + error.message);
            }
        }
    }

    // Загружаем профиль при загрузке страницы
    await loadProfile();
}); 