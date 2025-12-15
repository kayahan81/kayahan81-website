/**
 * Файл JavaScript для страницы хранилища файлов
 * Полная интеграция с бэкендом Go
 */

// Глобальные переменные
let currentFiles = [];
let currentFolders = [];
let currentFilter = 'all';
let currentView = 'list';
let selectedFolder = 'all';
let selectedFiles = [];
let isDemoMode = false;

// Основная функция при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Storage.js: Страница хранилища загружена');
    
    try {
        // Проверяем авторизацию
        const user = await checkAuth();
        if (!user) {
            console.error('Storage.js: Пользователь не авторизован');
            showNotification('Для доступа к хранилищу необходимо войти в систему', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        
        console.log('Storage.js: Пользователь авторизован:', user.username);
        
        // Проверяем доступность API
        await checkApiAvailability();
        
        // Инициализация
        initEventListeners();
        await loadFolders();
        await loadFiles();
        updateStorageStats(user);
        setupDragAndDrop();
        
        console.log('Storage.js: Инициализация завершена');
    } catch (error) {
        console.error('Storage.js: Ошибка при инициализации:', error);
        showNotification('Ошибка загрузки хранилища: ' + error.message, 'error');
    }
});

// ==================== ПРОВЕРКА API ====================

async function checkApiAvailability() {
    console.log('Storage.js: Проверка доступности API...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Storage.js: API доступен:', data);
            isDemoMode = false;
            return true;
        }
    } catch (error) {
        console.warn('Storage.js: API недоступен, переходим в демо-режим:', error.message);
        isDemoMode = true;
        showNotification('API недоступен. Используется демо-режим.', 'warning');
        return false;
    }
}

// ==================== API ФУНКЦИИ ====================

/**
 * Загрузка списка файлов с сервера
 */
async function loadFiles() {
    console.log('Storage.js: Загрузка файлов...');
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: загрузка демо-файлов');
        loadDemoFiles();
        return;
    }
    
    try {
        const params = new URLSearchParams();
        if (selectedFolder && selectedFolder !== 'all') {
            params.append('folder', selectedFolder);
        }
        
        const url = `/api/files${params.toString() ? '?' + params.toString() : ''}`;
        console.log('Storage.js: Запрос файлов:', url);
        
        const response = await apiRequest(url, 'GET');
        console.log('Storage.js: Ответ от сервера (файлы):', response);
        
        currentFiles = response.files || [];
        console.log('Storage.js: Загружено файлов:', currentFiles.length);
        
        renderFiles();
        updateFileCount();
        
        // Обновляем статистику хранилища
        if (response.storage_used !== undefined && response.storage_quota !== undefined) {
            updateStorageStats({
                storage_used: response.storage_used,
                storage_quota: response.storage_quota
            });
        }
        
        return currentFiles;
    } catch (error) {
        console.error('Storage.js: Ошибка загрузки файлов:', error);
        showNotification('Ошибка загрузки файлов. Используется демо-режим.', 'error');
        isDemoMode = true;
        loadDemoFiles();
        return [];
    }
}

/**
 * Загрузка списка папок с сервера
 */
async function loadFolders() {
    console.log('Storage.js: Загрузка папок...');
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: загрузка демо-папок');
        loadDemoFolders();
        return;
    }
    
    try {
        const response = await apiRequest('/api/files/folders', 'GET');
        console.log('Storage.js: Ответ от сервера (папки):', response);
        
        currentFolders = response.folders || [];
        console.log('Storage.js: Загружено папок:', currentFolders.length);
        
        renderFolders();
        populateFolderSelect();
        
        return currentFolders;
    } catch (error) {
        console.error('Storage.js: Ошибка загрузки папок:', error);
        showNotification('Ошибка загрузки папок. Используется демо-режим.', 'error');
        isDemoMode = true;
        loadDemoFolders();
        populateFolderSelect();
        return [];
    }
}

/**
 * Создание новой папки
 */
async function createFolder(folderName) {
    console.log('Storage.js: Создание папки:', folderName);
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: имитация создания папки');
        currentFolders.push(folderName);
        renderFolders();
        populateFolderSelect();
        showNotification(`Демо: Папка "${folderName}" создана`, 'success');
        return { name: folderName };
    }
    
    try {
        const response = await apiRequest('/api/files/folders', 'POST', {
            name: folderName
        });
        
        showNotification(`Папка "${folderName}" создана`, 'success');
        await loadFolders();
        return response.folder;
    } catch (error) {
        showNotification(error.message || 'Ошибка создания папки', 'error');
        throw error;
    }
}

/**
 * Загрузка файла на сервер
 */
