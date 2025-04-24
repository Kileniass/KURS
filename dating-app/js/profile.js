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

        // Получаем профиль пользователя
        const profile = await tgApp.api.getProfile();
        console.log('Профиль получен:', profile);

        // Заполняем данные профиля
        if (profile) {
            document.getElementById('userName').textContent = profile.name || 'Не указано';
            document.getElementById('userAge').textContent = profile.age ? `${profile.age} лет` : 'Не указан';
            document.getElementById('userCar').textContent = profile.car || 'Не указан';
            document.getElementById('userRegion').textContent = profile.region || 'Не указан';
            document.getElementById('userAbout').textContent = profile.about || 'Нет описания';
            
            const userPhoto = document.getElementById('userPhoto');
            if (profile.photo_url) {
                userPhoto.src = profile.photo_url;
                userPhoto.alt = `Фото ${profile.name}`;
            } else {
                userPhoto.src = '/image/default-profile.jpg';
                userPhoto.alt = 'Фото профиля отсутствует';
            }
        }

        // Обработчик для кнопки редактирования
        document.getElementById('editProfileButton').addEventListener('click', () => {
            window.location.href = '/profile-change.html';
        });

    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Не удалось загрузить профиль');
    }
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentElement.remove()">OK</button>
    `;
    document.body.appendChild(errorDiv);
} 