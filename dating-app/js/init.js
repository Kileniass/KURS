// Функция инициализации пользователя
async function initializeUser() {
    const tg = window.Telegram.WebApp;
    
    try {
        // Получаем telegram_id из Telegram WebApp
        const telegramId = tg.initDataUnsafe.user.id.toString();
        
        // Проверяем, есть ли пользователь в localStorage
        const storedUserId = localStorage.getItem('currentUserId');
        
        if (!storedUserId) {
            // Если пользователя нет в localStorage, инициализируем его
            const user = await tgApp.api.initUser(telegramId);
            localStorage.setItem('currentUserId', user.id);
            
            // Проверяем, заполнен ли профиль
            if (!user.name) {
                window.location.href = 'profile-change.html';
                return;
            }
        }
        
        // Проверяем текущую страницу
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (currentPage === 'index.html') {
            // Если мы на главной странице, проверяем профиль
            const user = await tgApp.api.getProfile(telegramId);
            if (!user || !user.name) {
                window.location.href = 'profile-change.html';
                return;
            }
        }
        
    } catch (error) {
        console.error('Error during initialization:', error);
        tg.showAlert('Ошибка при инициализации приложения');
        
        // В случае ошибки перенаправляем на создание профиля
        if (!window.location.pathname.includes('profile-change.html')) {
            window.location.href = 'profile-change.html';
        }
    }
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeUser); 