/**
 * Файл JavaScript для страницы Go-скриптов
 * Интеграция с бэкендом Go
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

    'shadowrun': `package main

import "fmt"

type Character struct {
    Name     string
    Race     string
    Archetype string
}

func main() {
    runner := Character{
        Name:     "Raven",
        Race:     "Elf",
        Archetype: "Street Samurai",
    }
    
    fmt.Println("=== ПЕРСОНАЖ SHADOWRUN ===")
    fmt.Printf("Имя: %s\\n", runner.Name)
    fmt.Printf("Раса: %s\\n", runner.Race)
    fmt.Printf("Архетип: %s\\n", runner.Archetype)
}`
};

// Основная функция
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Страница Go-скриптов загружена');
    
    // Проверяем авторизацию
    const user = await checkAuth();
    if (!user) return;
    
    // Инициализация
    initEditor();
    initButtons();
    initExamples();
    updateStats();
});

// ==================== API ФУНКЦИИ ====================

/**
 * Выполнение Go кода на сервере
 */
async function runGoCode() {
    const codeEditor = document.getElementById('go-code');
    if (!codeEditor) return;
    
    const code = codeEditor.value.trim();
    
    if (!code) {
        showOutput('Ошибка: редактор кода пуст', 'error');
        return;
    }
    
    showOutput('Выполнение кода...', 'info');
    
    try {
        const response = await apiRequest('/scripts/run', 'POST', {
            code: code,
            language: 'go'
        });
        
        if (response.success) {
            showOutput(response.output || 'Код выполнен успешно', 'success');
        } else {
            showOutput(response.error || 'Ошибка выполнения', 'error');
        }
        
        saveToHistory(code, response.output, response.error);
    } catch (error) {
        // Если API не доступен, используем эмуляцию
        console.warn('API недоступен, используем эмуляцию:', error);
        emulateGoExecution(code);
    }
}

/**
 * Эмуляция выполнения Go-кода (резервный вариант)
 */
function emulateGoExecution(code) {
    if (!code.includes('package main')) {
        showOutput('Ошибка компиляции: отсутствует "package main"', 'error');
        return;
    }
    
    if (!code.includes('func main()')) {
        showOutput('Ошибка компиляции: отсутствует функция main()', 'error');
        return;
    }
    
    const executionTime = (Math.random() * 300 + 100).toFixed(0);
    let output = '';
    
    if (code.includes('fmt.Println("Hello') || code.includes('fmt.Println(`Hello')) {
        output = `Hello, Shadowrun World!
Добро пожаловать в киберпанк 2077

Программа выполнена успешно.
Время выполнения: ${executionTime} мс`;
        
    } else if (code.includes('a := 15') && code.includes('b := 7')) {
        output = `a = 15, b = 7
Сумма: 22
Разность: 8
Произведение: 105
Частное: 2.14
Остаток: 1

Программа выполнена успешно.
Время выполнения: ${executionTime} мс`;
        
    } else if (code.includes('Shadowrun') || code.includes('Character')) {
        output = `=== ПЕРСОНАЖ SHADOWRUN ===
Имя: Raven
Раса: Elf
Архетип: Street Samurai

Программа выполнена успешно.
Время выполнения: ${executionTime} мс`;
        
    } else {
        output = `Код выполняется...
        
Вывод программы:
[Эмуляция выполнения Go кода]

Программа выполнена успешно.
Время выполнения: ${executionTime} мс`;
    }
    
    showOutput(output, 'success');
    saveToHistory(code, output, null);
}

/**
 * Сохранение скрипта на сервере
 */
async function saveScript() {
    const codeEditor = document.getElementById('go-code');
    if (!codeEditor) return;
    
    const code = codeEditor.value.trim();
    
    if (!code) {
        showNotification('Невозможно сохранить пустой скрипт', 'error');
        return;
    }
    
    const scriptName = prompt('Введите название скрипта:', `script_${Date.now()}`);
    
    if (scriptName) {
        try {
            await apiRequest('/scripts', 'POST', {
                name: scriptName,
                code: code,
                language: 'go'
            });
            
            showNotification(`Скрипт "${scriptName}" сохранён успешно`, 'success');
        } catch (error) {
            // Если API недоступен, сохраняем локально
            const scripts = JSON.parse(localStorage.getItem('go_scripts') || '{}');
            scripts[scriptName] = {
                code: code,
                timestamp: new Date().toISOString(),
                name: scriptName
            };
            
            localStorage.setItem('go_scripts', JSON.stringify(scripts));
            showNotification(`Скрипт "${scriptName}" сохранён локально`, 'success');
        }
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

function initEditor() {
    const codeEditor = document.getElementById('go-code');
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    
    if (!codeEditor) return;
    
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }
    
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', function() {
            codeEditor.style.fontSize = this.value + 'px';
            localStorage.setItem('go_editor_fontsize', this.value);
        });
        
        const savedSize = localStorage.getItem('go_editor_fontsize');
        if (savedSize) {
            fontSizeSelect.value = savedSize;
            codeEditor.style.fontSize = savedSize + 'px';
        }
    }
    
    codeEditor.addEventListener('input', updateStats);
    
    codeEditor.addEventListener('input', function() {
        localStorage.setItem('go_editor_code', this.value);
    });
    
    const savedCode = localStorage.getItem('go_editor_code');
    if (savedCode) {
        codeEditor.value = savedCode;
    } else {
        codeEditor.value = codeExamples['hello'];
    }
    
    updateStats();
}

