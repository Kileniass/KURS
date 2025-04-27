const API_URL = 'https://tg-bd.onrender.com'; // Базовый URL API

// Получаем device_id из localStorage
function getDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

const deviceId = getDeviceId(); // Используем device_id вместо telegram_id

const matchesContainer = document.getElementById('matches-container');

async function loadMatches() {
  try {
    // Загружаем совпадения через новый API
    const response = await fetch(`${API_URL}/api/users/${deviceId}/matches`);
    if (!response.ok) {
      throw new Error('Ошибка загрузки совпадений');
    }

    const matches = await response.json();

    matchesContainer.innerHTML = ''; // Очищаем контейнер перед загрузкой новых данных

    if (matches.length === 0) {
      matchesContainer.innerHTML = '<p>У вас пока нет совпадений</p>';
      return;
    }

    // Создаём карточки для каждого совпадения
    matches.forEach(match => {
      const matchCard = document.createElement('div');
      matchCard.className = 'match-card'; // Стилизация карточки через CSS

      matchCard.innerHTML = `
        <img src="${match.photo_url || './image/hero-image.png'}" alt="Фото" class="match-photo">
        <div class="match-info">
          <h3>${match.name || 'Без имени'}, ${match.age ? `${match.age} лет` : 'Возраст не указан'}</h3>
          <p>${match.city || 'Город не указан'}</p>
        </div>
      `;

      matchesContainer.appendChild(matchCard);
    });

  } catch (error) {
    console.error('Ошибка загрузки совпадений:', error);
    matchesContainer.innerHTML = '<p>Произошла ошибка при загрузке совпадений</p>';
  }
}

// Загрузка совпадений при открытии страницы
loadMatches();