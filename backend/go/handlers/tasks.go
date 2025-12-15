package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"portfolio/database"
	"portfolio/middleware"
	"portfolio/models"
)

// Получение всех задач пользователя
func GetTasks(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Параметры фильтрации
	completed := c.Query("completed")
	folder := c.Query("folder")

	var tasks []models.Task
	query := database.DB.Where("user_id = ?", user.ID)

	if completed != "" {
		if completed == "true" {
			query = query.Where("completed = ?", true)
		} else if completed == "false" {
			query = query.Where("completed = ?", false)
		}
	}

	if folder != "" {
		query = query.Where("folder = ?", folder)
	}

	// Сортировка
	sortBy := c.DefaultQuery("sort", "deadline")
	switch sortBy {
	case "title":
		query = query.Order("title")
	case "created":
		query = query.Order("created_at DESC")
	case "priority":
		query = query.Order("CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END")
	default:
		query = query.Order("deadline ASC, created_at DESC")
	}

	if err := query.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tasks"})
		return
	}

	// Статистика
	var total, completedCount, overdueCount int64
	database.DB.Model(&models.Task{}).
		Where("user_id = ?", user.ID).
		Count(&total)

	database.DB.Model(&models.Task{}).
		Where("user_id = ? AND completed = ?", user.ID, true).
		Count(&completedCount)

	// Подсчёт просроченных задач
	// database.DB.Model(&models.Task{}).
	// 	Where("user_id = ? AND completed = ? AND deadline < ?",
	// 		user.ID, false, time.Now()).
	// 	Count(&overdueCount)

	c.JSON(http.StatusOK, gin.H{
		"tasks": tasks,
		"stats": gin.H{
			"total":     total,
			"completed": completedCount,
			"overdue":   overdueCount,
			"pending":   total - completedCount,
		},
	})
}

// Создание новой задачи
func CreateTask(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req models.TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Создаём задачу
	task := models.Task{
		UserID:      user.ID,
		Title:       req.Title,
		Description: req.Description,
		Folder:      req.Folder,
		Deadline:    req.Deadline,
		Priority:    req.Priority,
		Completed:   req.Completed,
	}

	if err := database.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Task created successfully",
		"task":    task,
	})
}

// Обновление задачи
func UpdateTask(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Проверяем, существует ли задача и принадлежит ли пользователю
	var task models.Task
	if err := database.DB.Where("id = ? AND user_id = ?", taskID, user.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	var req models.TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Обновляем задачу
	updates := map[string]interface{}{
		"title":       req.Title,
		"description": req.Description,
		"folder":      req.Folder,
		"deadline":    req.Deadline,
		"priority":    req.Priority,
		"completed":   req.Completed,
	}

	if err := database.DB.Model(&task).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	// Получаем обновлённую задачу
	database.DB.First(&task, taskID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Task updated successfully",
		"task":    task,
	})
}

// Удаление задачи
func DeleteTask(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Проверяем существование задачи
	var task models.Task
	if err := database.DB.Where("id = ? AND user_id = ?", taskID, user.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Удаляем задачу
	if err := database.DB.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Task deleted successfully",
	})
}

// Получение списка папок с задачами
func GetTaskFolders(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	type FolderStats struct {
		Folder     string
		Total      int64
		Completed  int64
		Pending    int64
		HasOverdue bool
	}

	var folders []string
	database.DB.Model(&models.Task{}).
		Where("user_id = ?", user.ID).
		Distinct().
		Pluck("folder", &folders)

	var folderStats []FolderStats
	for _, folder := range folders {
		var total, completed int64

		database.DB.Model(&models.Task{}).
			Where("user_id = ? AND folder = ?", user.ID, folder).
			Count(&total)

		database.DB.Model(&models.Task{}).
			Where("user_id = ? AND folder = ? AND completed = ?",
				user.ID, folder, true).
			Count(&completed)

		folderStats = append(folderStats, FolderStats{
			Folder:    folder,
			Total:     total,
			Completed: completed,
			Pending:   total - completed,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"folders": folderStats,
	})
}
