/**
 * Файл JavaScript для страницы Go-скриптов
 * Эмуляция выполнения Go-кода
 */

// Примеры кода для быстрой загрузки
const codeExamples = {
    'hello': `package main

import "fmt"

func main() {
    fmt.Println("Hello, Shadowrun World!")
    fmt.Println("Добро пожаловать в киберпанк 2077")
}`,

    'calculator': `package main

import "fmt"

func main() {
    a := 15
    b := 7
    
    fmt.Printf("a = %d, b = %d\\n", a, b)
    fmt.Printf("Сумма: %d\\n", a + b)
    fmt.Printf("Разность: %d\\n", a - b)
    fmt.Printf("Произведение: %d\\n", a * b)
    fmt.Printf("Частное: %.2f\\n", float64(a) / float64(b))
    fmt.Printf("Остаток: %d\\n", a % b)
}`,

    'fibonacci': `package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    fmt.Println("Числа Фибоначчи:")
    for i := 0; i < 10; i++ {
        fmt.Printf("F(%d) = %d\\n", i, fibonacci(i))
    }
}`,

    'shadowrun': `package main

import "fmt"

// Структура для персонажа Shadowrun
type Character struct {
    Name     string
    Race     string
    Archetype string
    Attributes map[string]int
    Skills     map[string]int
}

func main() {
    // Создаём персонажа
    runner := Character{
        Name:     "Raven",
        Race:     "Elf",
        Archetype: "Street Samurai",
        Attributes: map[string]int{
            "BOD": 4,
            "AGI": 7,
            "REA": 5,
            "STR": 3,
            "WIL": 3,
            "LOG": 2,
            "INT": 5,
            "CHA": 6,
        },
        Skills: map[string]int{
            "Blades": 5,
            "Pistols": 4,
            "Sneaking": 6,
            "Etiquette": 3,
        },
    }
    
    fmt.Println("=== ПЕРСОНАЖ SHADOWRUN ===")
    fmt.Printf("Имя: %s\\n", runner.Name)
    fmt.Printf("Раса: %s\\n", runner.Race)
    fmt.Printf("Архетип: %s\\n", runner.Archetype)
    
    fmt.Println("\\nАтрибуты:")
    for attr, value := range runner.Attributes {
        fmt.Printf("  %s: %d\\n", attr, value)
    }
    
    fmt.Println("\\nНавыки:")
    for skill, rating := range runner.Skills {
        fmt.Printf("  %s: %d\\n", skill, rating)
    }
    
    // Симуляция броска кубов
    fmt.Println("\\nБросок кубов (12d6):")
    successes := 0
    for i := 0; i < 12; i++ {
        roll := 1 + (i * 17 % 6) // Псевдослучайные числа
        if roll >= 5 {
            successes++
            fmt.Printf("  %d (УСПЕХ) ✔\\n", roll)
        } else {
            fmt.Printf("  %d (провал)\\n", roll)
        }
    }
    fmt.Printf("\\nИтого успехов: %d\\n", successes)
}`
};

// Основная функция
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница Go-скриптов загружена');
    
    // Инициализация
    initEditor();
    initButtons();
    initExamples();
    updateStats();
    
    // Проверяем авторизацию
    checkAuth();
});

// Инициализация редактора
function initEditor() {
    const codeEditor = document.getElementById('go-code');
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    
    if (!codeEditor) return;
    
    // Настройка темы
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }
    
    // Настройка размера шрифта
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', function() {
            codeEditor.style.fontSize = this.value + 'px';
            localStorage.setItem('go_editor_fontsize', this.value);
        });
        
        // Восстанавливаем сохранённый размер
        const savedSize = localStorage.getItem('go_editor_fontsize');
        if (savedSize) {
            fontSizeSelect.value = savedSize;
            codeEditor.style.fontSize = savedSize + 'px';
        }
    }
    
    // Подсчёт строк и символов
    codeEditor.addEventListener('input', updateStats);
    
    // Сохранение кода при изменении
    codeEditor.addEventListener('input', function() {
        localStorage.setItem('go_editor_code', this.value);
    });
    
    // Восстановление сохранённого кода
    const savedCode = localStorage.getItem('go_editor_code');
    if (savedCode) {
        codeEditor.value = savedCode;
    } else {
        // Загружаем пример по умолчанию
        codeEditor.value = codeExamples['hello'];
    }
    
    updateStats();
}

