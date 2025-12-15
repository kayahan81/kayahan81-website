/**
 * Файл JavaScript для страницы хранилища
 */

// Глобальные переменные
let currentFiles = [];
let currentFolder = 'all';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница хранилища загружена');
    
    // Инициализация
    loadDemoFiles();
    setupEventListeners();
    updateStats();
});

// Загрузка демо-файлов
function loadDemoFiles() {
    currentFiles = [
        {
            id: 1,
            name: 'Отчёт_2024.pdf',
            size: '2.4 МБ',
            dateCreated: '1 ноя 2024',
            dateModified: '2 ноя 2024',
            type: 'pdf',
            folder: 'work'
        },
        {
            id: 2,
            name: 'Фото_отпуска.jpg',
            size: '4.2 МБ',
            dateCreated: '28 окт 2024',
            dateModified: '30 окт 2024',
            type: 'image',
            folder: 'personal'
        },
        {
            id: 3,
            name: 'Резюме.docx',
            size: '0.8 МБ',
            dateCreated: '25 окт 2024',
            dateModified: '29 окт 2024',
            type: 'doc',
            folder: 'work'
        },
        {
            id: 4,
            name: 'Проект_сайта.zip',
            size: '12.5 МБ',
            dateCreated: '20 окт 2024',
            dateModified: '22 окт 2024',
            type: 'archive',
            folder: 'projects'
        }
    ];
    
    renderFiles();
}

