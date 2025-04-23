// Базовый путь к изображениям
const IMAGES_BASE_PATH = 'https://tg-bd.onrender.com/static';
const DEFAULT_PROFILE_IMAGE = `${IMAGES_BASE_PATH}/hero-image.jpg`;

// Функция для установки изображения с запасным вариантом
function setImageWithFallback(imgElement, photoUrl) {
    if (!photoUrl) {
        imgElement.src = DEFAULT_PROFILE_IMAGE;
        return;
    }

    // Проверяем, является ли URL абсолютным
    if (photoUrl.startsWith('http')) {
        imgElement.src = photoUrl;
    } else {
        // Если URL относительный, добавляем базовый путь
        imgElement.src = `${IMAGES_BASE_PATH}/${photoUrl}`;
    }

    // Обработка ошибок загрузки изображения
    imgElement.onerror = () => {
        imgElement.src = DEFAULT_PROFILE_IMAGE;
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    const editButton = document.getElementById('editProfile');
    
    // Загрузка данных профиля
    async function loadProfile() {
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tg.tg.initDataUnsafe.user.id.toString();
            
            // Загружаем данные профиля
            const profile = await tg.api.getProfile(telegramId);
            console.log('Profile loaded:', profile);
            
            if (!profile) {
                throw new Error('Профиль не найден');
            }
            
            // Заполняем данные профиля
            const profilePhoto = document.getElementById('profilePhoto');
            const profileName = document.getElementById('profileName');
            const profileAbout = document.getElementById('profileAbout');
            const profileCar = document.getElementById('profileCar');
            
            if (profilePhoto) setImageWithFallback(profilePhoto, profile.photo_url);
            if (profileName) profileName.textContent = `${profile.name}, ${profile.age}`;
            if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
            if (profileCar) profileCar.textContent = profile.car || 'Не указано';
            
        } catch (error) {
            console.error('Error loading profile:', error);
            tg.tg.showAlert('Ошибка при загрузке профиля');
            
            // Показываем сообщение об ошибке
            const profileName = document.getElementById('profileName');
            const profileAbout = document.getElementById('profileAbout');
            const profileCar = document.getElementById('profileCar');
            
            if (profileName) profileName.textContent = 'Ошибка загрузки';
            if (profileAbout) profileAbout.textContent = 'Не удалось загрузить данные профиля';
            if (profileCar) profileCar.textContent = 'Ошибка';
            
            // Перенаправляем на страницу создания профиля, если профиль не найден
            if (error.message.includes('404')) {
                window.location.href = 'profile-change.html';
            }
        }
    }
    
    // Обработчик кнопки редактирования
    if (editButton) {
        editButton.addEventListener('click', () => {
            window.location.href = 'profile-change.html';
        });
    }
    
    // Загружаем профиль при загрузке страницы
    await loadProfile();
}); 