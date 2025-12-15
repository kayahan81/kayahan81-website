package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"portfolio/database"
	"portfolio/middleware"
	"portfolio/models"
)

// ==================== АУТЕНТИФИКАЦИЯ ====================

func Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	user, err := database.GetUserByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if req.Password != user.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	userResponse := models.UserResponse{
		ID:           user.ID,
		Username:     user.Username,
		Email:        user.Email,
		StorageUsed:  user.StorageUsed,
		StorageQuota: 5 * 1024 * 1024 * 1024,
		CreatedAt:    user.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user":    userResponse,
	})
}

func Register(c *gin.Context) {
	var req models.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existingUser, _ := database.GetUserByUsername(req.Username)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	user := models.User{
		Username: req.Username,
		Password: req.Password,
		Email:    req.Email,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	userResponse := models.UserResponse{
		ID:           user.ID,
		Username:     user.Username,
		Email:        user.Email,
		StorageUsed:  0,
		StorageQuota: 5 * 1024 * 1024 * 1024,
		CreatedAt:    user.CreatedAt,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"token":   token,
		"user":    userResponse,
	})
}

func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}

func GetUserInfo(c *gin.Context) {
	userValue, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	user := userValue.(*models.User)
	userResponse := models.UserResponse{
		ID:           user.ID,
		Username:     user.Username,
		Email:        user.Email,
		StorageUsed:  user.StorageUsed,
		StorageQuota: 5 * 1024 * 1024 * 1024,
		CreatedAt:    user.CreatedAt,
	}

	c.JSON(http.StatusOK, userResponse)
}

// ==================== ЗАДАЧИ ====================

func GetTasks(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	var tasks []models.Task
	if err := database.DB.Where("user_id = ?", user.ID).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func CreateTask(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	var req models.TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	c.JSON(http.StatusCreated, task)
}

func UpdateTask(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	id := c.Param("id")

	var req models.TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var task models.Task
	if err := database.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Обновляем поля
	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Folder != "" {
		task.Folder = req.Folder
	}
	if req.Deadline != nil {
		task.Deadline = req.Deadline
	}
	if req.Priority != "" {
		task.Priority = req.Priority
	}
	task.Completed = req.Completed

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	c.JSON(http.StatusOK, task)
}

func DeleteTask(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	id := c.Param("id")

	if err := database.DB.Where("id = ? AND user_id = ?", id, user.ID).Delete(&models.Task{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// ==================== ФАЙЛЫ ====================

func GetFiles(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	var files []models.File
	if err := database.DB.Where("user_id = ?", user.ID).Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch files"})
		return
	}

	// Конвертируем в response
	var response []models.FileResponse
	for _, file := range files {
		response = append(response, models.FileResponse{
			ID:         file.ID,
			Filename:   file.Filename,
			Size:       file.Size,
			SizeHuman:  file.GetSizeHuman(),
			MimeType:   file.MimeType,
			Folder:     file.Folder,
			UploadedAt: file.UploadedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

func UploadFile(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	c.JSON(http.StatusOK, gin.H{
		"message": "File upload endpoint - TODO",
		"user_id": user.ID,
	})
}

func DeleteFile(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": "File delete endpoint - TODO",
		"file_id": id,
	})
}

func DownloadFile(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": "File download endpoint - TODO",
		"file_id": id,
	})
}

// ==================== GO-СКРИПТЫ ====================

func RunScript(c *gin.Context) {
	var req models.RunScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Эмуляция выполнения Go-кода
	output := "✅ Код выполнен успешно!\nЭто эмуляция выполнения Go-кода.\n\n"
	output += "Ваш код:\n```go\n" + req.Code + "\n```\n\n"
	output += "В реальном приложении здесь был бы вывод программы."

	c.JSON(http.StatusOK, gin.H{
		"output":         output,
		"success":        true,
		"execution_time": "0.5s",
	})
}

func GetScripts(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	var scripts []models.Script
	if err := database.DB.Where("user_id = ?", user.ID).Find(&scripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scripts"})
		return
	}

	c.JSON(http.StatusOK, scripts)
}

func SaveScript(c *gin.Context) {
	userValue, _ := c.Get("user")
	user := userValue.(*models.User)

	var req models.SaveScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	c.JSON(http.StatusCreated, script)
}

func DeleteScript(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Script{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete script"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Script deleted successfully"})
}

// ==================== SHADOWRUN ====================

func SearchShadowrun(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := database.DB.Model(&models.ShadowrunEntry{})

	if req.Query != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?",
			"%"+req.Query+"%", "%"+req.Query+"%")
	}

	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}

	if req.Limit == 0 {
		req.Limit = 20
	}

	var entries []models.ShadowrunEntry
	if err := query.Limit(req.Limit).Offset(req.Offset).Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search entries"})
		return
	}

	c.JSON(http.StatusOK, entries)
}

func GetShadowrunEntry(c *gin.Context) {
	id := c.Param("id")

	var entry models.ShadowrunEntry
	if err := database.DB.First(&entry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Entry not found"})
		return
	}

	// Увеличиваем счётчик просмотров
	database.DB.Model(&entry).Update("views", entry.Views+1)

	c.JSON(http.StatusOK, entry)
}

func GetCategories(c *gin.Context) {
	var categories []string
	if err := database.DB.Model(&models.ShadowrunEntry{}).
		Distinct().Pluck("category", &categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}
