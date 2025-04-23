document.addEventListener('DOMContentLoaded', async () => {
    let tgApp = null;

    // Функция ожидания инициализации tgApp
    async function waitForTgApp(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (window.tgApp) {
                    resolve(window.tgApp);
                } else if (Date.now() - startTime >= timeout) {
                    reject(new Error('Таймаут ожидания инициализации Telegram WebApp'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    try {
        // Получаем ссылки на элементы формы
        const nameInput = document.getElementById('nameInput');
        const ageInput = document.getElementById('ageInput');
        const carInput = document.getElementById('carInput');
        const regionInput = document.getElementById('regionInput');
        const aboutInput = document.getElementById('aboutInput');
        const profilePhoto = document.getElementById('photoPreview');
        const photoInput = document.getElementById('photoInput');
        const form = document.getElementById('profileForm');
        const saveButton = document.getElementById('saveButton');

        // Проверяем наличие всех необходимых элементов
        if (!nameInput || !ageInput || !carInput || !regionInput || !aboutInput || !profilePhoto || !photoInput || !form) {
            throw new Error('Не найдены все необходимые элементы формы');
        }

        // Ждем инициализации tgApp
        tgApp = await waitForTgApp();
        console.log('tgApp инициализирован');

        if (!tgApp.tg || !tgApp.tg.initDataUnsafe || !tgApp.tg.initDataUnsafe.user) {
            throw new Error('Telegram WebApp не инициализирован корректно');
        }

        // Получаем telegram_id
        const telegramId = tgApp.api.getTelegramId();
        console.log('Получен telegram_id:', telegramId);

        try {
            // Получаем профиль пользователя
            const profile = await tgApp.api.getProfile(telegramId);
            console.log('Профиль получен:', profile);

            if (profile) {
                // Заполняем форму данными профиля
                nameInput.value = profile.name || '';
                ageInput.value = profile.age || '';
                carInput.value = profile.car || '';
                regionInput.value = profile.region || '';
                aboutInput.value = profile.about || '';

                // Устанавливаем фото профиля
                if (profile.photo_url) {
                    tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
                }
            }
        } catch (error) {
            console.error('Ошибка при получении профиля:', error);
            tgApp.api.showNotification('Ошибка при загрузке профиля: ' + error.message, true);
        }

        // Обработчик загрузки фото
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const result = await tgApp.api.uploadPhoto(telegramId, file);
                    if (result && result.photo_url) {
                        tgApp.api.setImageWithFallback(profilePhoto, result.photo_url);
                        tgApp.api.showNotification('Фото успешно загружено');
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке фото:', error);
                    tgApp.api.showNotification(error.message, true);
                }
            }
        });

        // Обработчик отправки формы
        const handleSubmit = async () => {
            const formData = {
                name: nameInput.value.trim(),
                age: parseInt(ageInput.value) || null,
                car: carInput.value.trim(),
                region: regionInput.value.trim(),
                about: aboutInput.value.trim()
            };

            try {
                await tgApp.api.updateProfile(telegramId, formData);
                tgApp.api.showNotification('Профиль успешно обновлен');
                // Возвращаемся на страницу профиля
                window.location.href = 'profile.html';
            } catch (error) {
                console.error('Ошибка при обновлении профиля:', error);
                tgApp.api.showNotification(error.message, true);
            }
        };

        // Привязываем обработчик к форме и кнопке сохранения
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmit();
        });

        if (saveButton) {
            saveButton.addEventListener('click', async (e) => {
                e.preventDefault();
                await handleSubmit();
            });
        }

    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        if (tgApp && tgApp.api) {
            tgApp.api.showNotification(error.message, true);
        } else {
            alert(error.message);
        }
    }
}); 