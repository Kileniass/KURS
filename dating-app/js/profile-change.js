document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://tg-bd.onrender.com'; // Базовый URL API
    let deviceId = localStorage.getItem('device_id'); // Получаем device_id из localStorage

    if (!deviceId) {
        deviceId = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000;
        localStorage.setItem('device_id', deviceId);
    }

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
        await waitForTgApp();
        console.log('tgApp инициализирован');

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
        const backButton = document.getElementById('backButton');

        // Проверяем наличие всех необходимых элементов
        if (!nameInput || !ageInput || !carInput || !regionInput || !aboutInput || !profilePhoto || !photoInput || !form) {
            throw new Error('Не найдены все необходимые элементы формы');
        }

        // Создаем список элементов страницы, при взаимодействии с которыми нужно инициализировать пользователя
        const interactiveElements = [
            nameInput,
            ageInput,
            carInput,
            regionInput,
            aboutInput,
            photoInput,
            saveButton,
            backButton,
            profilePhoto
        ].filter(Boolean);

        // Флаг, указывающий, был ли уже инициализирован пользователь
        let isUserInitialized = false;

        // Функция для инициализации пользователя
        async function initializeUser() {
            if (isUserInitialized) return;
            isUserInitialized = true;

            try {
                // Инициализируем пользователя через /api/init
                const initResponse = await fetch(`${API_URL}/api/init`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_id: deviceId }),
                });

                if (!initResponse.ok) {
                    throw new Error('Ошибка инициализации пользователя');
                }

                console.log('Пользователь инициализирован');

                try {
                    // Получаем текущий профиль через /api/users/{device_id}
                    const profileResponse = await fetch(`${API_URL}/api/users/${deviceId}`);
                    if (!profileResponse.ok && profileResponse.status !== 404) {
                        throw new Error('Ошибка загрузки профиля');
                    }

                    const profile = await profileResponse.json();

                    // Если профиль не найден, создаем новый
                    if (!profile) {
                        console.log('Профиль не найден, создаем новый...');
                        const defaultProfile = {
                            name: '',
                            age: null,
                            car: '',
                            region: '',
                            about: '',
                        };

                        await fetch(`${API_URL}/api/users/${deviceId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(defaultProfile),
                        });
                    }

                    // Заполняем форму данными профиля
                    if (profile) {
                        nameInput.value = profile.name || '';
                        ageInput.value = profile.age || '';
                        carInput.value = profile.car || '';
                        regionInput.value = profile.region || '';
                        aboutInput.value = profile.about || '';

                        if (profilePhoto) {
                            profilePhoto.src = profile.photo_url || './image/hero-image.png';
                        }
                    }

                    // Удаляем обработчики событий для инициализации, так как она уже выполнена
                    interactiveElements.forEach(element => {
                        element.removeEventListener('focus', initializeUser);
                        element.removeEventListener('click', initializeUser);
                    });
                } catch (error) {
                    console.error('Ошибка при загрузке профиля:', error);
                    showError('Не удалось загрузить профиль');
                }
            } catch (error) {
                console.error('Ошибка при инициализации пользователя:', error);
                showError('Не удалось инициализировать пользователя');
            }
        }

        // Добавляем обработчики событий для всех интерактивных элементов
        interactiveElements.forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.addEventListener('focus', initializeUser);
            } else {
                element.addEventListener('click', initializeUser);
            }
        });

        // Обработчик загрузки фото
        photoInput.addEventListener('change', async (e) => {
            await initializeUser(); // Убедимся, что пользователь инициализирован

            const file = e.target.files[0];
            if (file) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const uploadResponse = await fetch(`${API_URL}/api/users/${deviceId}/photo`, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('Ошибка загрузки фото');
                    }

                    const result = await uploadResponse.json();
                    if (result && result.photo_url) {
                        profilePhoto.src = result.photo_url;
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

            await initializeUser(); // Убедимся, что пользователь инициализирован

            try {
                const formData = {
                    name: nameInput.value.trim(),
                    age: parseInt(ageInput.value) || null,
                    car: carInput.value.trim(),
                    region: regionInput.value.trim(),
                    about: aboutInput.value.trim(),
                };

                const updateResponse = await fetch(`${API_URL}/api/users/${deviceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (!updateResponse.ok) {
                    throw new Error('Ошибка обновления профиля');
                }

                showSuccess('Профиль успешно обновлен');

                // Возвращаемся на страницу профиля
                setTimeout(() => {
                    window.location.href = './profile.html';
                }, 1500);
            } catch (error) {
                console.error('Ошибка при обновлении профиля:', error);
                showError('Не удалось обновить профиль');
            }
        });

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