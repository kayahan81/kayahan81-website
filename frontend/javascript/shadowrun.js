/**
 * Файл JavaScript для страницы Shadowrun 5e
 * Интеграция с бэкендом с фолбэком на локальные данные
 */

// Демо-данные по Shadowrun 5e (фолбэк) на английском
let shadowrunData = [
    {
        id: 1,
        title: 'Character Creation',
        category: 'Characters',
        description: 'Basic character creation process in Shadowrun 5e',
        content: `<h4>Basic steps of character creation:</h4>
        <ol>
            <li><strong>Concept Selection:</strong> Define character role in team</li>
            <li><strong>Race Selection:</strong> Human, Elf, Dwarf, Ork or Troll</li>
            <li><strong>Priority Distribution:</strong> Use Priority Table system</li>
            <li><strong>Skill Acquisition:</strong> Distribute skill points</li>
            <li><strong>Quality Acquisition:</strong> Choose positive and negative qualities</li>
            <li><strong>Gear Acquisition:</strong> Buy weapons, armor, cyberware</li>
            <li><strong>Final Calculation:</strong> Calculate initiative, hit points</li>
        </ol>`,
        tags: 'characters,rules,beginning'
    },
    {
        id: 2,
        title: 'Basic Attributes',
        category: 'Characters',
        description: 'Basic character characteristics',
        content: `<h4>Six main attributes:</h4>
        <table>
            <tr><th>Attribute</th><th>Description</th><th>Typical Value</th></tr>
            <tr><td><strong>BOD (Body)</strong></td><td>Physical endurance</td><td>3-6</td></tr>
            <tr><td><strong>AGI (Agility)</strong></td><td>Physical coordination</td><td>3-6</td></tr>
            <tr><td><strong>REA (Reaction)</strong></td><td>Physical speed</td><td>3-6</td></tr>
            <tr><td><strong>STR (Strength)</strong></td><td>Physical power</td><td>3-6</td></tr>
            <tr><td><strong>WIL (Willpower)</strong></td><td>Mental resilience</td><td>3-6</td></tr>
            <tr><td><strong>LOG (Logic)</strong></td><td>Analytical thinking</td><td>3-6</td></tr>
        </table>`,
        tags: 'characters,attributes'
    }
];

// Глобальные переменные
let currentResults = [];
let selectedEntry = null;
let currentTag = 'all';
let recentEntries = [];
let allCategories = [];

// Основная функция
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Shadowrun page loaded');
    
    // Проверяем авторизацию
    const user = await checkAuth();
    if (!user) {
        console.log('User not authenticated');
        return;
    }
    
    console.log('User authenticated:', user.username);
    
    // Инициализация
    initSearch();
    initTagFilters();
    initAccessButtons();
    
    // Загружаем данные
    await loadShadowrunData();
    showDemoResults();
});

// ==================== API ФУНКЦИИ ====================

/**
 * Загрузка данных Shadowrun с сервера
 */
async function loadShadowrunData() {
    try {
        console.log('Loading Shadowrun data from API...');
        const response = await apiRequest('/shadowrun/entries', 'GET');
        
        if (response.entries && response.entries.length > 0) {
            shadowrunData = response.entries;
            console.log('Shadowrun data loaded from server:', shadowrunData.length, 'entries');
            
            // Загружаем категории
            await loadCategories();
        } else {
            console.log('Server returned empty list, using demo data');
            await loadCategories();
        }
        
        updateEntriesCount();
    } catch (error) {
        console.warn('API недоступен, используем демо-данные:', error.message);
        await loadCategories();
        updateEntriesCount();
    }
}

/**
 * Загрузка категорий
 */
