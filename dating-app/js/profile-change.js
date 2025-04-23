document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profileForm');
    const saveButton = document.getElementById('saveButton');
    const photoInput = document.getElementById('car-image');
    const photoPreview = document.getElementById('carImagePreview');
    let photoFile = null;
    let currentUser = null;

    // Инициализация пользователя
    async function initUser() {
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.tg.initDataUnsafe.user.id.toString();
            
            // Инициализируем пользователя на сервере
            currentUser = await tgApp.api.initUser(telegramId);
            console.log('User initialized:', currentUser);
            
            // Если у пользователя уже есть профиль, заполняем форму
            if (currentUser.name) {
                document.getElementById('name').value = currentUser.name;
                document.getElementById('age').value = currentUser.age;
                document.getElementById('bio').value = currentUser.about || '';
                document.getElementById('car-info').value = currentUser.car || '';
                document.getElementById('region').value = currentUser.region || '';
                
                if (currentUser.photo_url) {
                    photoPreview.src = currentUser.photo_url;
                }
            }
        } catch (error) {
            console.error('Error initializing user:', error);
            tgApp.tg.showAlert('Ошибка при инициализации пользователя');
        }
    }

    // Предпросмотр фото
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            photoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Обработка сохранения профиля
    saveButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        try {
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.tg.initDataUnsafe.user.id.toString();
            
            // Создаем объект с данными профиля
            const profileData = {
                telegram_id: telegramId,
                name: document.getElementById('name').value,
                age: parseInt(document.getElementById('age').value),
                car: document.getElementById('car-info').value,
                region: document.getElementById('region').value,
                about: document.getElementById('bio').value
            };
            
            // Если есть новое фото, загружаем его
            if (photoFile) {
                // В реальном приложении здесь должна быть загрузка фото на сервер
                // и получение URL. Для демонстрации используем временный URL
                profileData.photo_url = URL.createObjectURL(photoFile);
            }
            
            // Отправляем данные на сервер
            const updatedUser = await tgApp.api.createProfile(profileData);
            console.log('Profile updated:', updatedUser);
            
            // Показываем уведомление об успехе
            tgApp.tg.showAlert('Профиль успешно сохранен!');
            
            // Перенаправляем на страницу профиля
            window.location.href = 'profile.html';
            
        } catch (error) {
            console.error('Error saving profile:', error);
            tgApp.tg.showAlert('Произошла ошибка при сохранении профиля');
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 