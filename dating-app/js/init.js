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

    try {
        // Ждем инициализации tgApp
        tgApp = await waitForTgApp();
        console.log('tgApp инициализирован');

        // Инициализируем пользователя и получаем device_id
        const user = await tgApp.api.init();
        console.log('Пользователь инициализирован:', user);

        if (!user) {
            throw new Error('Не удалось инициализировать пользователя');
        }

        // Загружаем следующий профиль
        const nextProfile = await tgApp.api.getNextProfile();
        console.log('Следующий профиль загружен:', nextProfile);

        if (!nextProfile || !nextProfile.profile) {
            throw new Error('Нет доступных профилей');
        }

        displayProfile(nextProfile.profile);

        // Обработчики кнопок
        const likeButton = document.getElementById('likeButton');
        const dislikeButton = document.getElementById('dislikeButton');

        if (likeButton) {
            likeButton.addEventListener('click', async () => {
                try {
                    const currentProfile = document.querySelector('.profile-card');
                    if (!currentProfile || !currentProfile.dataset.profileId) {
                        throw new Error('Нет активного профиля');
                    }

                    const profileId = currentProfile.dataset.profileId;
                    const result = await tgApp.api.likeProfile(profileId);
                    
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
                    const currentProfile = document.querySelector('.profile-card');
                    if (!currentProfile || !currentProfile.dataset.profileId) {
                        throw new Error('Нет активного профиля');
                    }

                    const profileId = currentProfile.dataset.profileId;
                    await tgApp.api.dislikeProfile(profileId);
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
}

// Функция отображения профиля
function displayProfile(profile) {
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        profileCard.dataset.profileId = profile.id;
    }

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

// Функция отображения сообщения об отсутствии профилей
function displayNoMoreProfiles() {
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = '<div class="no-profiles">Больше нет доступных профилей</div>';
    }
    tgApp.api.showNotification('Больше нет доступных профилей');
}

// Функция загрузки следующего профиля
async function loadNextProfile() {
    try {
        const nextProfile = await tgApp.api.getNextProfile();
        if (nextProfile && nextProfile.profile) {
            displayProfile(nextProfile.profile);
        } else {
            displayNoMoreProfiles();
        }
    } catch (error) {
        console.error('Ошибка при загрузке следующего профиля:', error);
        showError('Не удалось загрузить следующий профиль');
    }
}

// Функция отображения уведомления о мэтче
function showMatchNotification() {
    tgApp.api.showNotification('У вас новый мэтч!', false);
}

// Функция отображения ошибки
function showError(message) {
    console.error(message);
    tgApp.api.showNotification(message, true);
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeUser); 