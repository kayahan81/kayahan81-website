/**
 * Файл JavaScript для страницы Shadowrun 5e
 */

// Демо-данные по Shadowrun 5e
let shadowrunData = [
    {
        id: 1,
        title: 'Создание персонажа',
        category: 'персонажи',
        description: 'Базовый процесс создания персонажа в Shadowrun 5e',
        content: `<h4>Основные шаги создания персонажа:</h4>
        <ol>
            <li><strong>Выбор концепции:</strong> Определите роль персонажа в команде (Street Samurai, Mage, Decker, Face и т.д.)</li>
            <li><strong>Выбор расы:</strong> Человек, Эльф, Дворф, Орк или Тролль</li>
            <li><strong>Распределение приоритетов:</strong> Используйте систему Priority Table для распределения ресурсов</li>
            <li><strong>Приобретение навыков:</strong> Распределите очки навыков и навыков-знаний</li>
            <li><strong>Приобретение качеств:</strong> Выберите положительные и отрицательные качества</li>
            <li><strong>Приобретение снаряжения:</strong> Купите оружие, броню, кибернетику и прочее снаряжение</li>
            <li><strong>Расчёт финальных значений:</strong> Рассчитайте инициативу, хит-пойнты и прочие параметры</li>
        </ol>`,
        tags: ['персонажи', 'правила', 'начало']
    },
    {
        id: 2,
        title: 'Основные атрибуты',
        category: 'персонажи',
        description: 'Базовые характеристики персонажа',
        content: `<h4>Шесть основных атрибутов:</h4>
        <table>
            <tr>
                <th>Атрибут</th>
                <th>Описание</th>
                <th>Типовое значение</th>
            </tr>
            <tr>
                <td><strong>BOD (Телосложение)</strong></td>
                <td>Физическая выносливость и сопротивление повреждениям</td>
                <td>3-6</td>
            </tr>
            <tr>
                <td><strong>AGI (Ловкость)</strong></td>
                <td>Физическая координация и проворство</td>
                <td>3-6</td>
            </tr>
            <tr>
                <td><strong>REA (Реакция)</strong></td>
                <td>Физическая скорость и рефлексы</td>
                <td>3-6</td>
            </tr>
            <tr>
                <td><strong>STR (Сила)</strong></td>
                <td>Физическая мощь и грубая сила</td>
                <td>3-6</td>
            </tr>
            <tr>
                <td><strong>WIL (Воля)</strong></td>
                <td>Ментальная устойчивость и сила духа</td>
                <td>3-6</td>
            </tr>
            <tr>
                <td><strong>LOG (Логика)</strong></td>
                <td>Аналитическое мышление и решение проблем</td>
                <td>3-6</td>
            </tr>
            <tr>
                <td><strong>INT (Интеллект)</strong></td>
                <td>Острота ума и восприятие информации</td>
                <td>3-6</td>
            </tr>
            <tr>
                <td><strong>CHA (Харизма)</strong></td>
                <td>Социальное взаимодействие и влияние</td>
                <td>3-6</td>
            </tr>
        </table>
        <p><strong>Особые атрибуты:</strong> Магия (MAG), Резистентность (RES), Инициатива (INI)</p>`,
        tags: ['персонажи', 'атрибуты', 'правила']
    },
    {
        id: 3,
        title: 'Расы персонажей',
        category: 'персонажи',
        description: 'Доступные расы в Shadowrun 5e',
        content: `<h4>Пять основных рас:</h4>
        <table>
            <tr>
                <th>Раса</th>
                <th>Описание</th>
                <th>Бонусы</th>
                <th>Минусы</th>
            </tr>
            <tr>
                <td><strong>Человек</strong></td>
                <td>Средняя раса без особых бонусов или штрафов</td>
                <td>+1 к Edge (Удаче)</td>
                <td>Нет особых минусов</td>
            </tr>
            <tr>
                <td><strong>Эльф</strong></td>
                <td>Грациозные и харизматичные существа</td>
                <td>+2 AGI, +2 CHA</td>
                <td>-2 STR</td>
            </tr>
            <tr>
                <td><strong>Дворф</strong></td>
                <td>Крепкие и волевые низкорослые существа</td>
                <td>+2 BOD, +2 WIL, +1 REA</td>
                <td>-1 AGI, +1 к стоимости жилья</td>
            </tr>
            <tr>
                <td><strong>Орк</strong></td>
                <td>Сильные и выносливые существа</td>
                <td>+3 BOD, +2 STR</td>
                <td>-1 LOG, -1 CHA, социальные предрассудки</td>
            </tr>
            <tr>
                <td><strong>Тролль</strong></td>
                <td>Мощные и крупные существа</td>
                <td>+4 BOD, +4 STR</td>
                <td>-1 AGI, -1 CHA, большие расходы</td>
            </tr>
        </table>`,
        tags: ['персонажи', 'расы']
    },
    {
        id: 4,
        title: 'Магия и заклинания',
        category: 'магия',
        description: 'Основы магической системы',
        content: `<h4>Типы магов:</h4>
        <ul>
            <li><strong>Hermetic Mages:</strong> Академические маги, использующие логику и формулы</li>
            <li><strong>Shamans:</strong> Духовные маги, общающиеся с духами</li>
            <li><strong>Adepts:</strong> Физические маги, усиливающие своё тело</li>
            <li><strong>Aspected Mages:</strong> Специализированные маги с ограничениями</li>
            <li><strong>Mystic Adepts:</strong> Гибрид мага и адепта</li>
        </ul>
        
        <h4>Основные заклинания:</h4>
        <table>
            <tr>
                <th>Тип</th>
                <th>Пример</th>
                <th>Описание</th>
            </tr>
            <tr>
                <td><strong>Combat Spells</strong></td>
                <td>Manabolt, Fireball</td>
                <td>Заклинания для нанесения урона</td>
            </tr>
            <tr>
                <td><strong>Detection Spells</strong></td>
                <td>Clairvoyance, Detect Life</td>
                <td>Заклинания для обнаружения</td>
            </tr>
            <tr>
                <td><strong>Health Spells</strong></td>
                <td>Heal, Cure Disease</td>
                <td>Лечебные заклинания</td>
            </tr>
            <tr>
                <td><strong>Illusion Spells</strong></td>
                <td>Invisibility, Physical Mask</td>
                <td>Заклинания иллюзий</td>
            </tr>
            <tr>
                <td><strong>Manipulation Spells</strong></td>
                <td>Control Thoughts, Levitate</td>
                <td>Заклинания управления</td>
            </tr>
        </table>`,
        tags: ['магия', 'заклинания']
    },
    {
        id: 5,
        title: 'Навыки персонажей',
        category: 'навыки',
        description: 'Система навыков в Shadowrun 5e',
        content: `<h4>Категории навыков:</h4>
        
        <h5>Активные навыки (Active Skills):</h5>
        <table>
            <tr>
                <th>Группа</th>
                <th>Навыки</th>
                <th>Связанный атрибут</th>
            </tr>
            <tr>
                <td><strong>Firearms</strong></td>
                <td>Pistols, Automatics, Longarms</td>
                <td>AGI</td>
            </tr>
            <tr>
                <td><strong>Close Combat</strong></td>
                <td>Blades, Clubs, Unarmed Combat</td>
                <td>AGI</td>
            </tr>
            <tr>
                <td><strong>Stealth</strong></td>
                <td>Sneaking, Disguise, Palming</td>
                <td>AGI</td>
            </tr>
            <tr>
                <td><strong>Social</strong></td>
                <td>Con, Etiquette, Negotiation</td>
                <td>CHA</td>
            </tr>
            <tr>
                <td><strong>Technical</strong></td>
                <td>Hardware, Software, Cybertechnology</td>
                <td>LOG</td>
            </tr>
        </table>
        
        <h5>Знания и языки (Knowledge Skills):</h5>
        <p>Специализированные знания персонажа, от истории до корпоративной политики.</p>`,
        tags: ['навыки', 'персонажи']
    },
    {
        id: 6,
        title: 'Кибернетика',
        category: 'технологии',
        description: 'Импланты и кибернетические улучшения',
        content: `<h4>Типы кибернетики:</h4>
        
        <table>
            <tr>
                <th>Тип</th>
                <th>Примеры</th>
                <th>Эссенс</th>
                <th>Назначение</th>
            </tr>
            <tr>
                <td><strong>Cybereyes</strong></td>
                <td>Image Link, Low-Light Vision, Thermographic Vision</td>
                <td>0.1-0.5</td>
                <td>Улучшение зрения</td>
            </tr>
            <tr>
                <td><strong>Cyberears</strong></td>
                <td>Audio Enhancement, Balance Augmenter, Spatial Recognizer</td>
                <td>0.1-0.3</td>
                <td>Улучшение слуха</td>
            </tr>
            <tr>
                <td><strong>Cyberlimbs</strong></td>
                <td>Full Arm, Full Leg, Obvious/Subtle</td>
                <td>0.8-1.2</td>
                <td>Замена конечностей</td>
            </tr>
            <tr>
                <td><strong>Bodyware</strong></td>
                <td>Bone Lacing, Muscle Replacement, Skin Pocket</td>
                <td>0.2-2.0</td>
                <td>Улучшение тела</td>
            </tr>
            <tr>
                <td><strong>Headware</strong></td>
                <td>Datajack, Commlink, Control Rig</td>
                <td>0.1-0.5</td>
                <td>Улучшение головы/мозга</td>
            </tr>
        </table>
        
        <h4>Эссенс (Essence):</h4>
        <p>Мера человечности персонажа. Каждая кибернетика уменьшает эссенс. При 0 эссенс персонаж становится полным киборгом.</p>`,
        tags: ['технологии', 'кибернетика', 'импланты']
    }
];

