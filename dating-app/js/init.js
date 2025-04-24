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

        if (!tgApp.tg || !tgApp.tg.initDataUnsafe || !tgApp.tg.initDataUnsafe.user) {
            throw new Error('Telegram WebApp не инициализирован корректно');
        }

        // Получаем telegram_id
        const telegramId = tgApp.api.getTelegramId();
        console.log('Получен telegram_id:', telegramId);

        // Инициализируем пользователя
        const user = await tgApp.api.initUser(telegramId);
        console.log('Пользователь инициализирован:', user);

        if (!user) {
            throw new Error('Не удалось инициализировать пользователя');
        }

        // Загружаем следующий профиль
        const nextProfile = await tgApp.api.getNextProfile(telegramId);
        console.log('Следующий профиль загружен:', nextProfile);

        if (!nextProfile || !nextProfile.profile) {
            throw new Error('Нет доступных профилей');
        }

        const currentProfile = nextProfile.profile;

        // Обновляем UI
        const profileName = document.getElementById('profileName');
        const profileAge = document.getElementById('profileAge');
        const profileCar = document.getElementById('profileCar');
        const profileRegion = document.getElementById('profileRegion');
        const profileAbout = document.getElementById('profileAbout');
        const profilePhoto = document.getElementById('profilePhoto');

        if (profileName) profileName.textContent = currentProfile.name || 'Не указано';
        if (profileAge) profileAge.textContent = currentProfile.age ? `${currentProfile.age} лет` : 'Не указано';
        if (profileCar) profileCar.textContent = currentProfile.car || 'Не указано';
        if (profileRegion) profileRegion.textContent = currentProfile.region || 'Не указано';
        if (profileAbout) profileAbout.textContent = currentProfile.about || 'Нет описания';
        
        if (profilePhoto) {
            tgApp.api.setImageWithFallback(profilePhoto, currentProfile.photo_url);
        }

        // Обработчики кнопок
        const likeButton = document.getElementById('likeButton');
        const dislikeButton = document.getElementById('dislikeButton');

        if (likeButton) {
            likeButton.addEventListener('click', async () => {
                try {
                    if (!currentProfile || !telegramId) {
                        throw new Error('Нет активного профиля или telegram_id');
                    }

                    const result = await tgApp.api.likeProfile(currentProfile.id, telegramId);
                    if (result.match) {
                        tgApp.api.showNotification('У вас новый мэтч!');
                    } else {
                        tgApp.api.showNotification('Лайк отправлен!');
                    }
                    
                    // Загружаем следующий профиль
                    const nextProfile = await tgApp.api.getNextProfile(telegramId);
                    if (nextProfile && nextProfile.profile) {
                        const profile = nextProfile.profile;
                        // Обновляем UI
                        if (profileName) profileName.textContent = profile.name || 'Не указано';
                        if (profileAge) profileAge.textContent = profile.age ? `${profile.age} лет` : 'Не указано';
                        if (profileCar) profileCar.textContent = profile.car || 'Не указано';
                        if (profileRegion) profileRegion.textContent = profile.region || 'Не указано';
                        if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
                        if (profilePhoto) {
                            tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
                        }
                    } else {
                        tgApp.api.showNotification('Больше нет доступных профилей');
                    }
                } catch (error) {
                    console.error('Ошибка при отправке лайка:', error);
                    tgApp.api.showNotification(error.message, true);
                }
            });
        }

        if (dislikeButton) {
            dislikeButton.addEventListener('click', async () => {
                try {
                    if (!currentProfile || !telegramId) {
                        throw new Error('Нет активного профиля или telegram_id');
                    }

                    await tgApp.api.dislikeProfile(currentProfile.id, telegramId);
                    tgApp.api.showNotification('Дизлайк отправлен');
                    
                    // Загружаем следующий профиль
                    const nextProfile = await tgApp.api.getNextProfile(telegramId);
                    if (nextProfile && nextProfile.profile) {
                        const profile = nextProfile.profile;
                        // Обновляем UI
                        if (profileName) profileName.textContent = profile.name || 'Не указано';
                        if (profileAge) profileAge.textContent = profile.age ? `${profile.age} лет` : 'Не указано';
                        if (profileCar) profileCar.textContent = profile.car || 'Не указано';
                        if (profileRegion) profileRegion.textContent = profile.region || 'Не указано';
                        if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
                        if (profilePhoto) {
                            tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
                        }
                    } else {
                        tgApp.api.showNotification('Больше нет доступных профилей');
                    }
                } catch (error) {
                    console.error('Ошибка при отправке дизлайка:', error);
                    tgApp.api.showNotification(error.message, true);
                }
            });
        }

    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        if (tgApp && tgApp.api) {
            tgApp.api.showNotification(error.message, true);
        } else {
            alert(error.message);
        }
    }
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Ждем инициализации tgApp
        console.log('Начинаем инициализацию приложения...');
        
        // Инициализация приложения и получение device_id
        const userData = await tgApp.api.init();
        console.log('Пользователь инициализирован:', userData);

        // Получение следующего профиля
        const nextProfile = await tgApp.api.getNextProfile();
        console.log('Получен следующий профиль:', nextProfile);

        if (nextProfile) {
            displayProfile(nextProfile);
        } else {
            displayNoMoreProfiles();
        }

        // Обработчики для кнопок лайк/дизлайк
        document.getElementById('likeButton').addEventListener('click', async () => {
            const currentProfile = document.querySelector('.profile-card');
            const profileId = currentProfile.dataset.profileId;
            
            try {
                const result = await tgApp.api.likeProfile(profileId);
                if (result.match) {
                    showMatchNotification();
                }
                loadNextProfile();
            } catch (error) {
                console.error('Ошибка при отправке лайка:', error);
                showError('Не удалось поставить лайк');
            }
        });

        document.getElementById('dislikeButton').addEventListener('click', async () => {
            const currentProfile = document.querySelector('.profile-card');
            const profileId = currentProfile.dataset.profileId;
            
            try {
                await tgApp.api.dislikeProfile(profileId);
                loadNextProfile();
            } catch (error) {
                console.error('Ошибка при отправке дизлайка:', error);
                showError('Не удалось поставить дизлайк');
            }
        });

    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        showError('Не удалось инициализировать приложение');
    }
});

