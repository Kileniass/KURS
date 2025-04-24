document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Загрузка формы редактирования профиля...');

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

        // Получаем текущий профиль
        const profile = await tgApp.api.getProfile();
        console.log('Текущий профиль:', profile);

        // Заполняем форму данными профиля
        if (profile) {
            nameInput.value = profile.name || '';
            ageInput.value = profile.age || '';
            carInput.value = profile.car || '';
            regionInput.value = profile.region || '';
            aboutInput.value = profile.about || '';

            if (profile.photo_url) {
                profilePhoto.src = profile.photo_url;
                profilePhoto.alt = `Фото ${profile.name}`;
            } else {
                profilePhoto.src = '/image/default-profile.jpg';
                profilePhoto.alt = 'Фото профиля отсутствует';
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
        console.error('Ошибка при загрузке формы:', error);
        showError('Не удалось загрузить форму редактирования');
    }
});

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentElement.remove()">OK</button>
    `;
    document.body.appendChild(successDiv);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentElement.remove()">OK</button>
    `;
    document.body.appendChild(errorDiv);
} 