async function uploadFile(file, folder = 'general') {
    console.log('Storage.js: Загрузка файла:', file.name, 'в папку:', folder);
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: имитация загрузки файла');
        
        // Имитируем задержку загрузки
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Создаем демо-файл
        const demoFile = {
            id: Date.now(),
            filename: file.name,
            original_filename: file.name,
            size: file.size,
            file_size: file.size,
            size_human: formatBytes(file.size),
            mime_type: file.type || 'application/octet-stream',
            folder: folder,
            uploaded_at: new Date().toISOString()
        };
        
        currentFiles.push(demoFile);
        renderFiles();
        updateFileCount();
        
        return { file: demoFile };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    try {
        console.log('Storage.js: Отправка файла на сервер...');
        const response = await apiRequest('/api/files/upload', 'POST', formData, 'multipart/form-data');
        console.log('Storage.js: Файл загружен успешно:', response);
        return response;
    } catch (error) {
        console.error('Storage.js: Ошибка загрузки файла:', error);
        throw error;
    }
}

/**
 * Удаление файла
 */
async function deleteFile(fileId, fileName) {
    console.log('Storage.js: Удаление файла:', fileId, fileName);
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: имитация удаления файла');
        currentFiles = currentFiles.filter(file => file.id !== fileId);
        renderFiles();
        updateFileCount();
        showNotification(`Демо: Файл "${fileName}" удалён`, 'success');
        return;
    }
    
    try {
        await apiRequest(`/api/files/${fileId}`, 'DELETE');
        showNotification(`Файл "${fileName}" удалён`, 'success');
        await loadFiles();
    } catch (error) {
        showNotification(error.message || 'Ошибка удаления файла', 'error');
        throw error;
    }
}

/**
 * Переименование файла
 */
async function renameFile(fileId, currentName, newName) {
    console.log('Storage.js: Переименование файла:', fileId, currentName, '→', newName);
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: имитация переименования файла');
        const file = currentFiles.find(f => f.id === fileId);
        if (file) {
            file.filename = newName;
            file.original_filename = newName;
        }
        renderFiles();
        showNotification('Демо: Файл переименован', 'success');
        return;
    }
    
    try {
        await apiRequest(`/api/files/${fileId}/rename`, 'PUT', {
            filename: newName
        });
        showNotification('Файл переименован', 'success');
        await loadFiles();
    } catch (error) {
        showNotification(error.message || 'Ошибка переименования файла', 'error');
        throw error;
    }
}

/**
 * Скачивание файла
 */
