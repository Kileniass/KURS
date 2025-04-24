document.addEventListener('DOMContentLoaded', async () => {
    let tgApp = null;
    let currentProfile = null;

    // Функция ожидания инициализации tgApp
    async function waitForTgApp(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (window.tgApp && window.tgApp.isReady()) {
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
        console.log('Профиль пользователя получен:', profile);

        if (!profile) {
            // Если профиль не существует, перенаправляем на страницу создания профиля
            window.location.href = '/profile-change.html';
            return;
        }

        // Загружаем следующий профиль
        const nextProfile = await tgApp.api.getNextProfile();
        console.log('Следующий профиль загружен:', nextProfile);

        if (!nextProfile) {
            displayNoProfiles();
            return;
        }

        currentProfile = nextProfile;
        displayProfile(currentProfile);

        // Обработчики кнопок
        const likeButton = document.getElementById('likeButton');
        const dislikeButton = document.getElementById('dislikeButton');

        if (likeButton) {
            likeButton.addEventListener('click', async () => {
                try {
                    if (!currentProfile) {
                        throw new Error('Нет активного профиля');
                    }

                    const result = await tgApp.api.likeProfile(currentProfile.id);
                    
                    if (result.match) {
                        showMatchNotification();
                    } else {
                        tgApp.api.showNotification('Лайк отправлен!');
                    }
                    
                    await loadNextProfile();
                } catch (error) {
                    console.error('Ошибка при отправке лайка:', error);
                    showError(error.message);
                }
            });
        }

        if (dislikeButton) {
            dislikeButton.addEventListener('click', async () => {
                try {
                    if (!currentProfile) {
                        throw new Error('Нет активного профиля');
                    }

                    await tgApp.api.dislikeProfile(currentProfile.id);
                    tgApp.api.showNotification('Дизлайк отправлен');
                    
                    await loadNextProfile();
                } catch (error) {
                    console.error('Ошибка при отправке дизлайка:', error);
                    showError(error.message);
                }
            });
        }

    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        showError(error.message);
    }
});

function displayProfile(profile) {
    const profileName = document.getElementById('profileName');
    const profileAge = document.getElementById('profileAge');
    const profileCar = document.getElementById('profileCar');
    const profileRegion = document.getElementById('profileRegion');
    const profileAbout = document.getElementById('profileAbout');
    const profilePhoto = document.getElementById('profilePhoto');

    if (profileName) profileName.textContent = profile.name || 'Не указано';
    if (profileAge) profileAge.textContent = profile.age ? `${profile.age} лет` : 'Не указано';
    if (profileCar) profileCar.textContent = profile.car || 'Не указано';
    if (profileRegion) profileRegion.textContent = profile.region || 'Не указано';
    if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
    
    if (profilePhoto) {
        tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
    }
}

function displayNoProfiles() {
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = '<div class="no-profiles">Больше нет доступных профилей</div>';
    }
    tgApp.api.showNotification('Больше нет доступных профилей');
}

async function loadNextProfile() {
    try {
        const nextProfile = await tgApp.api.getNextProfile();
        if (nextProfile) {
            currentProfile = nextProfile;
            displayProfile(currentProfile);
        } else {
            displayNoProfiles();
        }
    } catch (error) {
        console.error('Ошибка при загрузке следующего профиля:', error);
        showError('Не удалось загрузить следующий профиль');
    }
}

function showMatchNotification() {
    tgApp.api.showNotification('У вас новый мэтч!', false);
}

function showError(message) {
    console.error(message);
    if (window.tgApp) {
        window.tgApp.api.showNotification(message, true);
    } else {
        alert(message);
    }
} 