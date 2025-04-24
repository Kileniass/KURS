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
        // Ждем инициализации tgApp
        tgApp = await waitForTgApp();
        console.log('tgApp инициализирован');

        // Инициализируем пользователя
        const user = await tgApp.api.init();
        console.log('Пользователь инициализирован:', user);

        // Получаем ссылки на элементы формы
        const nameInput = document.getElementById('nameInput');
        const ageInput = document.getElementById('ageInput');
        const carInput = document.getElementById('carInput');
        const regionInput = document.getElementById('regionInput');
        const aboutInput = document.getElementById('aboutInput');
        const profilePhoto = document.getElementById('photoPreview');
        const photoInput = document.getElementById('photoInput');
        const form = document.getElementById('profileForm');

        // Проверяем наличие всех необходимых элементов
        if (!nameInput || !ageInput || !carInput || !regionInput || !aboutInput || !profilePhoto || !photoInput || !form) {
            throw new Error('Не найдены все необходимые элементы формы');
        }

        try {
            // Получаем текущий профиль
            const profile = await tgApp.api.getProfile();
            console.log('Текущий профиль:', profile);

            // Если профиль не найден, создаем новый
            if (!profile) {
                console.log('Профиль не найден, создаем новый...');
                const defaultProfile = {
                    name: '',
                    age: null,
                    car: '',
                    region: '',
                    about: ''
                };
                await tgApp.api.createProfile(defaultProfile);
            }

            // Заполняем форму данными профиля
            if (profile) {
                nameInput.value = profile.name || '';
                ageInput.value = profile.age || '';
                carInput.value = profile.car || '';
                regionInput.value = profile.region || '';
                aboutInput.value = profile.about || '';

                if (profilePhoto) {
                    tgApp.api.setImageWithFallback(profilePhoto, profile.photo_url);
                }
            }

            // Обработчик загрузки фото
            photoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const result = await tgApp.api.uploadPhoto(formData);
                        
                        if (result && result.photo_url) {
                            tgApp.api.setImageWithFallback(profilePhoto, result.photo_url);
                            showSuccess('Фото успешно загружено');
                        }
                    } catch (error) {
                        console.error('Ошибка при загрузке фото:', error);
                        showError('Не удалось загрузить фото');
                    }
                }
            });

            // Обработчик отправки формы
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const formData = {
                        name: nameInput.value.trim(),
                        age: parseInt(ageInput.value) || null,
                        car: carInput.value.trim(),
                        region: regionInput.value.trim(),
                        about: aboutInput.value.trim()
                    };

                    await tgApp.api.updateProfile(formData);
                    showSuccess('Профиль успешно обновлен');
                    
                    // Возвращаемся на страницу профиля
                    setTimeout(() => {
                        window.location.href = '/profile.html';
                    }, 1500);
                } catch (error) {
                    console.error('Ошибка при обновлении профиля:', error);
                    showError('Не удалось обновить профиль');
                }
            });

        } catch (error) {
            console.error('Ошибка при загрузке профиля:', error);
            showError('Не удалось загрузить профиль');
        }

    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        showError('Не удалось инициализировать приложение');
    }
});

function showSuccess(message) {
    if (window.tgApp) {
        window.tgApp.api.showNotification(message, false);
    } else {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.innerHTML = `
            <p>${message}</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;
        document.body.appendChild(successDiv);
    }
}

function showError(message) {
    console.error(message);
    if (window.tgApp) {
        window.tgApp.api.showNotification(message, true);
    } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <p>${message}</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;
        document.body.appendChild(errorDiv);
    }
} 