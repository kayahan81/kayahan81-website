package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"portfolio/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetTasks - получение списка задач пользователя
func GetTasks(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var tasks []models.Task
	if err := db.Where("user_id = ?", userID).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks": tasks,
		"count": len(tasks),
	})
}

// GetTask - получение задачи по ID
func GetTask(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"task": task})
}

// CreateTask - создание новой задачи
func CreateTask(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var input struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Folder      string `json:"folder"`
		Deadline    string `json:"deadline"`
		Priority    string `json:"priority"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Устанавливаем значения по умолчанию
	if input.Folder == "" {
		input.Folder = "general"
	}
	if input.Priority == "" {
		input.Priority = "medium"
	}

	task := models.Task{
		UserID:      userID,
		Title:       input.Title,
		Description: input.Description,
		Folder:      input.Folder,
		Deadline:    input.Deadline,
		Priority:    input.Priority,
		Completed:   false,
	}

	if err := db.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Task created successfully",
		"task":    task,
	})
}

// UpdateTask - обновление задачи
func UpdateTask(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Folder      string `json:"folder"`
		Deadline    string `json:"deadline"`
		Priority    string `json:"priority"`
		Completed   *bool  `json:"completed"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var task models.Task
	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Обновляем поля
	if input.Title != "" {
		task.Title = input.Title
	}
	if input.Description != "" {
		task.Description = input.Description
	}
	if input.Folder != "" {
		task.Folder = input.Folder
	}
	if input.Deadline != "" {
		task.Deadline = input.Deadline
	}
	if input.Priority != "" {
		task.Priority = input.Priority
	}
	if input.Completed != nil {
		task.Completed = *input.Completed
	}

	if err := db.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Task updated successfully",
		"task":    task,
	})
}

// UpdateTaskStatus - обновление статуса задачи
func UpdateTaskStatus(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var input struct {
		Completed bool `json:"completed" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var task models.Task
	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	task.Completed = input.Completed
	if err := db.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Task status updated successfully",
		"task":    task,
	})
}

// DeleteTask - удаление задачи
func DeleteTask(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	result := db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Task{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// GetFolders - получение списка папок пользователя
func GetFolders(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var folders []string
	if err := db.Model(&models.Task{}).
		Where("user_id = ?", userID).
		Distinct("folder").
		Pluck("folder", &folders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения папок"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"folders": folders,
		"count":   len(folders),
	})
}

// CreateFolder - создание новой папки
func CreateFolder(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный запрос"})
		return
	}

	// Проверяем, существует ли уже такая папка
	var count int64
	db.Model(&models.Task{}).
		Where("user_id = ? AND folder = ?", userID, input.Name).
		Count(&count)

	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Папка уже существует"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Папка '%s' создана", input.Name),
		"folder":  input.Name,
	})
}
