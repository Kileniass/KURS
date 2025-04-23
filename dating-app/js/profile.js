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
            
            // Заполняем данные профиля
            document.getElementById('profilePhoto').src = profile.photo_url || 'image/placeholder_image.jpg';
            document.getElementById('profileName').textContent = `${profile.name}, ${profile.age}`;
            document.getElementById('profileAbout').textContent = profile.about || 'Нет описания';
            document.getElementById('profileCar').textContent = profile.car || 'Не указано';
            
        } catch (error) {
            console.error('Error loading profile:', error);
            tgApp.tg.showAlert('Ошибка при загрузке профиля');
            
            // Показываем сообщение об ошибке
            document.getElementById('profileName').textContent = 'Ошибка загрузки';
            document.getElementById('profileAbout').textContent = 'Не удалось загрузить данные профиля';
            document.getElementById('profileCar').textContent = 'Ошибка';
        }
    }
    
    // Обработчик кнопки редактирования
    editButton.addEventListener('click', () => {
        window.location.href = 'profile-change.html';
    });
    
    // Загружаем профиль при загрузке страницы
    await loadProfile();
}); 