function downloadFile(fileId, fileName) {
    console.log('Storage.js: Скачивание файла:', fileId, fileName);
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: имитация скачивания файла');
        showNotification('Демо: Файл скачивается...', 'info');
        
        // Создаем и скачиваем демо-файл
        const content = `Это демо-файл "${fileName}".\nСоздан: ${new Date().toLocaleString()}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
    }
    
    window.open(`${API_BASE_URL}/api/files/download/${fileId}`, '_blank');
}

/**
 * Перемещение файла в другую папку
 */
async function moveFile(fileId, fileName, targetFolder) {
    console.log('Storage.js: Перемещение файла:', fileName, '→', targetFolder);
    
    if (isDemoMode) {
        console.log('Storage.js: Демо-режим: имитация перемещения файла');
        const file = currentFiles.find(f => f.id === fileId);
        if (file) {
            file.folder = targetFolder;
        }
        renderFiles();
        showNotification(`Демо: Файл "${fileName}" перемещён в "${targetFolder}"`, 'success');
        return;
    }
    
    try {
        await apiRequest(`/api/files/${fileId}/move`, 'PUT', {
            folder: targetFolder
        });
        showNotification(`Файл "${fileName}" перемещён в "${targetFolder}"`, 'success');
        await loadFiles();
    } catch (error) {
        showNotification(error.message || 'Ошибка перемещения файла', 'error');
        throw error;
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

function initEventListeners() {
    console.log('Storage.js: Инициализация обработчиков событий');
    
    // Кнопка загрузки файлов
    const uploadBtn = document.getElementById('upload-files-btn');
    if (uploadBtn) {
        console.log('Storage.js: Найдена кнопка загрузки файлов');
        uploadBtn.addEventListener('click', openUploadModal);
    } else {
        console.error('Storage.js: Кнопка upload-files-btn не найдена!');
    }
    
    // Кнопка создания папки
    const createFolderBtn = document.getElementById('create-folder-btn');
    if (createFolderBtn) {
        console.log('Storage.js: Найдена кнопка создания папки');
        createFolderBtn.addEventListener('click', createNewFolder);
    }
    
    // Кнопка обновления
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            console.log('Storage.js: Обновление списка файлов и папок');
            await Promise.all([loadFiles(), loadFolders()]);
            showNotification('Список обновлён', 'success');
        });
    }
    
    // Закрытие модального окна
    const closeUploadBtn = document.getElementById('close-upload-btn');
    if (closeUploadBtn) {
        closeUploadBtn.addEventListener('click', closeUploadModal);
    }
    
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', closeUploadModal);
    }
    
    // Выбор файлов
    const selectFilesBtn = document.getElementById('select-files-btn');
    const fileUploadInput = document.getElementById('file-upload-input');
    
    if (selectFilesBtn && fileUploadInput) {
        console.log('Storage.js: Настройка выбора файлов');
        selectFilesBtn.addEventListener('click', () => {
            console.log('Storage.js: Клик по кнопке выбора файлов');
            fileUploadInput.click();
        });
        fileUploadInput.addEventListener('change', handleFileSelect);
    }
    
    // Начало загрузки
    const startUploadBtn = document.getElementById('start-upload-btn');
    if (startUploadBtn) {
        console.log('Storage.js: Найдена кнопка начала загрузки');
        startUploadBtn.addEventListener('click', startUpload);
    } else {
        console.error('Storage.js: Кнопка start-upload-btn не найдена!');
    }
    
    // Переключение вида
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            currentView = this.getAttribute('data-view');
            const filesContainer = document.getElementById('files-container');
            if (filesContainer) {
                filesContainer.className = `common-container files-container ${currentView}-view`;
            }
        });
    });
    
    // Фильтры по типу файлов
    document.querySelectorAll('.sidebar-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-btn[data-filter]').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            filterFiles(currentFilter);
        });
    });
    
    // Сортировка
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortFiles(this.value);
        });
    }
    
    // Клик по области загрузки для выбора файлов
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    if (uploadPlaceholder && fileUploadInput) {
        uploadPlaceholder.addEventListener('click', () => {
            fileUploadInput.click();
        });
    }
    
    // Закрытие модального окна при клике вне его
    const uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        uploadModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeUploadModal();
            }
        });
    }
    
    console.log('Storage.js: Обработчики событий инициализированы');
}

function renderFiles() {
    const container = document.getElementById('files-container');
    if (!container) {
        console.error('Storage.js: Контейнер files-container не найден!');
        return;
    }
    
    console.log('Storage.js: Рендеринг файлов:', currentFiles.length);
    
    // Фильтруем файлы по типу
    let filteredFiles = [...currentFiles];
    if (currentFilter !== 'all') {
        filteredFiles = filteredFiles.filter(file => {
            const fileType = getFileType(file.mime_type || file.filename || file.original_filename);
            return fileType === currentFilter;
        });
    }
    
    // Фильтруем по выбранной папке
    if (selectedFolder !== 'all') {
        filteredFiles = filteredFiles.filter(file => file.folder === selectedFolder);
    }
    
    // Сортируем файлы
    const sortSelect = document.getElementById('sort-select');
    sortFiles(sortSelect ? sortSelect.value : 'name');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если файлов нет
    if (filteredFiles.length === 0) {
        container.innerHTML = `
            <div class="no-files" style="text-align: center; padding: 40px; color: #8ab08a;">
                <i class="fas fa-folder-open fa-3x"></i>
                <h4>${selectedFolder !== 'all' ? 'В этой папке нет файлов' : 'Файлы не найдены'}</h4>
                <p>${currentFilter !== 'all' ? 'Попробуйте изменить фильтр' : 'Загрузите первый файл'}</p>
            </div>
        `;
        return;
    }
    
    // Группируем файлы по папкам (если выбрана папка "Все файлы")
    if (selectedFolder === 'all') {
        const folders = {};
        
        filteredFiles.forEach(file => {
            const folder = file.folder || 'general';
            if (!folders[folder]) {
                folders[folder] = [];
            }
            folders[folder].push(file);
        });
        
        // Рендерим папки и файлы в них
        Object.keys(folders).forEach(folderName => {
            const folderFiles = folders[folderName];
            const folderElement = createFolderElement(folderName, folderFiles.length);
            container.appendChild(folderElement);
            
            folderFiles.forEach(file => {
                const fileElement = createFileElement(file);
                container.appendChild(fileElement);
            });
        });
    } else {
        // Рендерим только файлы в выбранной папке
        filteredFiles.forEach(file => {
            const fileElement = createFileElement(file);
            container.appendChild(fileElement);
        });
    }
}

function createFolderElement(folderName, fileCount) {
    const folderElement = document.createElement('div');
    folderElement.className = 'folder-item-large';
    folderElement.innerHTML = `
        <div class="folder-icon">
            <i class="fas fa-folder fa-3x"></i>
        </div>
        <div class="folder-info">
            <h4 class="folder-name">${folderName}</h4>
            <div class="folder-meta">
                <span class="folder-items">
                    <i class="fas fa-file"></i> ${fileCount} файлов
                </span>
                <span class="folder-date">
                    <i class="fas fa-calendar"></i> Папка
                </span>
            </div>
        </div>
        <div class="folder-actions">
            <button class="folder-btn open-btn" title="Открыть" onclick="selectFolder('${folderName}')">
                <i class="fas fa-folder-open"></i>
            </button>
            <button class="folder-btn delete-btn" title="Удалить" onclick="deleteFolder('${folderName}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return folderElement;
}