// Применение темы
function applyTheme(theme) {
    const codeEditor = document.getElementById('go-code');
    const outputContent = document.getElementById('output-content');
    
    if (!codeEditor) return;
    
    // Сохраняем тему
    localStorage.setItem('go_editor_theme', theme);
    
    switch(theme) {
        case 'dark':
            codeEditor.style.background = '#0a0f0a';
            codeEditor.style.color = '#d0e0d0';
            if (outputContent) {
                outputContent.style.background = '#0a0f0a';
                outputContent.style.color = '#d0e0d0';
            }
            break;
            
        case 'light':
            codeEditor.style.background = '#f0f8f0';
            codeEditor.style.color = '#1a2a1a';
            if (outputContent) {
                outputContent.style.background = '#f0f8f0';
                outputContent.style.color = '#1a2a1a';
            }
            break;
            
        case 'default':
        default:
            codeEditor.style.background = 'rgba(15, 25, 15, 0.9)';
            codeEditor.style.color = '#d0e0d0';
            if (outputContent) {
                outputContent.style.background = 'rgba(15, 25, 15, 0.9)';
                outputContent.style.color = '#d0e0d0';
            }
            break;
    }
}

// Инициализация кнопок
function initButtons() {
    // Кнопка выполнения
    const runBtn = document.getElementById('run-code-btn');
    if (runBtn) {
        runBtn.addEventListener('click', runGoCode);
    }
    
    // Кнопка сохранения
    const saveBtn = document.getElementById('save-script-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveScript);
    }
    
    // Кнопка загрузки
    const loadBtn = document.getElementById('load-script-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', loadScript);
    }
    
    // Кнопка очистки редактора
    const clearEditorBtn = document.getElementById('clear-editor-btn');
    if (clearEditorBtn) {
        clearEditorBtn.addEventListener('click', clearEditor);
    }
    
    // Кнопка очистки вывода
    const clearOutputBtn = document.getElementById('clear-output-btn');
    if (clearOutputBtn) {
        clearOutputBtn.addEventListener('click', clearOutput);
    }
    
    // Кнопка копирования вывода
    const copyOutputBtn = document.getElementById('copy-output-btn');
    if (copyOutputBtn) {
        copyOutputBtn.addEventListener('click', copyOutput);
    }
}

// Инициализация примеров
function initExamples() {
    // Создаём выпадающий список с примерами
    const editorHeader = document.querySelector('.editor-header');
    if (!editorHeader) return;
    
    const examplesSelect = document.createElement('select');
    examplesSelect.id = 'examples-select';
    examplesSelect.className = 'select-control';
    examplesSelect.style.marginLeft = '10px';
    examplesSelect.style.fontSize = '12px';
    
    examplesSelect.innerHTML = `
        <option value="">Примеры кода...</option>
        <option value="hello">Hello World</option>
        <option value="calculator">Калькулятор</option>
        <option value="fibonacci">Числа Фибоначчи</option>
        <option value="shadowrun">Персонаж Shadowrun</option>
    `;
    
    examplesSelect.addEventListener('change', function() {
        if (this.value && codeExamples[this.value]) {
            document.getElementById('go-code').value = codeExamples[this.value];
            updateStats();
            localStorage.setItem('go_editor_code', codeExamples[this.value]);
        }
    });
    
    // Добавляем в редактор
    const editorOptions = document.querySelector('.editor-options');
    if (editorOptions) {
        editorOptions.appendChild(examplesSelect);
    }
}

// Выполнение Go-кода (эмуляция)
function runGoCode() {
    const codeEditor = document.getElementById('go-code');
    const outputContent = document.getElementById('output-content');
    
    if (!codeEditor || !outputContent) return;
    
    const code = codeEditor.value.trim();
    
    if (!code) {
        showOutput('Ошибка: редактор кода пуст', 'error');
        return;
    }
    
    // Показываем индикатор выполнения
    showOutput('Выполнение кода...', 'info');
    
    // Имитируем задержку выполнения
    setTimeout(() => {
        try {
            const result = emulateGoExecution(code);
            showOutput(result.output, result.success ? 'success' : 'error');
        } catch (error) {
            showOutput(`Ошибка выполнения: ${error.message}`, 'error');
        }
    }, 800);
}

