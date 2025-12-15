package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"portfolio/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RunScript - выполнение Go кода
func RunScript(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var input struct {
		Code     string `json:"code" binding:"required"`
		Language string `json:"language" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Сохраняем скрипт в историю
	script := models.Script{
		UserID:   userID,
		Name:     "Untitled",
		Code:     input.Code,
		Language: input.Language,
	}

	if err := db.Create(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save script"})
		return
	}

	// В реальной системе здесь был бы Docker или изолированная среда
	// Для демо используем эмуляцию выполнения
	output, err := emulateGoExecution(input.Code)

	// Обновляем скрипт с результатом
	now := time.Now()
	script.Output = output
	if err != nil {
		script.Output = "Error: " + err.Error()
	}
	script.ExecutedAt = &now // Исправлено: присваиваем указатель
	db.Save(&script)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success":   false,
			"error":     err.Error(),
			"output":    output,
			"script_id": script.ID,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"output":      output,
		"script_id":   script.ID,
		"executed_at": script.ExecutedAt.Format(time.RFC3339),
	})
}

// Эмуляция выполнения Go кода (для демо)
func emulateGoExecution(code string) (string, error) {
	// Внимание: В продакшене НЕ используйте этот подход!
	// Это только для демонстрации. В реальном проекте используйте Docker или изолированные среды.

	// Проверяем наличие package main
	if len(code) < 20 || !contains(code, "package main") {
		return "Error: code must contain 'package main'", fmt.Errorf("invalid go code")
	}

	// Проверяем наличие func main()
	if !contains(code, "func main()") {
		return "Error: code must contain 'func main()'", fmt.Errorf("invalid go code")
	}

	// Генерируем демо-вывод на основе содержимого кода
	if contains(code, "fmt.Println(\"Hello") || contains(code, "fmt.Println(`Hello") {
		return "Hello, Shadowrun World!\nДобро пожаловать в киберпанк 2077\n\nПрограмма выполнена успешно.", nil
	}

	if contains(code, "fibonacci") {
		return "Числа Фибоначчи:\nF(0) = 0\nF(1) = 1\nF(2) = 1\nF(3) = 2\nF(4) = 3\nF(5) = 5\n\nПрограмма выполнена успешно.", nil
	}

	return "Код выполнен успешно.\nОшибка вывода.", nil
}

// SaveScript - сохранение скрипта
func SaveScript(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var input struct {
		Name     string `json:"name" binding:"required"`
		Code     string `json:"code" binding:"required"`
		Language string `json:"language" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	script := models.Script{
		UserID:   userID,
		Name:     input.Name,
		Code:     input.Code,
		Language: input.Language,
	}

	if err := db.Create(&script).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save script"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Script saved successfully",
		"script":  script,
	})
}

// GetScripts - получение списка скриптов пользователя
func GetScripts(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var scripts []models.Script
	if err := db.Where("user_id = ?", userID).Order("created_at DESC").Find(&scripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scripts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"scripts": scripts,
		"count":   len(scripts),
	})
}

// GetScript - получение скрипта по ID
func GetScript(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var script models.Script
	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&script).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Script not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"script": script})
}

// DeleteScript - удаление скрипта
func DeleteScript(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result := db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Script{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete script"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Script not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Script deleted successfully"})
}

// Вспомогательная функция
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) &&
		(s[:len(substr)] == substr || contains(s[1:], substr)))
}