async function loadCategories() {
    try {
        const categoriesResponse = await apiRequest('/shadowrun/categories', 'GET');
        if (categoriesResponse.categories) {
            allCategories = categoriesResponse.categories;
            console.log('Categories loaded:', allCategories);
            updateCategoryFilters(allCategories);
        }
    } catch (error) {
        console.warn('Не удалось загрузить категории:', error.message);
        // Используем категории из демо-данных
        allCategories = [...new Set(shadowrunData.map(entry => entry.category))];
        updateCategoryFilters(allCategories);
    }
}

/**
 * Обновление фильтров категорий
 */
function updateCategoryFilters(categories) {
    const tagsContainer = document.querySelector('.tags-container');
    if (!tagsContainer) return;
    
    console.log('Updating category filters with:', categories);
    
    // Сохраняем кнопку "All"
    const allTagBtn = document.querySelector('[data-tag="all"]');
    
    // Очищаем контейнер
    tagsContainer.innerHTML = '';
    
    // Добавляем кнопку "All" если она существует
    if (allTagBtn) {
        tagsContainer.appendChild(allTagBtn);
    } else {
        // Создаем кнопку "All"
        const allBtn = document.createElement('button');
        allBtn.className = 'tag-btn active';
        allBtn.setAttribute('data-tag', 'all');
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', function() {
            document.querySelectorAll('.tag-btn').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            currentTag = 'all';
            performSearch();
        });
        tagsContainer.appendChild(allBtn);
    }
    
    // Добавляем категории из API
    if (categories && categories.length > 0) {
        categories.forEach(category => {
            const tagBtn = document.createElement('button');
            tagBtn.className = 'tag-btn';
            tagBtn.setAttribute('data-tag', category);
            tagBtn.textContent = category;
            
            tagBtn.addEventListener('click', function() {
                document.querySelectorAll('.tag-btn').forEach(b => 
                    b.classList.remove('active')
                );
                this.classList.add('active');
                currentTag = category;
                performSearch();
            });
            
            tagsContainer.appendChild(tagBtn);
        });
    }
}

/**
 * Поиск через API с фолбэком
 */
async function searchShadowrun(query, category = null) {
    try {
        let url = '/shadowrun/entries';
        const params = new URLSearchParams();
        
        if (query && query.trim() !== '') {
            params.append('q', query);
        }
        
        if (category && category !== 'all') {
            params.append('category', category);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('Searching API with:', url);
        const response = await apiRequest(url, 'GET');
        
        if (response.entries) {
            console.log('API search returned:', response.entries.length, 'results');
            return response.entries;
        }
    } catch (error) {
        console.warn('API search unavailable:', error.message);
    }
    
    // Fallback to local search
    return searchInDemoData(query, category);
}

/**
 * Локальный поиск по демо-данным
 */
function searchInDemoData(query, category = null) {
    return shadowrunData.filter(entry => {
        if (category && category !== 'all') {
            // Convert both to lowercase for case-insensitive comparison
            if (entry.category.toLowerCase() !== category.toLowerCase()) {
                return false;
            }
        }
        
        if (!query || query.trim() === '') {
            return true;
        }
        
        const searchTerm = query.toLowerCase();
        const entryTitle = entry.title ? entry.title.toLowerCase() : '';
        const entryDesc = entry.description ? entry.description.toLowerCase() : '';
        const entryTags = entry.tags ? entry.tags.toLowerCase() : '';
        const entryCategory = entry.category ? entry.category.toLowerCase() : '';
        
        return entryTitle.includes(searchTerm) ||
               entryDesc.includes(searchTerm) ||
               entryTags.includes(searchTerm) ||
               entryCategory.includes(searchTerm);
    });
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort-results');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortResults(this.value);
        });
    }
}

function initTagFilters() {
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tag-btn').forEach(b => 
                b.classList.remove('active')
            );
            
            this.classList.add('active');
            currentTag = this.getAttribute('data-tag');
            performSearch();
        });
    });
}

function initAccessButtons() {
    document.querySelectorAll('.access-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            searchBySection(section);
        });
    });
}