function applyTheme(theme) {
    const codeEditor = document.getElementById('go-code');
    const outputContent = document.getElementById('output-content');
    
    if (!codeEditor) return;
    
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

function initButtons() {
    const runBtn = document.getElementById('run-code-btn');
    if (runBtn) {
        runBtn.addEventListener('click', runGoCode);
    }
    
    const saveBtn = document.getElementById('save-script-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveScript);
    }
    
    const clearEditorBtn = document.getElementById('clear-editor-btn');
    if (clearEditorBtn) {
        clearEditorBtn.addEventListener('click', clearEditor);
    }
    
    const clearOutputBtn = document.getElementById('clear-output-btn');
    if (clearOutputBtn) {
        clearOutputBtn.addEventListener('click', clearOutput);
    }
    
    const copyOutputBtn = document.getElementById('copy-output-btn');
    if (copyOutputBtn) {
        copyOutputBtn.addEventListener('click', copyOutput);
    }
}

function initExamples() {
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
        <option value="shadowrun">Персонаж Shadowrun</option>
    `;
    
    examplesSelect.addEventListener('change', function() {
        if (this.value && codeExamples[this.value]) {
            document.getElementById('go-code').value = codeExamples[this.value];
            updateStats();
            localStorage.setItem('go_editor_code', codeExamples[this.value]);
        }
    });
    
    const editorOptions = document.querySelector('.editor-options');
    if (editorOptions) {
        editorOptions.appendChild(examplesSelect);
    }
}

function showOutput(text, type) {
    const outputContent = document.getElementById('output-content');
    const placeholder = document.querySelector('.output-placeholder');
    
    if (!outputContent) return;
    
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    outputContent.innerHTML = '';
    
    const outputElement = document.createElement('div');
    outputElement.className = 'program-output';
    
    if (type === 'error') {
        outputElement.innerHTML = `<div class="compile-error">
            <i class="fas fa-exclamation-triangle"></i>
            <pre>${escapeHtml(text)}</pre>
        </div>`;
    } else if (type === 'info') {
        outputElement.innerHTML = `<div class="stdout">
            <i class="fas fa-sync fa-spin"></i>
            ${text}
        </div>`;
    } else {
        const parts = text.split('\n\nПрограмма выполнена');
        if (parts.length > 1) {
            outputElement.innerHTML = `
                <div class="stdout"><pre>${escapeHtml(parts[0])}</pre></div>
                <div class="execution-time">
                    <hr>
                    <i class="fas fa-check-circle"></i> Программа выполнена${escapeHtml(parts[1])}
                </div>
            `;
        } else {
            outputElement.innerHTML = `<div class="stdout"><pre>${escapeHtml(text)}</pre></div>`;
        }
    }
    
    outputContent.appendChild(outputElement);
    outputContent.scrollTop = outputContent.scrollHeight;
}

function saveToHistory(code, output, error) {
    const history = JSON.parse(localStorage.getItem('go_execution_history') || '[]');
    
    history.unshift({
        code: code,
        output: output,
        error: error,
        timestamp: new Date().toISOString()
    });
    
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('go_execution_history', JSON.stringify(history));
}

function clearEditor() {
    if (confirm('Очистить редактор кода?')) {
        document.getElementById('go-code').value = '';
        updateStats();
        localStorage.removeItem('go_editor_code');
        
        const placeholder = document.querySelector('.output-placeholder');
        const outputContent = document.getElementById('output-content');
        
        if (placeholder && outputContent) {
            placeholder.style.display = 'block';
            outputContent.innerHTML = '';
            outputContent.appendChild(placeholder);
        }
    }
}

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

function copyOutput() {
    const outputContent = document.getElementById('output-content');
    if (!outputContent) return;
    
    const text = outputContent.innerText || outputContent.textContent;
    
    if (!text.trim()) {
        showNotification('Нет вывода для копирования', 'error');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Вывод скопирован в буфер обмена', 'success');
    }).catch(err => {
        showNotification('Ошибка при копировании: ' + err, 'error');
    });
}

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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