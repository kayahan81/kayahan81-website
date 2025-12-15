// Общие утилиты для всего приложения
const JWT_KEY = 'portfolio_jwt_token';
const USER_KEY = 'portfolio_user_data';
const API_BASE_URL = 'http://localhost:8080/api';

// Универсальный запрос к API (ИСПРАВЛЕННЫЙ)
async function apiRequest(endpoint, method = 'GET', data = null, contentType = 'application/json') {
    const token = localStorage.getItem(JWT_KEY);
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (contentType !== 'multipart/form-data') {
        headers['Content-Type'] = contentType;
    }
    
    const options = {
        method,
        headers,
        credentials: 'include'
    };
    
    if (data) {
        if (contentType === 'multipart/form-data') {
            options.body = data;
            // Не устанавливаем Content-Type для FormData - браузер сам установит
            delete headers['Content-Type'];
        } else {
            options.body = JSON.stringify(data);
        }
    }
    
    try {
        const response = await fetch(url, options);
        
        // Проверяем, есть ли тело ответа
        const text = await response.text();
        let result = {};
        
        if (text) {
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.warn('Ответ не в JSON формате:', text);
            }
        }
        
        if (!response.ok) {
            throw new Error(result.error || result.message || `Ошибка: ${response.status} ${response.statusText}`);
        }
        
        return result;
    } catch (error) {
        console.error('API ошибка:', error);
        throw error;
    }
}

// Проверка авторизации (ИСПРАВЛЕННЫЙ)
async function checkAuth() {
    try {
        console.log('checkAuth вызван');
        const token = localStorage.getItem('portfolio_jwt_token');
        console.log('Токен:', token);
        
        if (!token) {
            console.log('Нет токена');
            return null;
        }
        
        // Декодируем токен для проверки
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Payload токена:', payload);
        
        // Проверяем срок действия
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.log('Токен истек');
            localStorage.removeItem('portfolio_jwt_token');
            return null;
        }
        
        // Запрашиваем информацию о пользователе с сервера
        console.log('Запрашиваем /user endpoint...');
        const response = await apiRequest('/user', 'GET');
        console.log('Ответ /user:', response);
        
        return response.user || null;
        
    } catch (error) {
        console.error('Ошибка в checkAuth:', error);
        localStorage.removeItem('portfolio_jwt_token');
        return null;
    }
}

// Функция логина (ДОБАВЬТЕ эту функцию)
async function login(username, password) {
    try {
        const response = await apiRequest('/login', 'POST', {
            username: username.trim(),
            password: password
        });
        
        if (response.token && response.user) {
            localStorage.setItem(JWT_KEY, response.token);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
            
            return response.user;
        } else {
            throw new Error('Некорректный ответ от сервера');
        }
    } catch (error) {
        throw error;
    }
}

// Функция регистрации (ДОБАВЬТЕ эту функцию)
async function register(username, email, password) {
    try {
        const response = await apiRequest('/register', 'POST', {
            username: username.trim(),
            email: email.trim(),
            password: password
        });
        
        if (response.user) {
            // После регистрации автоматически логинимся
            return await login(username, password);
        } else {
            throw new Error('Некорректный ответ от сервера');
        }
    } catch (error) {
        throw error;
    }
}

// Обновленная функция initAuth для главной страницы
async function initAuth() {
    const user = await checkAuth();
    
    if (user) {
        updateAuthUI(user);
    } else {
        // Настройка формы входа на главной странице
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', async function() {
                const username = document.getElementById('login').value;
                const password = document.getElementById('password').value;
                
                if (!username || !password) {
                    showNotification('Введите логин и пароль', 'error');
                    return;
                }
                
                try {
                    const userData = await login(username, password);
                    
                    showNotification(`Добро пожаловать, ${userData.username}!`, 'success');
                    updateAuthUI(userData);
                    
                    // Перенаправляем на tasks.html через 1 секунду
                    setTimeout(() => {
                        window.location.href = 'tasks.html';
                    }, 1000);
                    
                } catch (error) {
                    showNotification(error.message || 'Ошибка входа. Проверьте логин и пароль.', 'error');
                }
            });
        }
        
        // Настройка формы регистрации если есть
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', async function() {
                const username = document.getElementById('reg-username').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirm-password').value;
                
                if (!username || !email || !password || !confirmPassword) {
                    showNotification('Заполните все поля', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showNotification('Пароли не совпадают', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showNotification('Пароль должен быть не менее 6 символов', 'error');
                    return;
                }
                
                try {
                    const userData = await register(username, email, password);
                    
                    showNotification(`Регистрация успешна! Добро пожаловать, ${userData.username}!`, 'success');
                    updateAuthUI(userData);
                    
                    setTimeout(() => {
                        window.location.href = 'tasks.html';
                    }, 1000);
                    
                } catch (error) {
                    showNotification(error.message || 'Ошибка регистрации', 'error');
                }
            });
        }
    }
}

