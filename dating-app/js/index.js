document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Начало инициализации приложения...');
        
        // Wait for tgApp initialization
        async function waitForTgApp() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 20;
                
                const checkTgApp = () => {
                    attempts++;
                    if (window.tgApp) {
                        console.log('Telegram WebApp найден');
                        resolve(window.tgApp);
                    } else if (attempts >= maxAttempts) {
                        console.warn('Telegram WebApp не найден после ' + maxAttempts + ' попыток');
                        resolve(null); // Продолжаем без Telegram WebApp
                    } else {
                        setTimeout(checkTgApp, 500);
                    }
                };
                
                checkTgApp();
            });
        }

        // Get tgApp instance
        const tgApp = await waitForTgApp();
        console.log('Статус инициализации tgApp:', tgApp ? 'успешно' : 'не найден');

        // Generate or retrieve device ID
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('device_id', deviceId);
            console.log('Создан новый device_id:', deviceId);
        } else {
            console.log('Использован существующий device_id:', deviceId);
        }

        // Initialize user profile
        try {
            console.log('Начало инициализации пользователя...');
            
            if (!tgApp) {
                throw new Error('Telegram WebApp не инициализирован');
            }

            // Инициализируем пользователя
            const initResponse = await tgApp.api.init();
            console.log('Ответ инициализации:', initResponse);

            // Получаем профиль
            const profile = await tgApp.api.getProfile();
            console.log('Профиль пользователя:', profile);

            if (!profile) {
                console.log('Профиль не найден, перенаправление на создание...');
                // Используем относительный путь
                const baseUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                window.location.href = baseUrl + 'profile-change.html';
                return;
            }

            // Load next profile
            const nextProfileResponse = await tgApp.api.getNextProfile();
            console.log('Следующий профиль:', nextProfileResponse);
            
            if (nextProfileResponse && nextProfileResponse.profile) {
                displayProfile(nextProfileResponse.profile);
            } else {
                displayNoMoreProfiles();
            }
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
            if (error.message.includes('404')) {
                console.log('Профиль не найден, перенаправление на создание...');
                const baseUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                window.location.href = baseUrl + 'profile-change.html';
            } else {
                showError('Ошибка инициализации: ' + error.message);
            }
            return;
        }

        // Add event listeners for like/dislike buttons
        document.getElementById('likeButton')?.addEventListener('click', async () => {
            try {
                const likeButton = document.getElementById('likeButton');
                if (!likeButton || !likeButton.dataset.profileId) {
                    console.error('ID профиля не найден');
                    return;
                }

                const currentProfileId = likeButton.dataset.profileId;
                console.log('Отправка лайка для профиля:', currentProfileId);
                
                const result = await tgApp.api.likeProfile(currentProfileId);
                console.log('Результат лайка:', result);
                
                if (result.match) {
                    showMatchNotification();
                }
                
                const nextProfileResponse = await tgApp.api.getNextProfile();
                console.log('Следующий профиль после лайка:', nextProfileResponse);
                
                if (nextProfileResponse && nextProfileResponse.profile) {
                    displayProfile(nextProfileResponse.profile);
                } else {
                    displayNoMoreProfiles();
                }
            } catch (error) {
                console.error('Ошибка при обработке лайка:', error);
                showError('Не удалось обработать лайк: ' + error.message);
            }
        });

        document.getElementById('dislikeButton')?.addEventListener('click', async () => {
            try {
                const dislikeButton = document.getElementById('dislikeButton');
                if (!dislikeButton || !dislikeButton.dataset.profileId) {
                    console.error('ID профиля не найден');
                    return;
                }

                const currentProfileId = dislikeButton.dataset.profileId;
                console.log('Отправка дизлайка для профиля:', currentProfileId);
                
                await tgApp.api.dislikeProfile(currentProfileId);
                
                const nextProfileResponse = await tgApp.api.getNextProfile();
                console.log('Следующий профиль после дизлайка:', nextProfileResponse);
                
                if (nextProfileResponse && nextProfileResponse.profile) {
                    displayProfile(nextProfileResponse.profile);
                } else {
                    displayNoMoreProfiles();
                }
            } catch (error) {
                console.error('Ошибка при обработке дизлайка:', error);
                showError('Не удалось обработать дизлайк: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Критическая ошибка:', error);
        showError('Критическая ошибка приложения: ' + error.message);
    }
});

function displayProfile(profile) {
    if (!profile) {
        console.error('Профиль не определен');
        displayNoMoreProfiles();
        return;
    }

    console.log('Отображение профиля:', profile);

    // Обновляем фото профиля
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) {
        if (profile.photo_url) {
            profilePhoto.src = profile.photo_url.startsWith('http') 
                ? profile.photo_url 
                : `${STATIC_BASE_URL}${profile.photo_url}`;
            profilePhoto.alt = `Фото ${profile.name}`;
        } else {
            profilePhoto.src = './image/placeholder_image.jpg';
            profilePhoto.alt = 'Фото профиля отсутствует';
        }
    }

    // Обновляем имя
    const nameElement = document.getElementById('profileName');
    if (nameElement) {
        nameElement.textContent = profile.name || 'Без имени';
    }

    // Обновляем описание
    const aboutElement = document.getElementById('profileAbout');
    if (aboutElement) {
        aboutElement.textContent = profile.about || 'Нет описания';
        aboutElement.style.display = profile.about ? 'block' : 'none';
    }

    // Обновляем информацию об автомобиле
    const carElement = document.getElementById('profileCar');
    if (carElement) {
        carElement.textContent = profile.car || 'Автомобиль не указан';
        carElement.style.display = profile.car ? 'block' : 'none';
    }

    // Сохраняем ID профиля для кнопок лайка/дизлайка
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');
    
    if (likeButton) {
        likeButton.dataset.profileId = profile.id;
        likeButton.disabled = false;
    }
    
    if (dislikeButton) {
        dislikeButton.dataset.profileId = profile.id;
        dislikeButton.disabled = false;
    }
}

function displayNoMoreProfiles() {
    console.log('Отображение сообщения об отсутствии профилей');
    
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) {
        profilePhoto.src = './image/no_more_profiles.jpg';
        profilePhoto.alt = 'Нет доступных профилей';
    }

    const nameElement = document.getElementById('profileName');
    if (nameElement) {
        nameElement.textContent = 'Профили закончились';
    }

    const aboutElement = document.getElementById('profileAbout');
    if (aboutElement) {
        aboutElement.textContent = 'Загляните позже, чтобы увидеть новые анкеты!';
    }

    const carElement = document.getElementById('profileCar');
    if (carElement) {
        carElement.style.display = 'none';
    }

    // Отключаем кнопки
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');
    
    if (likeButton) {
        likeButton.disabled = true;
    }
    
    if (dislikeButton) {
        dislikeButton.disabled = true;
    }
}

function showMatchNotification() {
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerHTML = `
        <div class="match-content">
            <h3>It's a match! 🎉</h3>
            <p>You can now chat with this person</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(notification);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <div class="error-content">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(notification);
} 