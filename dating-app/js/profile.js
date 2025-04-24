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
        
        // Получаем профиль пользователя
        const profile = await tgApp.api.getProfile();
        console.log('Профиль получен:', profile);
        
        // Заполняем данные профиля
        if (profile) {
            const userName = document.getElementById('userName');
            const userAge = document.getElementById('userAge');
            const userCar = document.getElementById('userCar');
            const userRegion = document.getElementById('userRegion');
            const userAbout = document.getElementById('userAbout');
            const userPhoto = document.getElementById('userPhoto');

            if (userName) userName.textContent = profile.name || 'Не указано';
            if (userAge) userAge.textContent = profile.age ? `${profile.age} лет` : 'Не указан';
            if (userCar) userCar.textContent = profile.car || 'Не указан';
            if (userRegion) userRegion.textContent = profile.region || 'Не указан';
            if (userAbout) userAbout.textContent = profile.about || 'Нет описания';
            
            if (userPhoto) {
                tgApp.api.setImageWithFallback(userPhoto, profile.photo_url);
            }
        }

        // Обработчик для кнопки редактирования
        const editButton = document.getElementById('editProfileButton');
        if (editButton) {
            editButton.addEventListener('click', () => {
                window.location.href = '/profile-change.html';
            });
        }

    } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        showError('Не удалось загрузить профиль');
    }
});

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