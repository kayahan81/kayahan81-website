/**
 * Основной файл JavaScript для портфолио
 * Содержит базовую логику для главной страницы
 */

// Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт портфолио загружен');
    
    // 1. Установка текущей даты
    updateCurrentDate();
    
    // 2. Настройка прокрутки карточек
    setupCardScrolling();
    
    // 3. Обработчики кликов по карточкам
    setupCardClicks();
    
    // 4. Получение погоды (заглушка)
    // В реальном проекте здесь был бы API запрос
    getLocalWeather();
    
    // 5. Инициализация авторизации
    initAuth();
    
    // 6. Проверка авторизации для защищённых страниц
    checkAuthForProtectedPages();
});

/**
 * Обновление блока с текущей датой
 */
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;
    
    const now = new Date();
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
    };
    
    // Форматируем дату по-русски
    const formatter = new Intl.DateTimeFormat('ru-RU', options);
    dateElement.textContent = formatter.format(now);
}

/**
 * Настройка прокрутки карточек с помощью кнопок
 */
function setupCardScrolling() {
    const scrollContainer = document.querySelector('.cards-scroll');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    
    if (!scrollContainer || !scrollLeftBtn || !scrollRightBtn) return;
    
    // Прокрутка влево
    scrollLeftBtn.addEventListener('click', function() {
        scrollContainer.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });
    
    // Прокрутка вправо
    scrollRightBtn.addEventListener('click', function() {
        scrollContainer.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });
    
    // Скрываем кнопки, если нечего скроллить
    updateScrollButtons(scrollContainer, scrollLeftBtn, scrollRightBtn);
    
    scrollContainer.addEventListener('scroll', function() {
        updateScrollButtons(scrollContainer, scrollLeftBtn, scrollRightBtn);
    });
}

/**
 * Обновление видимости кнопок прокрутки
 */
function updateScrollButtons(container, leftBtn, rightBtn) {
    // Проверяем, можно ли прокрутить влево
    if (container.scrollLeft > 0) {
        leftBtn.style.display = 'flex';
    } else {
        leftBtn.style.display = 'none';
    }
    
    // Проверяем, можно ли прокрутить вправо
    if (container.scrollLeft < container.scrollWidth - container.clientWidth) {
        rightBtn.style.display = 'flex';
    } else {
        rightBtn.style.display = 'none';
    }
}

/**
 * Настройка переходов по карточкам
 */
function setupCardClicks() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const pageUrl = this.getAttribute('data-page');
            
            if (pageUrl) {
                // Проверяем авторизацию
                const isLoggedIn = localStorage.getItem('portfolio_logged_in');
                if (!isLoggedIn && pageUrl.includes('/page/')) {
                    alert('Для доступа необходимо войти в систему');
                    return;
                }
                
                // Анимация перехода
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    window.location.href = pageUrl;
                }, 200);
            } else {
                console.warn('Карточка не имеет ссылки на страницу');
            }
        });
    });
}

// ==================== АВТОРИЗАЦИЯ ====================

/**
 * Инициализация авторизации
 */
function initAuth() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const forgotBtn = document.getElementById('forgot-password-btn');
    
    // Вход
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const login = document.getElementById('login').value;
            const password = document.getElementById('password').value;
            
            if (!login || !password) {
                alert('Заполните логин и пароль');
                return;
            }
            
            // Временная проверка (в реальном проекте - запрос к серверу)
            if (login === 'admin' && password === 'admin') {
                localStorage.setItem('portfolio_logged_in', 'true');
                localStorage.setItem('portfolio_username', login);
                
                // Редирект на страницу задач
                window.location.href = 'tasks.html';
            } else {
                alert('Неверный логин или пароль! Используйте admin/admin');
            }
        });
    }
    
    // Регистрация (заглушка)
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            alert('Форма регистрации временно недоступна\nИспользуйте логин: admin, пароль: admin');
        });
    }
    
    // Восстановление пароля (заглушка)
    if (forgotBtn) {
        forgotBtn.addEventListener('click', function() {
            const login = document.getElementById('login').value;
            
            if (!login) {
                alert('Введите логин для восстановления пароля');
                return;
            }
            
            alert(`Запрос на восстановление пароля отправлен для: ${login}\nПроверьте почту.`);
        });
    }
}

