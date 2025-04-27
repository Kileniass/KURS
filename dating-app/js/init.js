const API_URL = 'https://tg-bd.onrender.com'; // Базовый URL API

// Функция генерации device_id
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000;
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

const deviceId = getDeviceId(); // Используем device_id вместо telegram_id

// Функция инициализации пользователя
async function initializeUser() {
    try {
        console.log('Инициализация пользователя');

        // Инициализируем пользователя через /api/init
        const initResponse = await fetch(`${API_URL}/api/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: deviceId }),
        });

        if (!initResponse.ok) {
            throw new Error('Ошибка инициализации пользователя');
        }

        console.log('Пользователь инициализирован');

        // Загружаем следующий профиль
        await loadNextProfile();
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        showError(error.message);
    }
}

// Функция загрузки следующего профиля
async function loadNextProfile() {
    try {
        const nextProfileResponse = await fetch(`${API_URL}/api/users/${deviceId}/next`);
        if (!nextProfileResponse.ok) {
            throw new Error('Нет доступных профилей');
        }

        const nextProfile = await nextProfileResponse.json();

        if (!nextProfile) {
            displayNoMoreProfiles();
            return;
        }

        displayProfile(nextProfile);
    } catch (error) {
        console.error('Ошибка при загрузке следующего профиля:', error);
        showError('Не удалось загрузить следующий профиль');
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
        profilePhoto.src = profile.photo_url || 'default-avatar.jpg';
    }
}

// Функция отображения сообщения об отсутствии профилей
function displayNoMoreProfiles() {
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = '<div class="no-profiles">Больше нет доступных профилей</div>';
    }
    alert('Больше нет доступных профилей'); // Можно заменить на уведомление
}

// Обработчики кнопок
document.addEventListener('DOMContentLoaded', () => {
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');

    if (likeButton) {
        likeButton.addEventListener('click', async () => {
            try {
                const currentProfile = document.querySelector('.profile-card');
                if (!currentProfile || !currentProfile.dataset.profileId) {
                    throw new Error('Нет активного профиля');
                }

                const targetId = currentProfile.dataset.profileId;

                // Отправляем лайк через /api/users/{device_id}/like/{target_id}
                const likeResponse = await fetch(`${API_URL}/api/users/${deviceId}/like/${targetId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!likeResponse.ok) {
                    throw new Error('Ошибка отправки лайка');
                }

                const result = await likeResponse.json();

                if (result.match) {
                    alert('У вас новый мэтч!'); // Можно заменить на уведомление
                } else {
                    alert('Лайк отправлен!');
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

                const targetId = currentProfile.dataset.profileId;

                // Отправляем дизлайк через /api/users/{device_id}/dislike/{target_id}
                const dislikeResponse = await fetch(`${API_URL}/api/users/${deviceId}/dislike/${targetId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!dislikeResponse.ok) {
                    throw new Error('Ошибка отправки дизлайка');
                }

                alert('Дизлайк отправлен');
                await loadNextProfile();
            } catch (error) {
                console.error('Ошибка при отправке дизлайка:', error);
                showError(error.message);
            }
        });
    }

    // Запускаем инициализацию при загрузке страницы
    initializeUser();
});

// Функция отображения ошибки
function showError(message) {
    console.error(message);
    alert(message); // Можно заменить на уведомление
}