async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value : '';
    
    console.log('Performing search for:', searchTerm, 'tag:', currentTag);
    
    try {
        // Try API first
        currentResults = await searchShadowrun(searchTerm, currentTag);
    } catch (error) {
        console.error('Search failed:', error);
        // Fallback to local search
        currentResults = searchInDemoData(searchTerm, currentTag);
    }
    
    console.log('Search results:', currentResults.length);
    
    // Get sort criteria
    const sortSelect = document.getElementById('sort-results');
    const sortCriteria = sortSelect ? sortSelect.value : 'relevance';
    
    sortResults(sortCriteria);
    renderResults();
    updateResultsCount();
}

function searchBySection(section) {
    let tag = '';
    
    switch(section) {
        case 'char-creation': tag = 'Characters'; break;
        case 'attributes': tag = 'Characters'; break;
        case 'skills': tag = 'Game Mechanics'; break;
        case 'races': tag = 'Metahumans'; break;
        case 'archetypes': tag = 'Characters'; break;
        default: tag = 'all';
    }
    
    // Update tag buttons
    document.querySelectorAll('.tag-btn').forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-tag') === tag || 
            (tag === 'all' && b.getAttribute('data-tag') === 'all')) {
            b.classList.add('active');
        }
    });
    
    currentTag = tag;
    performSearch();
}

function sortResults(criteria) {
    switch(criteria) {
        case 'title':
            currentResults.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'category':
            currentResults.sort((a, b) => {
                const catA = a.category || '';
                const catB = b.category || '';
                return catA.localeCompare(catB);
            });
            break;
        case 'relevance':
        default:
            currentResults.sort((a, b) => (a.id || 0) - (b.id || 0));
            break;
    }
    
    renderResults();
}

