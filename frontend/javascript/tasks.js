/**
 * Файл JavaScript для страницы задач
 */

// Глобальные переменные для хранения задач
let tasks = [];

// Основная функция при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Страница задач загружена');
    
    // Проверяем авторизацию
    const user = await checkAuth();
    if (!user) return;
    
    // Инициализация всех компонентов
    initCalendar();
    await loadTasks();
    setupButtons();
    setupEventListeners();
    updateStats();
});

// ==================== API ФУНКЦИИ ====================

/**
 * Загрузка задач с сервера
 */
async function loadTasks() {
    try {
        const response = await apiRequest('/tasks', 'GET');
        tasks = response.tasks || [];
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Ошибка загрузки задач:', error);
        showNotification('Ошибка загрузки задач', 'error');
        loadDemoTasks();
    }
}

/**
 * Создание новой задачи
 */
async function createTask(taskData) {
    try {
        const response = await apiRequest('/tasks', 'POST', taskData);
        await loadTasks();
        showNotification('Задача создана успешно', 'success');
        return response.task;
    } catch (error) {
        showNotification(error.message || 'Ошибка создания задачи', 'error');
        throw error;
    }
}

/**
 * Обновление задачи
 */
async function updateTask(taskId, updates) {
    try {
        await apiRequest(`/tasks/${taskId}`, 'PUT', updates);
        await loadTasks();
        showNotification('Задача обновлена успешно', 'success');
    } catch (error) {
        showNotification(error.message || 'Ошибка обновления задачи', 'error');
        throw error;
    }
}

/**
 * Удаление задачи
 */
async function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    
    try {
        await apiRequest(`/tasks/${taskId}`, 'DELETE');
        await loadTasks();
        showNotification('Задача удалена успешно', 'success');
    } catch (error) {
        showNotification(error.message || 'Ошибка удаления задачи', 'error');
        throw error;
    }
}

/**
 * Переключение статуса задачи
 */
async function toggleTaskStatus(taskId, completed) {
    try {
        await apiRequest(`/tasks/${taskId}/status`, 'PUT', { completed });
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

/**
 * Загрузка демо-задач (резервный вариант)
 */
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
        }
    ];
    
    renderTasks();
}

/**
 * Отображение задач
 */
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
                            <i class="fas fa-folder"></i> ${task.folder || 'Без папки'}
                        </span>
                        <span class="task-deadline">
                            <i class="fas fa-calendar"></i> ${formattedDeadline}
                        </span>
                        <span class="task-priority priority-${task.priority}">
                            <i class="fas fa-flag"></i> ${priorityText}
                        </span>
                    </div>
                </div>
                <div class="task-description">${task.description || ''}</div>
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
        
        const checkbox = taskElement.querySelector(`#task-${task.id}`);
        checkbox.addEventListener('change', async function() {
            task.completed = this.checked;
            taskElement.classList.toggle('completed', this.checked);
            await toggleTaskStatus(task.id, this.checked);
            updateStats();
        });
        
        tasksContainer.appendChild(taskElement);
    });
}

/**
 * Редактирование задачи
 */
async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newTitle = prompt('Новое название задачи:', task.title);
    if (newTitle !== null) {
        await updateTask(taskId, { title: newTitle });
    }
}

/**
 * Открытие модального окна создания задачи
 */
function openTaskModal() {
    const modalHTML = `
        <div id="task-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        ">
            <div style="
                background: white;
                padding: 20px;
                border-radius: 10px;
                width: 400px;
                max-width: 90%;
            ">
                <h3 style="margin-bottom: 20px;">Новая задача</h3>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Название:</label>
                    <input type="text" id="task-title" style="width: 100%; padding: 8px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Описание:</label>
                    <textarea id="task-desc" style="width: 100%; padding: 8px; height: 100px;"></textarea>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Дедлайн:</label>
                    <input type="date" id="task-deadline" style="width: 100%; padding: 8px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Приоритет:</label>
                    <select id="task-priority" style="width: 100%; padding: 8px;">
                        <option value="low">Низкий</option>
                        <option value="medium" selected>Средний</option>
                        <option value="high">Высокий</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeTaskModal()" style="padding: 8px 16px;">Отмена</button>
                    <button onclick="saveNewTask()" style="padding: 8px 16px; background: #4CAF50; color: white;">Создать</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Закрытие модального окна
 */
function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.remove();
}

/**
 * Сохранение новой задачи
 */
async function saveNewTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;
    
    if (!title) {
        showNotification('Введите название задачи', 'error');
        return;
    }
    
    await createTask({
        title,
        description,
        deadline: deadline || new Date().toISOString().split('T')[0],
        priority,
        folder: 'general'
    });
    
    closeTaskModal();
}

// ==================== КАЛЕНДАРЬ ====================

function initCalendar() {
    const calendarBtn = document.getElementById('show-calendar-btn');
    const closeBtn = document.getElementById('close-calendar-btn');
    const modal = document.getElementById('calendar-modal');
    
    if (!calendarBtn || !modal) return;
    
    calendarBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        renderCalendar();
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

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
    
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        calendarHTML += `<div class="calendar-header">${day}</div>`;
    });
    
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        calendarHTML += `<div class="calendar-day empty"></div>`;
    }
    
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

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function setupButtons() {
    const newTaskBtn = document.getElementById('new-task-btn');
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', openTaskModal);
    }
    
    const newFolderBtn = document.getElementById('new-folder-btn');
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', function() {
            const folderName = prompt('Введите название папки:');
            if (folderName) {
                showNotification(`Папка "${folderName}" создана!`, 'success');
            }
        });
    }
}

function setupEventListeners() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortTasks(this.value);
        });
    }
    
    document.querySelectorAll('.sidebar-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-btn[data-filter]').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            filterTasks(this.getAttribute('data-filter'));
        });
    });
}

function updateStats() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    const tasksCountElement = document.getElementById('tasks-count');
    if (tasksCountElement) {
        tasksCountElement.textContent = activeTasks;
    }
    
    const nearestDeadlineElement = document.getElementById('nearest-deadline');
    if (nearestDeadlineElement) {
        nearestDeadlineElement.textContent = getNearestDeadline();
    }
}

function getNearestDeadline() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingTasks = tasks
        .filter(task => !task.completed && task.deadline)
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

function checkDeadlineForDate(dateStr) {
    return tasks.some(task => 
        !task.completed && 
        task.deadline === dateStr
    );
}

function formatDate(date) {
    if (!date) return '—';
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
    });
}

// Получение приоритета текстом
function getPriorityText(priority) {
    const priorityMap = {
        'high': 'Высокий',
        'medium': 'Средний',
        'low': 'Низкий'
    };
    return priorityMap[priority] || priority;
}

// Форматирование даты
function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return '—';
    }
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
function sortTasks(criteria) {
    switch(criteria) {
        case 'deadline':
            tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            break;
        case 'priority':
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'title':
            tasks.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    
    renderTasks();
}

function filterTasks(filterType) {
    console.log(`Фильтр: ${filterType}`);
}