/**
 * Проверка авторизации для защищённых страниц
 */
function checkAuthForProtectedPages() {
    // Если мы на странице в папке /html/page/ - проверяем авторизацию
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/html/page/') || currentPath.includes('/page/')) {
        const isLoggedIn = localStorage.getItem('portfolio_logged_in');
        const username = localStorage.getItem('portfolio_username');
        
        if (!isLoggedIn || !username) {
            // Редирект на главную
            window.location.href = '../../index.html';
            return;
        }
        
        // Обновляем информацию о пользователе
        updateUserInfo(username);
    }
}

/**
 * Обновление информации о пользователе
 */
function updateUserInfo(username) {
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.title = `Пользователь: ${username}`;
        userIcon.addEventListener('click', function() {
            if (confirm(`Выйти из аккаунта ${username}?`)) {
                logout();
            }
        });
    }
}

/**
 * Выход из системы
 */
function logout() {
    localStorage.removeItem('portfolio_logged_in');
    localStorage.removeItem('portfolio_username');
    window.location.href = '../../index.html';
}

/**
 * Заглушка для получения погоды
 * В реальном проекте - API запрос
 */
async function getLocalWeather() {
    const weatherElement = document.getElementById('weather');
    if (!weatherElement) return;

    if (!navigator.geolocation) {
        weatherElement.textContent = "Геолокация не поддерживается";
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            
            const data = await response.json();
        
            if (data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                const weatherCode = data.current_weather.weathercode;
                
                // Преобразуем код погоды в текст
                const weatherText = getWeatherDescription(weatherCode);
                
                weatherElement.textContent = `${temp}°C ${weatherText}`;
                console.log('Погода обновлена:', data.current_weather);
            } else {
                throw new Error('Нет данных о погоде');
            }
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
            // Если пользователь отказал, показываем погоду в Москве
            getMoscowWeather();
        }
    );
}

async function getMoscowWeather() {
    const weatherElement = document.getElementById('weather');
    if (!weatherElement) return;
    
    // Показываем загрузку
    weatherElement.textContent = "Загрузка...";
    
    try {
        // Координаты Москвы
        const latitude = 55.7558;
        const longitude = 37.6173;
        
        // Делаем запрос к бесплатному API
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe/Moscow`
        );
        
        const data = await response.json();
        
        if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const weatherCode = data.current_weather.weathercode;
            
            // Преобразуем код погоды в текст
            const weatherText = getWeatherDescription(weatherCode);
            
            weatherElement.textContent = `${temp}°C ${weatherText}`;
            console.log('Погода обновлена:', data.current_weather);
        } else {
            throw new Error('Нет данных о погоде');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки погоды:', error);
        weatherElement.textContent = "+2°C Облачно (оффлайн)";
    }
}

function getWeatherDescription(code) {
    const weatherMap = {
        0: "Ясно",
        1: "Преимущественно ясно",
        2: "Переменная облачность",
        3: "Пасмурно",
        45: "Туман",
        48: "Туман с изморозью",
        51: "Морось",
        53: "Умеренная морось",
        55: "Сильная морось",
        56: "Ледяная морось",
        57: "Сильная ледяная морось",
        61: "Небольшой дождь",
        63: "Умеренный дождь",
        65: "Сильный дождь",
        66: "Ледяной дождь",
        67: "Сильный ледяной дождь",
        71: "Небольшой снег",
        73: "Умеренный снег",
        75: "Сильный снег",
        77: "Снежные зёрна",
        80: "Небольшие ливни",
        81: "Умеренные ливни",
        82: "Сильные ливни",
        85: "Небольшие снегопады",
        86: "Сильные снегопады",
        95: "Гроза",
        96: "Гроза с градом",
        99: "Сильная гроза с градом"
    };
    
    return weatherMap[code] || "Облачно";
}