// Вспомогательные функции
function displayProfile(profile) {
    const profileCard = document.querySelector('.profile-card');
    profileCard.dataset.profileId = profile.id;
    
    document.getElementById('profileName').textContent = profile.name || 'Без имени';
    document.getElementById('profileAge').textContent = profile.age ? `${profile.age} лет` : '';
    document.getElementById('profileCar').textContent = profile.car || 'Автомобиль не указан';
    document.getElementById('profileRegion').textContent = profile.region || 'Регион не указан';
    document.getElementById('profileAbout').textContent = profile.about || 'Нет описания';
    
    const profilePhoto = document.getElementById('profilePhoto');
    if (profile.photo_url) {
        profilePhoto.src = profile.photo_url;
        profilePhoto.alt = `Фото ${profile.name}`;
    } else {
        profilePhoto.src = '/image/default-profile.jpg';
        profilePhoto.alt = 'Фото профиля отсутствует';
    }
}

function displayNoMoreProfiles() {
    const container = document.querySelector('.profile-container');
    container.innerHTML = `
        <div class="no-profiles">
            <h2>Больше нет профилей</h2>
            <p>Возвращайтесь позже, чтобы увидеть новые анкеты</p>
        </div>
    `;
}

async function loadNextProfile() {
    try {
        const nextProfile = await tgApp.api.getNextProfile();
        if (nextProfile) {
            displayProfile(nextProfile);
        } else {
            displayNoMoreProfiles();
        }
    } catch (error) {
        console.error('Ошибка при загрузке следующего профиля:', error);
        showError('Не удалось загрузить следующий профиль');
    }
}

function showMatchNotification() {
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerHTML = `
        <h3>Это взаимно!</h3>
        <p>У вас появилось новое совпадение</p>
        <button onclick="this.parentElement.remove()">OK</button>
    `;
    document.body.appendChild(notification);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentElement.remove()">OK</button>
    `;
    document.body.appendChild(errorDiv);
} 