function createFileElement(file) {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    fileElement.setAttribute('data-id', file.id);
    
    const icon = getFileIcon(file.mime_type || file.filename || file.original_filename);
    const size = file.size_human || formatBytes(file.size || file.file_size || 0);
    const date = file.uploaded_at ? 
        new Date(file.uploaded_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : 'Дата неизвестна';
    const fileName = file.filename || file.original_filename || 'Без названия';
    
    fileElement.innerHTML = `
        <div class="file-icon">
            <i class="fas ${icon} fa-2x"></i>
        </div>
        <div class="file-info">
            <h4 class="file-name">${fileName}</h4>
            <div class="file-meta">
                <span class="file-size">
                    <i class="fas fa-weight-hanging"></i> ${size}
                </span>
                <span class="file-date">
                    <i class="fas fa-calendar"></i> ${date}
                </span>
                <span class="file-folder">
                    <i class="fas fa-folder"></i> ${file.folder || 'general'}
                </span>
            </div>
        </div>
        <div class="file-actions">
            <button class="action-btn download-btn" title="Скачать" onclick="downloadFile(${file.id}, '${fileName.replace(/'/g, "\\'")}')">
                <i class="fas fa-download"></i>
            </button>
            <button class="action-btn rename-btn" title="Переименовать" onclick="renameFilePrompt(${file.id}, '${fileName.replace(/'/g, "\\'")}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn move-btn" title="Переместить" onclick="moveFilePrompt(${file.id}, '${fileName.replace(/'/g, "\\'")}')">
                <i class="fas fa-folder-plus"></i>
            </button>
            <button class="action-btn delete-btn" title="Удалить" onclick="deleteFilePrompt(${file.id}, '${fileName.replace(/'/g, "\\'")}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return fileElement;
}

function renderFolders() {
    const foldersList = document.getElementById('folders-list');
    if (!foldersList) {
        console.error('Storage.js: Контейнер folders-list не найден!');
        return;
    }
    
    console.log('Storage.js: Рендеринг папок:', currentFolders.length);
    
    let html = `
        <div class="folder-item ${selectedFolder === 'all' ? 'active' : ''}" onclick="selectFolder('all')">
            <i class="fas fa-cloud"></i>
            <span>Все файлы</span>
            <span class="folder-count">${currentFiles.length}</span>
        </div>
    `;
    
    // Фильтруем только пользовательские папки (исключаем 'all' и 'general')
    const userFolders = currentFolders.filter(folder => 
        folder !== 'all' && folder !== 'general'
    );
    
    userFolders.forEach(folder => {
        const count = currentFiles.filter(f => f.folder === folder).length;
        html += `
            <div class="folder-item ${selectedFolder === folder ? 'active' : ''}" onclick="selectFolder('${folder}')">
                <i class="fas fa-folder"></i>
                <span>${folder}</span>
                <span class="folder-count">${count}</span>
            </div>
        `;
    });
    
    foldersList.innerHTML = html;
}

// ==================== ФУНКЦИИ ДЛЯ ЗАГРУЗКИ ====================

function openUploadModal() {
    console.log('Storage.js: Открытие модального окна загрузки');
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('selected-files').innerHTML = '';
        const startUploadBtn = document.getElementById('start-upload-btn');
        if (startUploadBtn) {
            startUploadBtn.disabled = true;
            startUploadBtn.textContent = 'Начать загрузку';
        }
        selectedFiles = [];
        
        // Добавляем select для выбора папки, если его нет
        addFolderSelectToModal();
        
        // Скрываем прогресс загрузки
        const progressContainer = document.getElementById('upload-progress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
            progressContainer.innerHTML = '';
        }
    }
}

function closeUploadModal() {
    console.log('Storage.js: Закрытие модального окна загрузки');
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.style.display = 'none';
        selectedFiles = [];
    }
}

function addFolderSelectToModal() {
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    if (!uploadPlaceholder) return;
    
    // Проверяем, есть ли уже select
    let folderSelect = document.getElementById('upload-folder-select');
    if (!folderSelect) {
        // Создаем select для выбора папки
        const selectHTML = `
            <div style="margin-top: 20px; text-align: left;">
                <label style="display: block; margin-bottom: 5px; color: #666; font-size: 14px;">
                    <i class="fas fa-folder"></i> Папка для загрузки:
                </label>
                <select id="upload-folder-select" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="general">Общая папка</option>
                </select>
            </div>
        `;
        
        // Добавляем после upload-info
        const uploadInfo = uploadPlaceholder.querySelector('.upload-info');
        if (uploadInfo) {
            uploadInfo.insertAdjacentHTML('afterend', selectHTML);
        } else {
            uploadPlaceholder.insertAdjacentHTML('beforeend', selectHTML);
        }
        
        folderSelect = document.getElementById('upload-folder-select');
    }
    
    // Заполняем опции существующими папками
    populateFolderSelect();
}

function populateFolderSelect() {
    const folderSelect = document.getElementById('upload-folder-select');
    if (!folderSelect) return;
    
    // Сохраняем выбранное значение
    const selectedValue = folderSelect.value;
    
    // Очищаем опции, кроме первой
    while (folderSelect.options.length > 1) {
        folderSelect.remove(1);
    }
    
    // Добавляем пользовательские папки
    const userFolders = currentFolders.filter(folder => 
        folder !== 'all' && folder !== 'general'
    );
    
    userFolders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        folderSelect.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение
    folderSelect.value = selectedValue || 'general';
}

function handleFileSelect(event) {
    console.log('Storage.js: Выбраны файлы:', event.target.files);
    const files = Array.from(event.target.files);
    addFilesToUploadList(files);
}

function addFilesToUploadList(files) {
    console.log('Storage.js: Добавление файлов в список загрузки:', files.length);
    const container = document.getElementById('selected-files');
    
    files.forEach(file => {
        // Проверка размера файла (макс 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showNotification(`Файл "${file.name}" превышает лимит 50MB`, 'error');
            return;
        }
        
        // Проверка расширения файла
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt', '.go', '.zip'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            showNotification(`Файл "${file.name}" имеет недопустимое расширение`, 'error');
            return;
        }
        
        // Проверка на дубликаты
        const isDuplicate = selectedFiles.some(f => 
            f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
        );
        
        if (!isDuplicate) {
            selectedFiles.push(file);
            
            const fileElement = document.createElement('div');
            fileElement.className = 'selected-file';
            fileElement.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatBytes(file.size)}</div>
                </div>
                <button class="remove-file" onclick="removeFileFromList('${file.name.replace(/'/g, "\\'")}', ${file.size}, ${file.lastModified})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            container.appendChild(fileElement);
        }
    });
    
    // Активируем кнопку загрузки
    const startUploadBtn = document.getElementById('start-upload-btn');
    if (startUploadBtn) {
        startUploadBtn.disabled = selectedFiles.length === 0;
    }
    
    console.log('Storage.js: Всего файлов для загрузки:', selectedFiles.length);
}

function removeFileFromList(fileName, fileSize, lastModified) {
    console.log('Storage.js: Удаление файла из списка:', fileName);
    selectedFiles = selectedFiles.filter(f => 
        !(f.name === fileName && f.size === fileSize && f.lastModified === lastModified)
    );
    
    const container = document.getElementById('selected-files');
    container.innerHTML = '';
    
    selectedFiles.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'selected-file';
        fileElement.innerHTML = `
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatBytes(file.size)}</div>
            </div>
            <button class="remove-file" onclick="removeFileFromList('${file.name.replace(/'/g, "\\'")}', ${file.size}, ${file.lastModified})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(fileElement);
    });
    
    const startUploadBtn = document.getElementById('start-upload-btn');
    if (startUploadBtn) {
        startUploadBtn.disabled = selectedFiles.length === 0;
    }
}