// Глобальные переменные
let currentResults = [];
let selectedEntry = null;
let currentTag = 'all';
let recentEntries = [];

// Основная функция
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница Shadowrun 5e загружена');
    
    // Инициализация
    initSearch();
    initTagFilters();
    initAccessButtons();
    updateEntriesCount();
    
    // Загружаем несколько примеров в результаты
    showDemoResults();
});

// Инициализация поиска
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort-results');
    
    // Поиск по кнопке
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Поиск по Enter
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Сортировка
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortResults(this.value);
        });
    }
}

// Инициализация фильтров по тегам
function initTagFilters() {
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Снимаем активность со всех кнопок
            document.querySelectorAll('.tag-btn').forEach(b => 
                b.classList.remove('active')
            );
            
            // Активируем текущую
            this.classList.add('active');
            
            // Получаем тег
            currentTag = this.getAttribute('data-tag');
            
            // Выполняем поиск
            performSearch();
        });
    });
}

// Инициализация кнопок быстрого доступа
function initAccessButtons() {
    document.querySelectorAll('.access-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            searchBySection(section);
        });
    });
}

// Поиск по разделу
function searchBySection(section) {
    // Устанавливаем соответствующий тег
    let tag = '';
    
    switch(section) {
        case 'char-creation':
            tag = 'персонажи';
            break;
        case 'attributes':
            tag = 'атрибуты';
            break;
        case 'skills':
            tag = 'навыки';
            break;
        case 'races':
            tag = 'расы';
            break;
        case 'archetypes':
            tag = 'архетипы';
            break;
        default:
            tag = 'all';
    }
    
    // Активируем соответствующий тег
    document.querySelectorAll('.tag-btn').forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-tag') === tag) {
            b.classList.add('active');
        }
    });
    
    // Обновляем текущий тег
    currentTag = tag;
    
    // Выполняем поиск
    performSearch();
}

