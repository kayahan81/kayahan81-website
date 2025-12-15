// Основная функция при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Сайт портфолио загружен');
    
    // Обновляем дату и погоду
    updateCurrentDate();
    getLocalWeather();
    
    // Проверяем авторизацию
    const user = await checkAuth();
    
    // Если пользователь авторизован, показываем его имя
    if (user) {
        updateAuthUI(user);
    } else if (window.location.pathname.includes('index.html')) {
        // На главной странице инициализируем форму входа
        initAuth();
    }
    
    // Настройка остальных компонентов (только на главной)
    if (window.location.pathname.includes('index.html')) {
        setupCardScrolling();
        setupCardClicks();
    }
});

// Функции для главной страницы
function setupCardScrolling() {
    // Здесь можно добавить прокрутку карточек
}

function setupCardClicks() {
    document.querySelectorAll('.card[data-page]').forEach(card => {
        card.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            // Проверяем авторизацию для защищенных страниц
            const protectedPages = ['tasks.html', 'storage.html', 'scripts.html', 'shadowrun.html'];
            const user = JSON.parse(localStorage.getItem('portfolio_user_data') || 'null');
            
            if (protectedPages.includes(page)) {
                if (!user) {
                    showNotification('Для доступа необходимо войти в систему', 'error');
                    setTimeout(() => {
                        document.getElementById('login').focus();
                    }, 1000);
                    return;
                }
            }
            
            window.location.href = page;
        });
    });
}