// Эмуляция выполнения Go-кода
function emulateGoExecution(code) {
    // Простая проверка на базовый синтаксис
    if (!code.includes('package main')) {
        return {
            success: false,
            output: 'Ошибка компиляции: отсутствует "package main"\nКаждая Go-программа должна начинаться с package main'
        };
    }
    
    if (!code.includes('func main()')) {
        return {
            success: false,
            output: 'Ошибка компиляции: отсутствует функция main()\nНеобходима функция func main() для точки входа'
        };
    }
    
    // Генерируем вывод в зависимости от содержимого кода
    let output = '';
    let success = true;
    
    // Время "выполнения"
    const executionTime = (Math.random() * 300 + 100).toFixed(0);
    
    // Определяем тип кода по содержимому
    if (code.includes('fmt.Println("Hello') || code.includes('fmt.Println(`Hello')) {
        output = `Hello, Shadowrun World!
Добро пожаловать в киберпанк 2077

Программа выполнена успешно.
Время выполнения: ${executionTime} мс
Память: 1.2 MB`;
        
    } else if (code.includes('fibonacci') || code.includes('Fibonacci')) {
        output = `Числа Фибоначчи:
F(0) = 0
F(1) = 1
F(2) = 1
F(3) = 2
F(4) = 3
F(5) = 5
F(6) = 8
F(7) = 13
F(8) = 21
F(9) = 34

Программа выполнена успешно.
Время выполнения: ${executionTime} мс
Память: 1.5 MB`;
        
    } else if (code.includes('a := 15') && code.includes('b := 7')) {
        output = `a = 15, b = 7
Сумма: 22
Разность: 8
Произведение: 105
Частное: 2.14
Остаток: 1

Программа выполнена успешно.
Время выполнения: ${executionTime} мс
Память: 1.1 MB`;
        
    } else if (code.includes('Shadowrun') || code.includes('Character')) {
        output = `=== ПЕРСОНАЖ SHADOWRUN ===
Имя: Raven
Раса: Elf
Архетип: Street Samurai

Атрибуты:
  BOD: 4
  AGI: 7
  REA: 5
  STR: 3
  WIL: 3
  LOG: 2
  INT: 5
  CHA: 6

Навыки:
  Blades: 5
  Pistols: 4
  Sneaking: 6
  Etiquette: 3

Бросок кубов (12d6):
  1 (провал)
  6 (УСПЕХ) ✔
  3 (провал)
  5 (УСПЕХ) ✔
  2 (провал)
  5 (УСПЕХ) ✔
  4 (провал)
  6 (УСПЕХ) ✔
  1 (провал)
  5 (УСПЕХ) ✔
  3 (провал)
  6 (УСПЕХ) ✔

Итого успехов: 6

Программа выполнена успешно.
Время выполнения: ${executionTime} мс
Память: 2.3 MB`;
        
    } else {
        // Общий вывод для другого кода
        output = `Код выполняется...
        
Вывод программы:
[Здесь был бы вывод вашего Go-кода]

В реальной системе этот код был бы скомпилирован и выполнен.
В учебных целях используется эмуляция.

Программа выполнена успешно.
Время выполнения: ${executionTime} мс
Память: 1.8 MB`;
    }
    
    return { success, output };
}