// Основная функция поиска
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Фильтруем данные
    currentResults = shadowrunData.filter(entry => {
        // Фильтр по тегу
        if (currentTag !== 'all' && !entry.tags.includes(currentTag)) {
            return false;
        }
        
        // Если поисковой запрос пустой, показываем все по тегу
        if (!searchTerm.trim()) {
            return true;
        }
        
        // Поиск по заголовку, описанию и тегам
        return entry.title.toLowerCase().includes(searchTerm) ||
               entry.description.toLowerCase().includes(searchTerm) ||
               entry.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
               entry.category.toLowerCase().includes(searchTerm);
    });
    
    // Сортируем результаты
    sortResults(document.getElementById('sort-results')?.value || 'relevance');
    
    // Отображаем результаты
    renderResults();
    
    // Обновляем статистику
    updateResultsCount();
}

// Сортировка результатов
function sortResults(criteria) {
    switch(criteria) {
        case 'title':
            currentResults.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'category':
            currentResults.sort((a, b) => a.category.localeCompare(b.category));
            break;
        case 'relevance':
        default:
            // По умолчанию - по ID (как в массиве)
            currentResults.sort((a, b) => a.id - b.id);
            break;
    }
    
    renderResults();
}

// Отображение результатов
function renderResults() {
    const container = document.getElementById('results-container');
    const titleElement = document.getElementById('results-title');
    
    if (!container) return;
    
    // Обновляем заголовок
    if (titleElement) {
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value : '';
        
        if (searchTerm.trim()) {
            titleElement.textContent = `Результаты поиска: "${searchTerm}"`;
        } else if (currentTag !== 'all') {
            const activeTag = document.querySelector('.tag-btn.active');
            const tagName = activeTag ? activeTag.textContent : currentTag;
            titleElement.textContent = `Категория: ${tagName}`;
        } else {
            titleElement.textContent = 'Все записи';
        }
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если нет результатов
    if (currentResults.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <h4>Ничего не найдено</h4>
                <p>Попробуйте изменить поисковый запрос или выбрать другую категорию</p>
            </div>
        `;
        return;
    }
    
    // Отображаем результаты
    currentResults.forEach(entry => {
        const card = document.createElement('div');
        card.className = `result-card ${selectedEntry === entry.id ? 'selected' : ''}`;
        card.setAttribute('data-id', entry.id);
        
        // Создаём теги
        const tagsHTML = entry.tags.map(tag => 
            `<span class="result-tag">${tag}</span>`
        ).join('');
        
        card.innerHTML = `
            <div class="result-title">
                <i class="fas fa-file-alt"></i>
                ${entry.title}
                <span class="result-category">${entry.category}</span>
            </div>
            <div class="result-description">${entry.description}</div>
            <div class="result-tags">${tagsHTML}</div>
        `;
        
        // Обработчик клика
        card.addEventListener('click', function() {
            selectEntry(entry.id);
        });
        
        container.appendChild(card);
    });
}

// Выбор записи
function selectEntry(entryId) {
    const entry = shadowrunData.find(e => e.id === entryId);
    if (!entry) return;
    
    // Обновляем выбранную запись
    selectedEntry = entryId;
    
    // Обновляем стиль карточек
    document.querySelectorAll('.result-card').forEach(card => {
        card.classList.remove('selected');
        if (parseInt(card.getAttribute('data-id')) === entryId) {
            card.classList.add('selected');
        }
    });
    
    // Отображаем детали
    showEntryDetails(entry);
    
    // Добавляем в недавние
    addToRecent(entry);
}

// Отображение деталей записи
function showEntryDetails(entry) {
    const detailsContainer = document.getElementById('details-content');
    const placeholder = document.querySelector('.details-placeholder');
    
    if (!detailsContainer) return;
    
    // Скрываем заглушку, показываем контент
    if (placeholder) placeholder.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    // Формируем теги
    const tagsHTML = entry.tags.map(tag => 
        `<span class="result-tag">${tag}</span>`
    ).join('');
    
    // Заполняем детали
    detailsContainer.innerHTML = `
        <div class="details-header">
            <h3><i class="fas fa-scroll"></i> ${entry.title}</h3>
            <div class="details-meta">
                <span><i class="fas fa-tag"></i> ${entry.category}</span>
                <span><i class="fas fa-hashtag"></i> ID: ${entry.id}</span>
            </div>
            <div class="result-tags">${tagsHTML}</div>
        </div>
        <div class="details-body">
            ${entry.content}
        </div>
    `;
    
    // Прокручиваем вверх деталей
    detailsContainer.scrollTop = 0;
}

// Добавление в недавние
function addToRecent(entry) {
    // Проверяем, есть ли уже эта запись в недавних
    const index = recentEntries.findIndex(e => e.id === entry.id);
    
    // Если есть, удаляем старую запись
    if (index !== -1) {
        recentEntries.splice(index, 1);
    }
    
    // Добавляем в начало
    recentEntries.unshift({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        timestamp: new Date()
    });
    
    // Ограничиваем до 5 записей
    if (recentEntries.length > 5) {
        recentEntries.pop();
    }
    
    // Обновляем отображение недавних
    updateRecentEntries();
}

// Обновление недавних записей
function updateRecentEntries() {
    const container = document.getElementById('recent-entries');
    if (!container) return;
    
    if (recentEntries.length === 0) {
        container.innerHTML = '<div class="no-recent"><p>Пока нет недавних записей</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    recentEntries.forEach(entry => {
        const element = document.createElement('div');
        element.className = 'recent-entry';
        element.setAttribute('data-id', entry.id);
        
        element.innerHTML = `
            <div class="recent-entry-title">${entry.title}</div>
            <div class="recent-entry-category">${entry.category}</div>
        `;
        
        element.addEventListener('click', function() {
            selectEntry(entry.id);
        });
        
        container.appendChild(element);
    });
}

// Показать демо-результаты
function showDemoResults() {
    // Показываем все записи
    currentResults = [...shadowrunData];
    renderResults();
    
    // Выбираем первую запись
    if (shadowrunData.length > 0) {
        setTimeout(() => {
            selectEntry(shadowrunData[0].id);
        }, 100);
    }
}

// Обновление счётчика записей
function updateEntriesCount() {
    const countElement = document.getElementById('entries-count');
    if (countElement) {
        countElement.textContent = shadowrunData.length;
    }
}

// Обновление счётчика результатов
function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = `${currentResults.length} результатов`;
    }
}

// Вспомогательные функции
function formatDate(date) {
    return date.toLocaleDateString('ru-RU');
}