// Улучшенная функция updateAuthUI
function updateAuthUI(user) {
    const authSection = document.querySelector('.auth-section');
    if (!authSection) return;
    
    const storageUsed = user.storage_used ? formatBytes(user.storage_used) : '0 B';
    const storageQuota = user.storage_quota ? formatBytes(user.storage_quota) : '50 MB';
    const percent = user.storage_quota ? Math.round((user.storage_used / user.storage_quota) * 100) : 0;
    
    if (window.location.pathname.includes('index.html')) {
        authSection.innerHTML = `
            <div class="user-welcome">
                <h3>Добро пожаловать, <span class="username">${user.username}</span>!</h3>
                <div class="storage-info">
                    <small>Хранилище: ${storageUsed} / ${storageQuota} (${percent}%)</small>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
                <div class="auth-buttons">
                    <button class="btn btn-primary" id="go-to-dashboard">
                        <i class="fas fa-tachometer-alt"></i> Панель управления
                    </button>
                    <button class="btn btn-secondary" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Выйти
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('logout-btn')?.addEventListener('click', logout);
        document.getElementById('go-to-dashboard')?.addEventListener('click', function() {
            window.location.href = 'tasks.html';
        });
    } else {
        // Для других страниц
        authSection.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <span class="username">${user.username}</span>
                    <small>${storageUsed} / ${storageQuota}</small>
                </div>
                <button class="logout-btn" id="logout-btn" title="Выйти">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
        
        document.getElementById('logout-btn')?.addEventListener('click', function(e) {
            e.stopPropagation();
            logout();
        });
    }
}

// Вспомогательная функция для форматирования байтов
function formatBytes(bytes) {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Добавьте CSS для прогресс-бара и user-info
const authStyles = `
    .auth-section {
        margin: 20px 0;
    }
    
    .user-welcome {
        background: rgba(255, 255, 255, 0.1);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
    }
    
    .user-welcome h3 {
        margin-bottom: 10px;
        color: white;
    }
    
    .username {
        color: #4CAF50;
        font-weight: bold;
    }
    
    .storage-info {
        margin: 10px 0;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        margin-top: 5px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        transition: width 0.3s;
    }
    
    .auth-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 15px;
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s;
    }
    
    .user-info:hover {
        background: rgba(255, 255, 255, 0.15);
    }
    
    .user-avatar {
        font-size: 24px;
        color: #4CAF50;
    }
    
    .user-details {
        display: flex;
        flex-direction: column;
    }
    
    .user-details .username {
        font-weight: bold;
        color: white;
    }
    
    .user-details small {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
    }
    
    .logout-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.3s;
    }
    
    .logout-btn:hover {
        color: white;
        background: rgba(255, 0, 0, 0.2);
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
    }
    
    .btn-primary {
        background: #4CAF50;
        color: white;
    }
    
    .btn-primary:hover {
        background: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

// Добавляем стили в документ
if (!document.getElementById('auth-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'auth-styles';
    styleEl.textContent = authStyles;
    document.head.appendChild(styleEl);
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

// Экспортируем функции для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiRequest,
        checkAuth,
        login,
        register,
        logout,
        showNotification,
        formatBytes
    };
}
// Исправленная функция logout
function logout() {
    console.log('=== LOGOUT PROCESS START ===');
    
    // 1. Удаляем данные из localStorage
    const tokenBefore = localStorage.getItem(JWT_KEY);
    const userBefore = localStorage.getItem(USER_KEY);
    
    console.log('Before logout - Token:', tokenBefore ? 'present' : 'absent');
    console.log('Before logout - User:', userBefore ? 'present' : 'absent');
    
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_KEY);
    
    const tokenAfter = localStorage.getItem(JWT_KEY);
    const userAfter = localStorage.getItem(USER_KEY);
    
    console.log('After logout - Token:', tokenAfter ? 'present' : 'absent');
    console.log('After logout - User:', userAfter ? 'present' : 'absent');
    
    // 2. Показываем уведомление
    showNotification('Вы успешно вышли из системы', 'success');
    
    // 3. Обновляем UI
    updateAuthUIAfterLogout();
    
    // 4. Перенаправляем на главную страницу
    console.log('Redirecting to index.html in 1 second...');
    
    setTimeout(() => {
        // Проверяем, на какой странице мы находимся
        const currentPage = window.location.pathname.split('/').pop();
        console.log('Current page:', currentPage);
        
        if (currentPage === 'index.html' || currentPage === '') {
            // Если уже на главной, просто обновляем страницу
            console.log('Already on index.html, reloading...');
            window.location.reload();
        } else {
            // Иначе переходим на главную
            console.log('Redirecting to index.html...');
            window.location.href = 'index.html';
        }
    }, 1000);
    
    console.log('=== LOGOUT PROCESS END ===');
}

// Функция для обновления UI после выхода
function updateAuthUIAfterLogout() {
    const authSection = document.querySelector('.auth-section');
    if (!authSection) return;
    
    // Для главной страницы показываем форму входа
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        authSection.innerHTML = `
            <div class="login-form">
                <h3>Вход в систему</h3>
                <div class="form-group">
                    <input type="text" id="login" placeholder="Логин" value="admin" class="form-control">
                </div>
                <div class="form-group">
                    <input type="password" id="password" placeholder="Пароль" value="admin123" class="form-control">
                </div>
                <button id="login-btn" class="btn btn-primary btn-block">
                    <i class="fas fa-sign-in-alt"></i> Войти
                </button>
            </div>
        `;
        
        // Назначаем обработчик для кнопки входа
        setTimeout(() => {
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.addEventListener('click', handleLogin);
            }
        }, 100);
    } else {
        // Для других страниц просто очищаем
        authSection.innerHTML = '';
    }
}

// Обработчик входа (для переиспользования)
async function handleLogin() {
    const username = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('Введите логин и пароль', 'error');
        return;
    }
    
    try {
        const userData = await login(username, password);
        showNotification(`Добро пожаловать, ${userData.username}!`, 'success');
        updateAuthUI(userData);
    } catch (error) {
        showNotification(error.message || 'Ошибка входа', 'error');
    }
}
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

// Функции для даты и погоды
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('ru-RU', options);
    }
}