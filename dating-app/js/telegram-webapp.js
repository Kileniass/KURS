const API_URL = 'https://tg-bd.onrender.com';

// Генерация реального device_id (заменяем telegram_id на device_id)
function getDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

const deviceId = getDeviceId(); // Используем device_id вместо telegram_id

// Получение своего профиля
async function getUserProfile() {
  const response = await fetch(`${API_URL}/api/users/${deviceId}`);
  if (!response.ok) throw new Error('Ошибка загрузки профиля');
  return await response.json();
}

// Получение следующего профиля
async function getNextProfile() {
  const response = await fetch(`${API_URL}/api/users/${deviceId}/next`);
  if (!response.ok) throw new Error('Ошибка загрузки следующего профиля');
  return await response.json();
}

// Отправка лайка
async function likeUser(targetId) {
  const response = await fetch(`${API_URL}/api/users/${deviceId}/like/${targetId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Ошибка при лайке');
  return await response.json();
}

// Отправка дизлайка
async function dislikeUser(targetId) {
  const response = await fetch(`${API_URL}/api/users/${deviceId}/dislike/${targetId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Ошибка при дизлайке');
  return await response.json();
}

// Получение списка совпадений
async function getMatches() {
  const response = await fetch(`${API_URL}/api/users/${deviceId}/matches`);
  if (!response.ok) throw new Error('Ошибка загрузки совпадений');
  return await response.json();
}

// Экспортируем функции
export { getUserProfile, getNextProfile, likeUser, dislikeUser, getMatches };