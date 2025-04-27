document.addEventListener('DOMContentLoaded', async () => {
    const editButton = document.getElementById('editProfile');
    
    // Загрузка данных профиля
    async function loadProfile() {
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.tg.initDataUnsafe.user.id.toString();
            
            // Загружаем данные профиля
            const profile = await tgApp.api.getProfile(telegramId);
            console.log('Profile loaded:', profile);
            
            if (!profile) {
                throw new Error('Профиль не найден');
            }
            
            // Заполняем данные профиля
            const profilePhoto = document.getElementById('profilePhoto');
            const profileName = document.getElementById('profileName');
            const profileAbout = document.getElementById('profileAbout');
            const profileCar = document.getElementById('profileCar');
            
            if (profilePhoto) profilePhoto.src = profile.photo_url || 'image/placeholder_image.jpg';
            if (profileName) profileName.textContent = `${profile.name}, ${profile.age}`;
            if (profileAbout) profileAbout.textContent = profile.about || 'Нет описания';
            if (profileCar) profileCar.textContent = profile.car || 'Не указано';
            
        } catch (error) {
            console.error('Error loading profile:', error);
            tgApp.tg.showAlert('Ошибка при загрузке профиля');
            
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