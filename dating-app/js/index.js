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
                const profileCard = document.querySelector('.profile-card');
                if (!profileCard) {
                    console.error('Profile card not found');
                    return;
                }
                
                const currentProfile = profileCard.dataset.profileId;
                if (!currentProfile) {
                    console.error('No profile ID found');
                    return;
                }

                console.log('Отправка лайка для профиля:', currentProfile);
                const result = await tgApp.api.likeProfile(currentProfile);
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
                const profileCard = document.querySelector('.profile-card');
                if (!profileCard) {
                    console.error('Profile card not found');
                    return;
                }
                
                const currentProfile = profileCard.dataset.profileId;
                if (!currentProfile) {
                    console.error('No profile ID found');
                    return;
                }

                console.log('Отправка дизлайка для профиля:', currentProfile);
                await tgApp.api.dislikeProfile(currentProfile);
                
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
    const profileCard = document.querySelector('.profile-card');
    profileCard.dataset.profileId = profile.id;
    
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileAge').textContent = profile.age;
    
    if (profile.car) {
        document.getElementById('profileCar').textContent = profile.car;
        document.getElementById('carSection').style.display = 'block';
    } else {
        document.getElementById('carSection').style.display = 'none';
    }
    
    if (profile.region) {
        document.getElementById('profileRegion').textContent = profile.region;
        document.getElementById('regionSection').style.display = 'block';
    } else {
        document.getElementById('regionSection').style.display = 'none';
    }
    
    if (profile.about) {
        document.getElementById('profileAbout').textContent = profile.about;
        document.getElementById('aboutSection').style.display = 'block';
    } else {
        document.getElementById('aboutSection').style.display = 'none';
    }
    
    const profileImage = document.getElementById('profileImage');
    if (profile.photo_url) {
        profileImage.src = profile.photo_url;
        profileImage.alt = `${profile.name}'s photo`;
    } else {
        profileImage.src = 'images/default-profile.jpg';
        profileImage.alt = 'Default profile photo';
    }
}

function displayNoMoreProfiles() {
    const profileCard = document.querySelector('.profile-card');
    profileCard.innerHTML = `
        <div class="no-profiles">
            <h2>No more profiles</h2>
            <p>Check back later for new matches!</p>
        </div>
    `;
    document.getElementById('likeButton').disabled = true;
    document.getElementById('dislikeButton').disabled = true;
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