async function startUpload() {
    console.log('Storage.js: Начало загрузки файлов...');
    
    const folderSelect = document.getElementById('upload-folder-select');
    const folder = folderSelect ? folderSelect.value : 'general';
    
    console.log('Storage.js: Папка для загрузки:', folder);
    console.log('Storage.js: Количество файлов:', selectedFiles.length);
    
    if (selectedFiles.length === 0) {
        showNotification('Нет файлов для загрузки', 'error');
        return;
    }
    
    const progressContainer = document.getElementById('upload-progress');
    if (progressContainer) {
        progressContainer.style.display = 'block';
        progressContainer.innerHTML = '<h4 style="margin-bottom: 15px;">Загрузка файлов...</h4>';
    }
    
    const startUploadBtn = document.getElementById('start-upload-btn');
    if (startUploadBtn) {
        startUploadBtn.disabled = true;
        startUploadBtn.textContent = 'Загрузка...';
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            console.log(`Storage.js: Загрузка файла ${i + 1}/${selectedFiles.length}:`, file.name);
            
            // Создаем элемент прогресса
            if (progressContainer) {
                const progressItem = document.createElement('div');
                progressItem.className = 'progress-item';
                progressItem.innerHTML = `
                    <div class="progress-item-name">
                        <span>${file.name}</span>
                        <span>0%</span>
                    </div>
                    <div class="progress-item-bar">
                        <div class="progress-item-fill" style="width: 0%"></div>
                    </div>
                `;
                progressContainer.appendChild(progressItem);
                
                // Анимация прогресса
                const updateProgress = (percent) => {
                    const fill = progressItem.querySelector('.progress-item-fill');
                    const percentSpan = progressItem.querySelector('.progress-item-name span:last-child');
                    if (fill && percentSpan) {
                        fill.style.width = percent + '%';
                        percentSpan.textContent = Math.round(percent) + '%';
                    }
                };
                
                // Имитация прогресса
                for (let percent = 0; percent <= 100; percent += 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    updateProgress(percent);
                }
            }
            
            try {
                // Загружаем файл
                const result = await uploadFile(file, folder);
                console.log('Storage.js: Файл загружен:', result);
                successCount++;
                
                // Устанавливаем 100%
                if (progressContainer && progressContainer.lastChild) {
                    const fill = progressContainer.lastChild.querySelector('.progress-item-fill');
                    const percentSpan = progressContainer.lastChild.querySelector('.progress-item-name span:last-child');
                    if (fill && percentSpan) {
                        fill.style.width = '100%';
                        percentSpan.textContent = '100%';
                    }
                    progressContainer.lastChild.style.backgroundColor = 'rgba(100, 200, 100, 0.1)';
                }
                
            } catch (error) {
                errorCount++;
                console.error('Storage.js: Ошибка загрузки файла:', file.name, error);
                
                if (progressContainer && progressContainer.lastChild) {
                    progressContainer.lastChild.style.backgroundColor = 'rgba(200, 100, 100, 0.1)';
                    progressContainer.lastChild.querySelector('.progress-item-name span:last-child').textContent = 'Ошибка';
                }
            }
        }
        
        console.log('Storage.js: Загрузка завершена. Успешно:', successCount, 'Ошибок:', errorCount);
        
        // Показываем результат
        if (progressContainer) {
            progressContainer.innerHTML += `
                <div class="upload-result" style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
                    <h4 style="margin-top: 0;">Загрузка завершена</h4>
                    <p>Успешно загружено: <strong>${successCount}</strong> файлов</p>
                    <p>Не удалось загрузить: <strong>${errorCount}</strong> файлов</p>
                </div>
            `;
        }
        
        // Обновляем список файлов
        await loadFiles();
        await loadFolders();
        
        if (successCount > 0) {
            showNotification(`Успешно загружено ${successCount} файлов`, 'success');
        }
        
        if (errorCount > 0) {
            showNotification(`Не удалось загрузить ${errorCount} файлов`, 'error');
        }
        
        // Закрываем модальное окно через 3 секунды
        setTimeout(() => {
            closeUploadModal();
            selectedFiles = [];
            
            if (startUploadBtn) {
                startUploadBtn.disabled = false;
                startUploadBtn.textContent = 'Начать загрузку';
            }
        }, 3000);
        
    } catch (error) {
        console.error('Storage.js: Неожиданная ошибка при загрузке:', error);
        showNotification('Произошла непредвиденная ошибка при загрузке', 'error');
        
        if (startUploadBtn) {
            startUploadBtn.disabled = false;
            startUploadBtn.textContent = 'Начать загрузку';
        }
    }
}