function renderResults() {
    const container = document.getElementById('results-container');
    const titleElement = document.getElementById('results-title');
    
    if (!container) return;
    
    // Update title
    if (titleElement) {
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value : '';
        
        if (searchTerm.trim()) {
            titleElement.textContent = `Search results: "${searchTerm}"`;
        } else if (currentTag !== 'all') {
            titleElement.textContent = `Category: ${currentTag}`;
        } else {
            titleElement.textContent = 'All entries';
        }
    }
    
    container.innerHTML = '';
    
    if (currentResults.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <h4>No results found</h4>
                <p>Try changing your search query or select another category</p>
            </div>
        `;
        return;
    }
    
    currentResults.forEach(entry => {
        const card = document.createElement('div');
        card.className = `result-card ${selectedEntry === entry.id ? 'selected' : ''}`;
        card.setAttribute('data-id', entry.id);
        
        // Handle tags (could be string or array)
        let tagsArray = [];
        if (typeof entry.tags === 'string') {
            tagsArray = entry.tags.split(',').map(t => t.trim());
        } else if (Array.isArray(entry.tags)) {
            tagsArray = entry.tags;
        }
        
        const tagsHTML = tagsArray.map(tag => 
            `<span class="result-tag">${tag}</span>`
        ).join('');
        
        card.innerHTML = `
            <div class="result-title">
                <i class="fas fa-file-alt"></i>
                ${entry.title || 'Untitled'}
                <span class="result-category">${entry.category || 'Uncategorized'}</span>
            </div>
            <div class="result-description">${entry.description || 'No description'}</div>
            <div class="result-tags">${tagsHTML}</div>
        `;
        
        card.addEventListener('click', function() {
            selectEntry(entry.id);
        });
        
        container.appendChild(card);
    });
}

function selectEntry(entryId) {
    console.log('Selecting entry:', entryId);
    
    // Try to find entry in current results first
    let entry = currentResults.find(e => e.id == entryId);
    
    // If not found, try in all data
    if (!entry) {
        entry = shadowrunData.find(e => e.id == entryId);
    }
    
    if (!entry) {
        console.error('Entry not found:', entryId);
        return;
    }
    
    selectedEntry = entryId;
    
    // Update selected state in UI
    document.querySelectorAll('.result-card').forEach(card => {
        card.classList.remove('selected');
        if (parseInt(card.getAttribute('data-id')) == entryId) {
            card.classList.add('selected');
        }
    });
    
    showEntryDetails(entry);
    addToRecent(entry);
}

function showEntryDetails(entry) {
    const detailsContainer = document.getElementById('details-content');
    const placeholder = document.querySelector('.details-placeholder');
    
    if (!detailsContainer) return;
    
    if (placeholder) placeholder.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    // Handle tags (could be string or array)
    let tagsArray = [];
    if (typeof entry.tags === 'string') {
        tagsArray = entry.tags.split(',').map(t => t.trim());
    } else if (Array.isArray(entry.tags)) {
        tagsArray = entry.tags;
    }
    
    const tagsHTML = tagsArray.map(tag => 
        `<span class="result-tag">${tag}</span>`
    ).join('');
    
    detailsContainer.innerHTML = `
        <div class="details-header">
            <h3><i class="fas fa-scroll"></i> ${entry.title || 'Untitled'}</h3>
            <div class="details-meta">
                <span><i class="fas fa-tag"></i> ${entry.category || 'Uncategorized'}</span>
                <span><i class="fas fa-hashtag"></i> ID: ${entry.id || 'N/A'}</span>
                ${entry.views !== undefined ? `<span><i class="fas fa-eye"></i> Views: ${entry.views}</span>` : ''}
            </div>
            <div class="result-tags">${tagsHTML}</div>
        </div>
        <div class="details-body">
            ${entry.content || entry.description || 'No content available'}
        </div>
    `;
    
    detailsContainer.scrollTop = 0;
}

function addToRecent(entry) {
    // Remove if already exists
    const index = recentEntries.findIndex(e => e.id === entry.id);
    
    if (index !== -1) {
        recentEntries.splice(index, 1);
    }
    
    // Add to beginning
    recentEntries.unshift({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        timestamp: new Date()
    });
    
    // Keep only last 5
    if (recentEntries.length > 5) {
        recentEntries.pop();
    }
    
    updateRecentEntries();
}

function updateRecentEntries() {
    const container = document.getElementById('recent-entries');
    if (!container) return;
    
    if (recentEntries.length === 0) {
        container.innerHTML = '<div class="no-recent"><p>No recent entries yet</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    recentEntries.forEach(entry => {
        const element = document.createElement('div');
        element.className = 'recent-entry';
        element.setAttribute('data-id', entry.id);
        
        element.innerHTML = `
            <div class="recent-entry-title">${entry.title || 'Untitled'}</div>
            <div class="recent-entry-category">${entry.category || 'Uncategorized'}</div>
            <div class="recent-entry-time">${formatTimeAgo(entry.timestamp)}</div>
        `;
        
        element.addEventListener('click', function() {
            selectEntry(entry.id);
        });
        
        container.appendChild(element);
    });
}

function showDemoResults() {
    console.log('Showing demo results');
    currentResults = [...shadowrunData];
    renderResults();
    updateResultsCount();
    
    // Select first entry if available
    if (shadowrunData.length > 0) {
        setTimeout(() => {
            selectEntry(shadowrunData[0].id);
        }, 100);
    }
}

function updateEntriesCount() {
    const countElement = document.getElementById('entries-count');
    if (countElement) {
        countElement.textContent = shadowrunData.length;
    }
}

function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = `${currentResults.length} results`;
    }
}

function formatTimeAgo(date) {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString();
}

// Helper function to get entry by ID
function getEntryById(id) {
    // Try current results first
    let entry = currentResults.find(e => e.id == id);
    
    // Try all data
    if (!entry) {
        entry = shadowrunData.find(e => e.id == id);
    }
    
    return entry;
}

// Экспорт функций для использования в консоли
window.ShadowrunAPI = {
    loadShadowrunData,
    searchShadowrun,
    selectEntry,
    performSearch,
    getEntryById,
    showDemoResults
};