// Показать вывод
function showOutput(text, type) {
    const outputContent = document.getElementById('output-content');
    const placeholder = document.querySelector('.output-placeholder');
    
    if (!outputContent) return;
    
    // Скрываем заглушку
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Очищаем предыдущий вывод
    outputContent.innerHTML = '';
    
    // Создаём элемент вывода
    const outputElement = document.createElement('div');
    outputElement.className = 'program-output';
    
    // Добавляем стили в зависимости от типа
    if (type === 'error') {
        outputElement.innerHTML = `<div class="compile-error">
            <i class="fas fa-exclamation-triangle"></i>
            <pre>${text}</pre>
        </div>`;
    } else if (type === 'info') {
        outputElement.innerHTML = `<div class="stdout">
            <i class="fas fa-sync fa-spin"></i>
            ${text}
        </div>`;
    } else {
        // Разделяем stdout и информацию о выполнении
        const parts = text.split('\n\nПрограмма выполнена');
        if (parts.length > 1) {
            outputElement.innerHTML = `
                <div class="stdout"><pre>${parts[0]}</pre></div>
                <div class="execution-time">
                    <hr>
                    <i class="fas fa-check-circle"></i> Программа выполнена${parts[1]}
                </div>
            `;
        } else {
            outputElement.innerHTML = `<div class="stdout"><pre>${text}</pre></div>`;
        }
    }
    
    outputContent.appendChild(outputElement);
    
    // Прокручиваем вниз
    outputContent.scrollTop = outputContent.scrollHeight;
}

// Сохранение скрипта
function saveScript() {
    const codeEditor = document.getElementById('go-code');
    if (!codeEditor) return;
    
    const code = codeEditor.value.trim();
    
    if (!code) {
        alert('Невозможно сохранить пустой скрипт');
        return;
    }
    
    const scriptName = prompt('Введите название скрипта:', `script_${Date.now()}`);
    
    if (scriptName) {
        // Сохраняем в localStorage
        const scripts = JSON.parse(localStorage.getItem('go_scripts') || '{}');
        scripts[scriptName] = {
            code: code,
            timestamp: new Date().toISOString(),
            name: scriptName
        };
        
        localStorage.setItem('go_scripts', JSON.stringify(scripts));
        
        // Показываем уведомление
        showOutput(`Скрипт "${scriptName}" сохранён успешно`, 'success');
        
        // Обновляем список скриптов
        updateScriptsList();
    }
}

// Загрузка скрипта
function loadScript() {
    const scripts = JSON.parse(localStorage.getItem('go_scripts') || '{}');
    const scriptNames = Object.keys(scripts);
    
    if (scriptNames.length === 0) {
        alert('Нет сохранённых скриптов');
        return;
    }
    
    let scriptList = 'Выберите скрипт для загрузки:\n\n';
    scriptNames.forEach((name, index) => {
        const script = scripts[name];
        const date = new Date(script.timestamp).toLocaleDateString();
        scriptList += `${index + 1}. ${name} (${date})\n`;
    });
    
    const choice = prompt(scriptList + '\nВведите номер скрипта:');
    const index = parseInt(choice) - 1;
    
    if (index >= 0 && index < scriptNames.length) {
        const scriptName = scriptNames[index];
        const script = scripts[scriptName];
        
        document.getElementById('go-code').value = script.code;
        updateStats();
        
        showOutput(`Скрипт "${scriptName}" загружен`, 'success');
    }
}

// Очистка редактора
function clearEditor() {
    if (confirm('Очистить редактор кода?')) {
        document.getElementById('go-code').value = '';
        updateStats();
        localStorage.removeItem('go_editor_code');
        
        // Показываем заглушку в выводе
        const placeholder = document.querySelector('.output-placeholder');
        const outputContent = document.getElementById('output-content');
        
        if (placeholder && outputContent) {
            placeholder.style.display = 'block';
            outputContent.innerHTML = '';
            outputContent.appendChild(placeholder);
        }
    }
}

// Очистка вывода
function clearOutput() {
    const outputContent = document.getElementById('output-content');
    const placeholder = document.querySelector('.output-placeholder');
    
    if (!outputContent) return;
    
    outputContent.innerHTML = '';
    
    if (placeholder) {
        placeholder.style.display = 'block';
        outputContent.appendChild(placeholder);
    }
}

