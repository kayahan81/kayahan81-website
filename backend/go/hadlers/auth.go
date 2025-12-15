package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kayahan81/kayahan81-website/backend/go/database"
	"github.com/kayahan81/kayahan81-website/backend/go/middleware"
	"github.com/kayahan81/kayahan81-website/backend/go/models"
)

func Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Получаем пользователя
	user, err := database.GetUserByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Проверяем пароль (в демо - простое сравнение)
	if req.Password != user.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Генерируем токен
	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Формируем ответ
	userResponse := models.UserResponse{
		ID:           user.ID,
		Username:     user.Username,
		Email:        user.Email,
		StorageUsed:  user.StorageUsed,
		StorageQuota: 5 * 1024 * 1024 * 1024, // 5GB
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

	// Проверяем, существует ли пользователь
	existingUser, _ := database.GetUserByUsername(req.Username)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Создаём пользователя
	user := models.User{
		Username: req.Username,
		Password: req.Password, // В реальном приложении нужен хеш!
		Email:    req.Email,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Генерируем токен
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
	// В JWT-based аутентификации логаут делается на клиенте
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