// ==================== ФУНКЦИИ ДЛЯ ПАПОК ====================

async function createNewFolder() {
    const folderName = prompt('Введите название новой папки:', `Папка ${new Date().getDate()}.${new Date().getMonth() + 1}`);
    
    if (!folderName || folderName.trim() === '') {
        showNotification('Название папки не может быть пустым', 'error');
        return;
    }
    
    // Проверяем, нет ли уже такой папки
    if (currentFolders.includes(folderName)) {
        showNotification('Папка с таким названием уже существует', 'error');
        return;
    }
    
    try {
        await createFolder(folderName);
    } catch (error) {
        console.error('Storage.js: Ошибка создания папки:', error);
    }
}

function selectFolder(folder) {
    console.log('Storage.js: Выбрана папка:', folder);
    selectedFolder = folder;
    renderFolders();
    renderFiles();
}

async function deleteFolder(folderName) {
    if (!confirm(`Вы уверены, что хотите удалить папку "${folderName}"? Все файлы в ней будут перемещены в корневую папку.`)) {
        return;
    }
    
    try {
        if (isDemoMode) {
            // В демо-режиме перемещаем файлы в general
            currentFiles = currentFiles.map(file => {
                if (file.folder === folderName) {
                    file.folder = 'general';
                }
                return file;
            });
            
            // Удаляем папку из списка
            currentFolders = currentFolders.filter(f => f !== folderName);
            
            renderFolders();
            renderFiles();
            showNotification(`Демо: Папка "${folderName}" удалена`, 'success');
            return;
        }
        
        // В реальном режиме перемещаем файлы из этой папки в корневую
        const folderFiles = currentFiles.filter(f => f.folder === folderName);
        
        for (const file of folderFiles) {
            await moveFile(file.id, file.filename || file.original_filename, 'general');
        }
        
        showNotification(`Папка "${folderName}" удалена, файлы перемещены в корневую папку`, 'success');
        await loadFolders();
        await loadFiles();
    } catch (error) {
        showNotification('Ошибка удаления папки', 'error');
    }
}

// ==================== ФУНКЦИИ ДЛЯ ФАЙЛОВ ====================

async function deleteFilePrompt(fileId, fileName) {
    if (!confirm(`Вы уверены, что хотите удалить файл "${fileName}"?`)) return;
    
    try {
        await deleteFile(fileId, fileName);
    } catch (error) {
        console.error('Storage.js: Ошибка удаления файла:', error);
    }
}

async function renameFilePrompt(fileId, currentName) {
    const newName = prompt('Введите новое имя файла:', currentName);
    if (newName && newName !== currentName && newName.trim() !== '') {
        try {
            await renameFile(fileId, currentName, newName);
        } catch (error) {
            console.error('Storage.js: Ошибка переименования файла:', error);
        }
    }
}

