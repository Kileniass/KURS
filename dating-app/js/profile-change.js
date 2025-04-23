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
            // Проверяем инициализацию Telegram WebApp
            if (!window.Telegram || !window.Telegram.WebApp) {
                throw new Error('Telegram WebApp не инициализирован');
            }

            const tg = window.Telegram.WebApp;
            
            // Проверяем наличие данных пользователя
            if (!tg.initDataUnsafe || !tg.initDataUnsafe.user || !tg.initDataUnsafe.user.id) {
                throw new Error('Данные пользователя недоступны');
            }
            
            const telegramId = tg.initDataUnsafe.user.id.toString();
            console.log('Получен telegram_id:', telegramId);
            
            // Инициализируем пользователя на сервере
            currentUser = await tgApp.api.initUser(telegramId);
            console.log('Пользователь инициализирован:', currentUser);
            
            // Если у пользователя уже есть профиль, заполняем форму
            if (currentUser.name) {
                document.getElementById('name').value = currentUser.name || '';
                document.getElementById('age').value = currentUser.age || '';
                document.getElementById('bio').value = currentUser.about || '';
                document.getElementById('car-info').value = currentUser.car || '';
                document.getElementById('region').value = currentUser.region || '';
                
                if (currentUser.photo_url) {
                    photoPreview.src = currentUser.photo_url;
                }
            }
        } catch (error) {
            console.error('Ошибка при инициализации пользователя:', error);
            tgApp.tg.showAlert('Ошибка при инициализации пользователя: ' + error.message);
        }
    }

    // Предпросмотр фото
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверяем размер файла (не более 5MB)
            if (file.size > 5 * 1024 * 1024) {
                tgApp.tg.showAlert('Размер файла не должен превышать 5MB');
                return;
            }
            
            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                tgApp.tg.showAlert('Пожалуйста, выберите изображение');
                return;
            }
            
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
        
        try {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Показываем индикатор загрузки
            tgApp.tg.MainButton.showProgress();
            saveButton.disabled = true;
            
            // Получаем telegram_id из Telegram WebApp
            const telegramId = tgApp.tg.initDataUnsafe.user.id.toString();
            
            // Проверяем обязательные поля
            const name = document.getElementById('name').value.trim();
            const age = parseInt(document.getElementById('age').value);
            const car = document.getElementById('car-info').value.trim();
            const region = document.getElementById('region').value.trim();
            const about = document.getElementById('bio').value.trim();

            if (!name || !age || !car || !region) {
                throw new Error('Пожалуйста, заполните все обязательные поля');
            }

            if (age < 18 || age > 100) {
                throw new Error('Возраст должен быть от 18 до 100 лет');
            }
            
            // Создаем объект с данными профиля
            const profileData = {
                telegram_id: telegramId,
                name,
                age,
                car,
                region,
                about
            };
            
            // Если есть новое фото, добавляем его в данные
            if (photoFile) {
                const formData = new FormData();
                formData.append('photo', photoFile);
                
                // Здесь должна быть загрузка фото на сервер
                // После успешной загрузки получаем URL и добавляем его в profileData
                // profileData.photo_url = полученный_url;
            }
            
            // Отправляем данные на сервер
            const updatedUser = await tgApp.api.createProfile(profileData);
            console.log('Профиль обновлен:', updatedUser);
            
            // Показываем уведомление об успехе
            tgApp.tg.showPopup({
                title: 'Успех!',
                message: 'Профиль успешно сохранен',
                buttons: [{
                    type: 'ok'
                }]
            });
            
            // Перенаправляем на страницу профиля
            window.location.href = 'profile.html';
            
        } catch (error) {
            console.error('Ошибка при сохранении профиля:', error);
            tgApp.tg.showAlert(error.message || 'Произошла ошибка при сохранении профиля');
        } finally {
            // Скрываем индикатор загрузки
            tgApp.tg.MainButton.hideProgress();
            saveButton.disabled = false;
        }
    });

    // Инициализируем пользователя при загрузке страницы
    await initUser();
}); 