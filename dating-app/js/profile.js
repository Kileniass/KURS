import { getUserProfile } from './telegram-webapp.js';

// Получаем элементы DOM
const myPhoto = document.getElementById('my-photo');
const myName = document.getElementById('my-name');
const myAge = document.getElementById('my-age');
const myCity = document.getElementById('my-city');

// Функция загрузки профиля
async function loadMyProfile() {
  try {
    const profile = await getUserProfile();

    // Проверяем, что профиль существует и содержит данные
    if (profile) {
      const { photo_url, name, age, city } = profile;

      // Заполняем данные профиля
      myPhoto.src = photo_url || './image/hero-image.png'; // Если фото нет, используем дефолтное
      myName.textContent = name || 'Имя не указано';
      myAge.textContent = age ? `${age} лет` : 'Возраст не указан';
      myCity.textContent = city || 'Город не указан';
    } else {
      // Если профиль пустой или не найден
      myPhoto.src = './image/hero-image.png';
      myName.textContent = 'Анкета не найдена';
      myAge.textContent = '';
      myCity.textContent = '';
    }
  } catch (error) {
    console.error('Ошибка загрузки своей анкеты:', error);
    // В случае ошибки показываем сообщение пользователю
    myPhoto.src = './image/hero-image.png';
    myName.textContent = 'Ошибка загрузки анкеты';
    myAge.textContent = '';
    myCity.textContent = '';
  }
}

// Загрузка анкеты при открытии страницы
loadMyProfile();