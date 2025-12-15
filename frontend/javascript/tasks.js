/**
 * Файл JavaScript для страницы задач
 */

// Глобальные переменные для хранения задач
let tasks = [];

// Основная функция при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница задач загружена');
    
    // Инициализация всех компонентов
    initCalendar();
    loadDemoTasks();
    setupButtons();
    setupEventListeners();
    updateStats();
});

// 1. ИНИЦИАЛИЗАЦИЯ КАЛЕНДАРЯ
function initCalendar() {
    const calendarBtn = document.getElementById('show-calendar-btn');
    const closeBtn = document.getElementById('close-calendar-btn');
    const modal = document.getElementById('calendar-modal');
    
    if (!calendarBtn || !modal) {
        console.error('Элементы календаря не найдены');
        return;
    }
    
    // Открытие календаря
    calendarBtn.addEventListener('click', function() {
        console.log('Открытие календаря');
        modal.style.display = 'flex';
        renderCalendar();
    });
    
    // Закрытие календаря через крестик
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Закрытие календаря при клике вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 2. РЕНДЕРИНГ КАЛЕНДАРЯ
function renderCalendar() {
    const placeholder = document.getElementById('calendar-placeholder');
    if (!placeholder) return;
    
    const today = new Date();
    const nearestDeadline = getNearestDeadline();
    
    let calendarHTML = `
        <div class="calendar-view">
            
            <div class="calendar-info">
                <p><strong>Сегодня:</strong> ${formatDate(today)}</p>
                <p><strong>Ближайший дедлайн:</strong> ${nearestDeadline}</p>
            </div>
            <div class="calendar-grid">
    `;
    
    // Создаём календарь на текущий месяц
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    // Заголовки дней недели
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        calendarHTML += `<div class="calendar-header">${day}</div>`;
    });
    
    // Пустые клетки до первого дня месяца
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        calendarHTML += `<div class="calendar-day empty"></div>`;
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasDeadline = checkDeadlineForDate(dateStr);
        const isToday = day === today.getDate();
        
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        if (hasDeadline) dayClass += ' deadline-day';
        
        calendarHTML += `
            <div class="${dayClass}">
                ${day}
                ${hasDeadline ? '<div class="deadline-dot"></div>' : ''}
            </div>
        `;
    }
    
    calendarHTML += `
            </div>
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="deadline-dot"></div>
                    <span>Есть дедлайны</span>
                </div>
                <div class="legend-item">
                    <div class="today-marker"></div>
                    <span>Сегодня</span>
                </div>
            </div>
        </div>
    `;
    
    placeholder.innerHTML = calendarHTML;
}

// 3. ЗАГРУЗКА ДЕМО-ЗАДАЧ
function loadDemoTasks() {
    tasks = [
        {
            id: 1,
            title: 'Выполнить задание №23',
            folder: 'Математика',
            deadline: '2024-11-07',
            priority: 'high',
            description: 'Решить задачи по математическому анализу, страницы 45-48',
            completed: false
        },
        {
            id: 2,
            title: 'Сделать презентацию проекта',
            folder: 'Работа',
            deadline: '2024-11-10',
            priority: 'medium',
            description: 'Подготовить слайды для отчёта о проделанной работе',
            completed: false
        },
        {
            id: 3,
            title: 'Купить продукты',
            folder: 'Личное',
            deadline: '2024-11-05',
            priority: 'low',
            description: 'Молоко, хлеб, яйца, овощи',
            completed: true
        },
        {
            id: 4,
            title: 'Подготовиться к собеседованию',
            folder: 'Работа',
            deadline: '2024-11-15',
            priority: 'high',
            description: 'Повторить алгоритмы и структуры данных',
            completed: false
        }
    ];
    
    renderTasks();
}

