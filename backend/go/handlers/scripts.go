package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"portfolio/database"
	"portfolio/middleware"
	"portfolio/models"
)

// Выполнение Go-скрипта
func RunScript(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req models.RunScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Эмуляция выполнения Go-кода
	output := emulateGoExecution(req.Code)
	now := time.Now()

	// Сохраняем результат выполнения
	script := models.Script{
		UserID:     user.ID,
		Name:       "Execution_" + now.Format("20060102_150405"),
		Code:       req.Code,
		Language:   req.Language,
		Output:     output,
		ExecutedAt: &now,
	}

	if err := database.DB.Create(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save execution result"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"output": output,
		"script": gin.H{
			"id":          script.ID,
			"name":        script.Name,
			"executed_at": script.ExecutedAt,
		},
	})
}

// Получение списка скриптов пользователя
func GetScripts(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var scripts []models.Script
	if err := database.DB.Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Find(&scripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get scripts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"scripts": scripts,
	})
}

// Сохранение скрипта
func SaveScript(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req models.SaveScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Сохраняем скрипт
	script := models.Script{
		UserID:   user.ID,
		Name:     req.Name,
		Code:     req.Code,
		Language: "go",
	}

	if err := database.DB.Create(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save script"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Script saved successfully",
		"script":  script,
	})
}

// Удаление скрипта
func DeleteScript(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	scriptID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid script ID"})
		return
	}

	var script models.Script
	if err := database.DB.Where("id = ? AND user_id = ?", scriptID, user.ID).
		First(&script).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Script not found"})
		return
	}

	if err := database.DB.Delete(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete script"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Script deleted successfully",
	})
}

// Эмуляция выполнения Go-кода
func emulateGoExecution(code string) string {
	// Простая эмуляция
	if len(code) < 10 {
		return "Error: Code is too short"
	}

	// Базовые проверки
	if !contains(code, "package main") {
		return "Compile error: missing 'package main'\nEvery Go program must start with package main"
	}

	if !contains(code, "func main()") {
		return "Compile error: missing 'func main()'\nNeed main function as entry point"
	}

	// Генерация "вывода" в зависимости от содержимого
	if contains(code, "fmt.Println(\"Hello") || contains(code, "fmt.Println(`Hello") {
		return `Hello, Shadowrun World!
Добро пожаловать в киберпанк 2077

Программа выполнена успешно.
Время выполнения: 125 мс
Память: 1.2 MB`
	}

	if contains(code, "fibonacci") || contains(code, "Fibonacci") {
		return `Числа Фибоначчи:
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
Время выполнения: 95 мс
Память: 1.5 MB`
	}

	// Общий ответ
	return `Код выполняется...

Вывод программы:
[Эмуляция выполнения Go-кода]

В реальной системе этот код был бы скомпилирован и выполнен.
В учебных целях используется эмуляция.

Программа выполнена успешно.
Время выполнения: 150 мс
Память: 1.8 MB`
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