async function moveFilePrompt(fileId, fileName) {
    // Создаем список доступных папок
    const availableFolders = currentFolders.filter(f => f !== 'all');
    
    const targetFolder = prompt(
        `Введите название папки для перемещения файла "${fileName}":\n\n` +
        `Доступные папки: ${availableFolders.join(', ')}`,
        'general'
    );
    
    if (targetFolder !== null && targetFolder.trim() !== '') {
        try {
            await moveFile(fileId, fileName, targetFolder.trim());
        } catch (error) {
            console.error('Storage.js: Ошибка перемещения файла:', error);
        }
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function updateStorageStats(user) {
    console.log('Storage.js: Обновление статистики хранилища');
    
    const usedSpace = document.getElementById('used-space');
    const freeSpace = document.getElementById('free-space');
    const totalSpace = document.getElementById('total-space');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (user && user.storage_used !== undefined && user.storage_quota !== undefined) {
        const used = user.storage_used;
        const quota = user.storage_quota;
        const free = quota - used;
        const percent = Math.round((used / quota) * 100);
        
        console.log('Storage.js: Использовано:', used, 'Квота:', quota, 'Процент:', percent + '%');
        
        if (usedSpace) usedSpace.textContent = formatBytes(used);
        if (freeSpace) freeSpace.textContent = formatBytes(free);
        if (totalSpace) totalSpace.textContent = formatBytes(quota);
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) {
            progressText.innerHTML = `
                <span>${percent}% использовано</span>
                <span>${formatBytes(used)} / ${formatBytes(quota)}</span>
            `;
        }
    } else {
        // Демо-статистика
        const demoUsed = 1024 * 1024 * 5; // 5MB
        const demoQuota = 1024 * 1024 * 50; // 50MB
        const demoFree = demoQuota - demoUsed;
        const demoPercent = Math.round((demoUsed / demoQuota) * 100);
        
        if (usedSpace) usedSpace.textContent = formatBytes(demoUsed);
        if (freeSpace) freeSpace.textContent = formatBytes(demoFree);
        if (totalSpace) totalSpace.textContent = formatBytes(demoQuota);
        
        if (progressFill) progressFill.style.width = `${demoPercent}%`;
        if (progressText) {
            progressText.innerHTML = `
                <span>${demoPercent}% использовано</span>
                <span>${formatBytes(demoUsed)} / ${formatBytes(demoQuota)}</span>
            `;
        }
    }
}

function updateFileCount() {
    // Обновляем счетчики в боковой панели
    const folderItems = document.querySelectorAll('.folder-item');
    folderItems.forEach(item => {
        const folderName = item.querySelector('span:first-of-type').textContent;
        if (folderName === 'Все файлы') {
            const countSpan = item.querySelector('.folder-count');
            if (countSpan) {
                countSpan.textContent = currentFiles.length;
            }
        } else {
            const count = currentFiles.filter(f => f.folder === folderName).length;
            const countSpan = item.querySelector('.folder-count');
            if (countSpan) {
                countSpan.textContent = count;
            }
        }
    });
}

function filterFiles(filterType) {
    console.log('Storage.js: Фильтрация файлов по типу:', filterType);
    currentFilter = filterType;
    renderFiles();
}

function sortFiles(criteria) {
    console.log('Storage.js: Сортировка файлов по критерию:', criteria);
    
    switch(criteria) {
        case 'name':
            currentFiles.sort((a, b) => {
                const nameA = (a.filename || a.original_filename || '').toLowerCase();
                const nameB = (b.filename || b.original_filename || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'date-modified':
        case 'date-created':
            currentFiles.sort((a, b) => {
                const dateA = new Date(a.uploaded_at || a.created_at || 0);
                const dateB = new Date(b.uploaded_at || b.created_at || 0);
                return dateB - dateA;
            });
            break;
        case 'size':
            currentFiles.sort((a, b) => (b.size || b.file_size || 0) - (a.size || a.file_size || 0));
            break;
        case 'type':
            currentFiles.sort((a, b) => {
                const typeA = getFileType(a.mime_type || a.filename || a.original_filename);
                const typeB = getFileType(b.mime_type || b.filename || b.original_filename);
                return typeA.localeCompare(typeB);
            });
            break;
    }
    
    renderFiles();
}

function getFileType(filename) {
    if (!filename) return 'other';
    
    const ext = filename.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
        return 'images';
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
        return 'documents';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return 'archives';
    } else {
        return 'other';
    }
}

function getFileIcon(filename) {
    if (!filename) return 'fa-file';
    
    const ext = filename.split('.').pop().toLowerCase();
    
    switch(ext) {
        case 'pdf':
            return 'fa-file-pdf';
        case 'doc':
        case 'docx':
        case 'odt':
            return 'fa-file-word';
        case 'xls':
        case 'xlsx':
            return 'fa-file-excel';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
            return 'fa-file-image';
        case 'mp3':
        case 'wav':
        case 'ogg':
            return 'fa-file-audio';
        case 'mp4':
        case 'avi':
        case 'mov':
            return 'fa-file-video';
        case 'zip':
        case 'rar':
        case '7z':
            return 'fa-file-archive';
        case 'go':
            return 'fa-code';
        default:
            return 'fa-file';
    }
}

// ==================== DRAG AND DROP ====================

function setupDragAndDrop() {
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const fileUploadInput = document.getElementById('file-upload-input');
    
    if (!uploadPlaceholder) return;
    
    console.log('Storage.js: Настройка Drag & Drop');
    
    // Обработчики для drag and drop
    uploadPlaceholder.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
    });
    
    uploadPlaceholder.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
    });
    
    uploadPlaceholder.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        console.log('Storage.js: Перетащено файлов:', files.length);
        addFilesToUploadList(files);
        
        // Также обновляем input file
        if (fileUploadInput) {
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            fileUploadInput.files = dataTransfer.files;
        }
    });
}