// Копирование вывода
function copyOutput() {
    const outputContent = document.getElementById('output-content');
    if (!outputContent) return;
    
    // Получаем текстовое содержимое
    const text = outputContent.innerText || outputContent.textContent;
    
    if (!text.trim()) {
        alert('Нет вывода для копирования');
        return;
    }
    
    // Копируем в буфер обмена
    navigator.clipboard.writeText(text).then(() => {
        // Показываем уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(70, 120, 70, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
        `;
        notification.textContent = 'Вывод скопирован в буфер обмена';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }).catch(err => {
        alert('Ошибка при копировании: ' + err);
    });
}

// Обновление статистики редактора
function updateStats() {
    const codeEditor = document.getElementById('go-code');
    const lineCountElement = document.getElementById('line-count');
    const charCountElement = document.getElementById('char-count');
    
    if (!codeEditor || !lineCountElement || !charCountElement) return;
    
    const text = codeEditor.value;
    const lines = text.split('\n').length;
    const characters = text.length;
    
    lineCountElement.textContent = `Строк: ${lines}`;
    charCountElement.textContent = `Символов: ${characters}`;
}

// Обновление списка скриптов (если добавим панель)
function updateScriptsList() {
    const scriptsList = document.getElementById('scripts-list');
    if (!scriptsList) return;
    
    const scripts = JSON.parse(localStorage.getItem('go_scripts') || '{}');
    const scriptNames = Object.keys(scripts);
    
    if (scriptNames.length === 0) {
        scriptsList.innerHTML = '<p class="no-scripts">Нет сохранённых скриптов</p>';
        return;
    }
    
    let html = '';
    scriptNames.forEach(name => {
        const script = scripts[name];
        const date = new Date(script.timestamp).toLocaleDateString('ru-RU');
        
        html += `
            <div class="script-list-item" data-name="${name}">
                <div>
                    <div class="script-name">${name}</div>
                    <div class="script-date">${date}</div>
                </div>
                <div class="script-actions">
                    <button class="action-btn load-script-btn" title="Загрузить">
                        <i class="fas fa-folder-open"></i>
                    </button>
                    <button class="action-btn delete-script-btn" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    scriptsList.innerHTML = html;
    
    // Добавляем обработчики для новых кнопок
    document.querySelectorAll('.load-script-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const scriptItem = this.closest('.script-list-item');
            const scriptName = scriptItem.getAttribute('data-name');
            loadScriptByName(scriptName);
        });
    });
    
    document.querySelectorAll('.delete-script-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const scriptItem = this.closest('.script-list-item');
            const scriptName = scriptItem.getAttribute('data-name');
            deleteScript(scriptName);
        });
    });
}

// Загрузка скрипта по имени
function loadScriptByName(scriptName) {
    const scripts = JSON.parse(localStorage.getItem('go_scripts') || '{}');
    const script = scripts[scriptName];
    
    if (script) {
        document.getElementById('go-code').value = script.code;
        updateStats();
        localStorage.setItem('go_editor_code', script.code);
        showOutput(`Скрипт "${scriptName}" загружен`, 'success');
    }
}

// Удаление скрипта
function deleteScript(scriptName) {
    if (confirm(`Удалить скрипт "${scriptName}"?`)) {
        const scripts = JSON.parse(localStorage.getItem('go_scripts') || '{}');
        delete scripts[scriptName];
        localStorage.setItem('go_scripts', JSON.stringify(scripts));
        updateScriptsList();
        showOutput(`Скрипт "${scriptName}" удалён`, 'success');
    }
}

// Проверка авторизации
function checkAuth() {
    const isLoggedIn = localStorage.getItem('portfolio_logged_in');
    
    if (!isLoggedIn) {
        // Если не авторизован, делаем редактор недоступным
        const codeEditor = document.getElementById('go-code');
        const runBtn = document.getElementById('run-code-btn');
        
        if (codeEditor) {
            codeEditor.disabled = true;
            codeEditor.placeholder = 'Для использования песочницы требуется авторизация';
        }
        
        if (runBtn) {
            runBtn.disabled = true;
            runBtn.title = 'Требуется авторизация';
        }
        
        showOutput('Для использования Go-песочницы необходимо войти в систему\n\nИспользуйте логин: admin, пароль: admin', 'error');
    }
}

// Восстановление сохранённой темы
window.addEventListener('load', function() {
    const savedTheme = localStorage.getItem('go_editor_theme') || 'default';
    const themeSelect = document.getElementById('theme-select');
    
    if (themeSelect) {
        themeSelect.value = savedTheme;
        applyTheme(savedTheme);
    }
});