// 4. ОТОБРАЖЕНИЕ ЗАДАЧ
function renderTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;
    
    tasksContainer.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.setAttribute('data-id', task.id);
        
        const deadlineDate = new Date(task.deadline);
        const formattedDeadline = formatDate(deadlineDate);
        const priorityText = getPriorityText(task.priority);
        
        taskElement.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
            </div>
            <div class="task-main">
                <div class="task-header">
                    <h4 class="task-title">${task.title}</h4>
                    <div class="task-meta">
                        <span class="task-folder">
                            <i class="fas fa-folder"></i> ${task.folder}
                        </span>
                        <span class="task-deadline">
                            <i class="fas fa-calendar"></i> ${formattedDeadline}
                        </span>
                        <span class="task-priority priority-${task.priority}">
                            <i class="fas fa-flag"></i> ${priorityText}
                        </span>
                    </div>
                </div>
                <div class="task-description">${task.description}</div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Добавляем обработчик чекбокса
        const checkbox = taskElement.querySelector(`#task-${task.id}`);
        checkbox.addEventListener('change', function() {
            task.completed = this.checked;
            taskElement.classList.toggle('completed', this.checked);
            updateStats();
        });
        
        tasksContainer.appendChild(taskElement);
    });
}

// 5. НАСТРОЙКА КНОПОК
function setupButtons() {
    // Кнопка создания задачи
    const newTaskBtn = document.getElementById('new-task-btn');
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', openTaskModal);
    }
    
    // Кнопка создания папки
    const newFolderBtn = document.getElementById('new-folder-btn');
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', function() {
            const folderName = prompt('Введите название папки:');
            if (folderName) {
                alert(`Папка "${folderName}" создана!`);
                // Здесь будет логика создания папки
            }
        });
    }
}

// 6. НАСТРОЙКА ВСЕХ ОБРАБОТЧИКОВ
function setupEventListeners() {
    // Сортировка
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortTasks(this.value);
        });
    }
    
    // Фильтры
    document.querySelectorAll('.sidebar-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-btn[data-filter]').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            filterTasks(this.getAttribute('data-filter'));
        });
    });
    
    // Переключение вида
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            // Здесь можно добавить переключение вида списка/сетки
        });
    });
}

// 7. ОБНОВЛЕНИЕ СТАТИСТИКИ
function updateStats() {
    // Подсчёт активных задач
    const activeTasks = tasks.filter(task => !task.completed).length;
    const tasksCountElement = document.getElementById('tasks-count');
    if (tasksCountElement) {
        tasksCountElement.textContent = activeTasks;
    }
    
    // Поиск ближайшего дедлайна
    const nearestDeadlineElement = document.getElementById('nearest-deadline');
    if (nearestDeadlineElement) {
        nearestDeadlineElement.textContent = getNearestDeadline();
    }
}

// 8. ПОИСК БЛИЖАЙШЕГО ДЕДЛАЙНА
function getNearestDeadline() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingTasks = tasks
        .filter(task => !task.completed)
        .map(task => ({
            ...task,
            deadlineDate: new Date(task.deadline)
        }))
        .filter(task => task.deadlineDate >= today)
        .sort((a, b) => a.deadlineDate - b.deadlineDate);
    
    if (upcomingTasks.length > 0) {
        return formatDate(upcomingTasks[0].deadlineDate);
    }
    
    return '—';
}

// 9. ПРОВЕРКА ДЕДЛАЙНОВ НА ДАТУ
function checkDeadlineForDate(dateStr) {
    return tasks.some(task => 
        !task.completed && 
        task.deadline === dateStr
    );
}

// 10. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
    });
}

function getPriorityText(priority) {
    const priorityMap = {
        'high': 'Высокий',
        'medium': 'Средний',
        'low': 'Низкий'
    };
    return priorityMap[priority] || priority;
}

// 11. ОСНОВНЫЕ ФУНКЦИИ ДЛЯ КНОПОК
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newTitle = prompt('Новое название задачи:', task.title);
        if (newTitle !== null) {
            task.title = newTitle;
            renderTasks();
            updateStats();
        }
    }
}

function deleteTask(taskId) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        renderTasks();
        updateStats();
    }
}

function openTaskModal() {
    alert('Здесь будет форма создания новой задачи');
    // В реальном проекте здесь будет модальное окно
}

function sortTasks(criteria) {
    console.log(`Сортировка по: ${criteria}`);
    // Здесь будет логика сортировки
}

function filterTasks(filterType) {
    console.log(`Фильтр: ${filterType}`);
    // Здесь будет логика фильтрации
}