// Отрисовка файлов
function renderFiles() {
    const container = document.getElementById('files-container');
    if (!container) return;
    
    // Очищаем контейнер (оставляем только первый элемент-папку)
    container.innerHTML = '';
    
    // Добавляем большие папки
    const folders = [
        { name: 'Работа', items: 5, date: '2 ноя 2024', size: '24.5 МБ', icon: 'work' },
        { name: 'Личное', items: 3, date: '30 окт 2024', size: '8.7 МБ', icon: 'personal' },
        { name: 'Проекты', items: 4, date: '22 окт 2024', size: '15.3 МБ', icon: 'projects' }
    ];
    
    folders.forEach(folder => {
        const folderElement = document.createElement('div');
        folderElement.className = 'folder-item-large';
        folderElement.innerHTML = `
            <div class="folder-icon">
                <i class="fas fa-folder fa-3x"></i>
            </div>
            <div class="folder-info">
                <h4 class="folder-name">${folder.name}</h4>
                <div class="folder-meta">
                    <span class="folder-items">${folder.items} файлов</span>
                    <span class="folder-date">Изменено: ${folder.date}</span>
                    <span class="folder-size">${folder.size}</span>
                </div>
            </div>
            <div class="folder-actions">
                <button class="folder-btn open-btn" onclick="openFolder('${folder.icon}')" title="Открыть">
                    <i class="fas fa-folder-open"></i>
                </button>
                <button class="folder-btn delete-btn" onclick="deleteFolder('${folder.name}')" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(folderElement);
    });
    
    // Добавляем файлы
    currentFiles.forEach(file => {
        const icon = getFileIcon(file.type);
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <h4 class="file-name">${file.name}</h4>
                <div class="file-meta">
                    <span class="file-size">${file.size}</span>
                    <span class="file-date">Создан: ${file.dateCreated}</span>
                    <span class="file-modified">Изменён: ${file.dateModified}</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-btn download-btn" onclick="downloadFile(${file.id})" title="Скачать">
                    <i class="fas fa-download"></i>
                </button>
                <button class="file-btn delete-btn" onclick="deleteFile(${file.id})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="file-btn rename-btn" onclick="renameFile(${file.id})" title="Переименовать">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Сортировка
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortFiles(this.value);
        });
    }
    
    // Фильтры
    document.querySelectorAll('.sidebar-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-btn[data-filter]').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            filterFiles(this.getAttribute('data-filter'));
        });
    });
    
    // Папки в сайдбаре
    document.querySelectorAll('.folder-item').forEach(folder => {
        folder.addEventListener('click', function() {
            document.querySelectorAll('.folder-item').forEach(f => 
                f.classList.remove('active')
            );
            this.classList.add('active');
            const folderName = this.querySelector('span').textContent;
            changeFolder(folderName);
        });
    });
    
    // Кнопка загрузки
    const uploadBtn = document.getElementById('upload-files-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            openUploadModal();
        });
    }
    
    // Кнопка создания папки
    const newFolderBtn = document.getElementById('new-folder-btn');
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', function() {
            createNewFolder();
        });
    }
    
    // Кнопка обновления
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            location.reload();
        });
    }
}

// Функции для кнопок
function openFolder(folderName) {
    alert(`Открытие папки: ${folderName}`);
    // Здесь будет логика открытия папки
}

function deleteFolder(folderName) {
    if (confirm(`Удалить папку "${folderName}" и все файлы внутри?`)) {
        alert(`Папка "${folderName}" удалена`);
        // Здесь будет логика удаления папки
    }
}

function downloadFile(fileId) {
    const file = currentFiles.find(f => f.id === fileId);
    if (file) {
        alert(`Скачивание файла: ${file.name}`);
        // Здесь будет логика скачивания
    }
}

function deleteFile(fileId) {
    if (confirm('Удалить этот файл?')) {
        currentFiles = currentFiles.filter(f => f.id !== fileId);
        renderFiles();
        updateStats();
    }
}

function renameFile(fileId) {
    const file = currentFiles.find(f => f.id === fileId);
    if (file) {
        const newName = prompt('Введите новое имя файла:', file.name);
        if (newName && newName.trim() !== '') {
            file.name = newName.trim();
            renderFiles();
        }
    }
}

function sortFiles(criteria) {
    console.log(`Сортировка по: ${criteria}`);
    // Здесь будет логика сортировки
    alert(`Сортировка файлов по: ${criteria}`);
}

function filterFiles(filterType) {
    console.log(`Фильтр: ${filterType}`);
    // Здесь будет логика фильтрации
}

function changeFolder(folderName) {
    console.log(`Переход в папку: ${folderName}`);
    // Здесь будет логика смены папки
}

function openUploadModal() {
    alert('Открытие модального окна загрузки файлов');
    // Здесь будет открытие модального окна
}

function createNewFolder() {
    const folderName = prompt('Введите название новой папки:');
    if (folderName && folderName.trim() !== '') {
        alert(`Папка "${folderName}" создана`);
        // Здесь будет логика создания папки
    }
}

function updateStats() {
    const totalSize = currentFiles.reduce((sum, file) => {
        const size = parseFloat(file.size);
        return sum + (isNaN(size) ? 0 : size);
    }, 0);
    
    const usedSpaceElement = document.getElementById('used-space');
    if (usedSpaceElement) {
        usedSpaceElement.textContent = `${totalSize.toFixed(1)} ГБ`;
    }
    
    const freeSpace = 20 - totalSize;
    const freeSpaceElement = document.getElementById('free-space');
    if (freeSpaceElement) {
        freeSpaceElement.textContent = `${freeSpace.toFixed(1)} ГБ`;
    }
    
    // Обновляем прогресс-бар
    const percentage = (totalSize / 20) * 100;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    const progressText = document.querySelector('.progress-text span:first-child');
    if (progressText) {
        progressText.textContent = `${percentage.toFixed(1)}% использовано`;
    }
}

// Вспомогательные функции
function getFileIcon(type) {
    const icons = {
        'pdf': '<i class="fas fa-file-pdf fa-2x" style="color: #ff6b6b;"></i>',
        'image': '<i class="fas fa-file-image fa-2x" style="color: #4ecdc4;"></i>',
        'doc': '<i class="fas fa-file-word fa-2x" style="color: #4a90e2;"></i>',
        'archive': '<i class="fas fa-file-archive fa-2x" style="color: #f5a623;"></i>'
    };
    return icons[type] || '<i class="fas fa-file fa-2x"></i>';
}