// ==================== ДЕМО-ДАННЫЕ (резервный вариант) ====================

function loadDemoFiles() {
    console.log('Storage.js: Загрузка демо-файлов');
    
    // Если уже есть демо-файлы, не загружаем снова
    if (currentFiles.length > 0 && !isDemoMode) {
        return;
    }
    
    currentFiles = [
        {
            id: 1,
            filename: 'Отчёт_2024.pdf',
            original_filename: 'Отчёт_2024.pdf',
            size: 2500000,
            file_size: 2500000,
            size_human: '2.5 MB',
            mime_type: 'application/pdf',
            folder: 'Работа',
            uploaded_at: '2024-11-02T10:30:00Z'
        },
        {
            id: 2,
            filename: 'Фото_отпуска.jpg',
            original_filename: 'Фото_отпуска.jpg',
            size: 4200000,
            file_size: 4200000,
            size_human: '4.2 MB',
            mime_type: 'image/jpeg',
            folder: 'Личное',
            uploaded_at: '2024-10-28T14:15:00Z'
        },
        {
            id: 3,
            filename: 'Резюме.docx',
            original_filename: 'Резюме.docx',
            size: 800000,
            file_size: 800000,
            size_human: '800 KB',
            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            folder: 'Работа',
            uploaded_at: '2024-10-25T09:45:00Z'
        },
        {
            id: 4,
            filename: 'main.go',
            original_filename: 'main.go',
            size: 1500,
            file_size: 1500,
            size_human: '1.5 KB',
            mime_type: 'text/x-go',
            folder: 'Проекты',
            uploaded_at: '2024-11-05T08:20:00Z'
        },
        {
            id: 5,
            filename: 'архив_данных.zip',
            original_filename: 'архив_данных.zip',
            size: 15000000,
            file_size: 15000000,
            size_human: '15 MB',
            mime_type: 'application/zip',
            folder: 'Архивы',
            uploaded_at: '2024-11-01T16:45:00Z'
        }
    ];
    
    renderFiles();
    updateFileCount();
}

function loadDemoFolders() {
    console.log('Storage.js: Загрузка демо-папок');
    
    // Если уже есть демо-папки, не загружаем снова
    if (currentFolders.length > 2 && !isDemoMode) {
        return;
    }
    
    currentFolders = ['all', 'general', 'Работа', 'Личное', 'Проекты', 'Архивы'];
    renderFolders();
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================

// Экспортируем функции в глобальную область видимости
window.selectFolder = selectFolder;
window.removeFileFromList = removeFileFromList;
window.deleteFilePrompt = deleteFilePrompt;
window.renameFilePrompt = renameFilePrompt;
window.moveFilePrompt = moveFilePrompt;
window.downloadFile = downloadFile;
window.deleteFolder = deleteFolder;

// Экспорт для отладки
window.StorageAPI = {
    loadFiles,
    loadFolders,
    createFolder,
    uploadFile,
    deleteFile,
    renameFile,
    moveFile,
    downloadFile,
    isDemoMode: () => isDemoMode,
    toggleDemoMode: () => {
        isDemoMode = !isDemoMode;
        console.log('Storage.js: Демо-режим:', isDemoMode ? 'Включен' : 'Выключен');
        return isDemoMode;
    }
};

// Добавляем стили для модального окна, если их нет
function addModalStyles() {
    if (!document.getElementById('storage-modal-styles')) {
        const styles = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background: white;
                border-radius: 10px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .selected-file {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
                margin-bottom: 8px;
                border-left: 4px solid #4CAF50;
            }
            
            .selected-file .file-info {
                flex-grow: 1;
            }
            
            .selected-file .file-name {
                font-weight: 500;
                margin-bottom: 3px;
                color: #333;
            }
            
            .selected-file .file-size {
                color: #666;
                font-size: 0.9em;
            }
            
            .selected-file .remove-file {
                background: none;
                border: none;
                color: #ff4444;
                cursor: pointer;
                font-size: 1.2em;
                padding: 5px;
            }
            
            .progress-item {
                background: #f5f5f5;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 8px;
                border: 1px solid #ddd;
            }
            
            .progress-item-name {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 14px;
                color: #333;
            }
            
            .progress-item-bar {
                height: 6px;
                background: #e0e0e0;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .progress-item-fill {
                height: 100%;
                background: linear-gradient(90deg, #6a8c6a, #8ab08a);
                border-radius: 3px;
                transition: width 0.3s;
            }
            
            #upload-placeholder.drag-over {
                border-color: #4CAF50;
                background: #f0fff0;
                transform: scale(1.02);
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'storage-modal-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
}

// Добавляем стили при загрузке
addModalStyles();

console.log('Storage.js: Загружен и готов к работе');