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

const profileImage = document.getElementById('profile-image');
const profileName = document.getElementById('profile-name');
const profileAge = document.getElementById('profile-age');
const profileCity = document.getElementById('profile-city');

const likeButton = document.getElementById('like-button');
const dislikeButton = document.getElementById('dislike-button');

let currentProfile = null;

// Загрузить следующий профиль
async function loadNextProfile() {
  try {
    const response = await fetch(`${API_URL}/api/users/${deviceId}/next`);
    if (!response.ok) {
      throw new Error('Ошибка загрузки профиля');
    }

    const profile = await response.json();
    currentProfile = profile;

    if (profile) {
      profileImage.src = profile.photo_url || './image/hero-image.png';
      profileName.textContent = profile.name || 'Без имени';
      profileAge.textContent = profile.age ? `${profile.age} лет` : 'Возраст не указан';
      profileCity.textContent = profile.city || 'Город не указан';
    } else {
      profileImage.src = '';
      profileName.textContent = 'Профили закончились';
      profileAge.textContent = '';
      profileCity.textContent = '';
    }
  } catch (error) {
    console.error('Ошибка при загрузке профиля:', error);
  }
}

// Обработчик лайка
likeButton.addEventListener('click', async () => {
  if (!currentProfile) return;
  try {
    const targetId = currentProfile.id; // Предполагается, что в профиле есть поле id
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
    console.error('Ошибка при лайке:', error);
  }
});

// Обработчик дизлайка
dislikeButton.addEventListener('click', async () => {
  if (!currentProfile) return;
  try {
    const targetId = currentProfile.id; // Предполагается, что в профиле есть поле id
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
    console.error('Ошибка при дизлайке:', error);
  }
});

// Первая загрузка страницы
loadNextProfile();