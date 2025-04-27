document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://tg-bd.onrender.com'; // Базовый URL API
    let deviceId = localStorage.getItem('device_id'); // Получаем device_id из localStorage

    if (!deviceId) {
        deviceId = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000;
        localStorage.setItem('device_id', deviceId);
    }

    try {
        console.log('Инициализация приложения');

        // Получаем контейнер для мэтчей
        const matchesContainer = document.getElementById('matchesContainer');
        if (!matchesContainer) {
            throw new Error('Контейнер для мэтчей не найден');
        }

        // Получаем мэтчи через /api/users/{device_id}/matches
        const matchesResponse = await fetch(`${API_URL}/api/users/${deviceId}/matches`);
        if (!matchesResponse.ok) {
            throw new Error('Ошибка загрузки мэтчей');
        }

        const matches = await matchesResponse.json();
        console.log('Мэтчи получены:', matches);

        // Если мэтчей нет, показываем сообщение
        if (!matches || matches.length === 0) {
            matchesContainer.innerHTML = '<p class="no-matches">У вас пока нет мэтчей</p>';
            return;
        }

        // Создаем карточки для каждого мэтча
        matches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'match-card';

            card.innerHTML = `
                <div class="match-photo">
                    <img src="${match.photo_url || 'default-avatar.png'}" alt="Фото пользователя">
                </div>
                <div class="match-info">
                    <h3>${match.name || 'Без имени'}</h3>
                    <p>${match.age ? `${match.age} лет` : 'Возраст не указан'}</p>
                    <p>${match.car || 'Машина не указана'}</p>
                    <p>${match.region || 'Регион не указан'}</p>
                    <p class="about">${match.about || 'Нет описания'}</p>
                </div>
            `;

            matchesContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        alert(error.message); // Показываем ошибку пользователю
    }
});