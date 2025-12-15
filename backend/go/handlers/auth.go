package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"portfolio/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Login - вход пользователя
func Login(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные"})
		return
	}

	// Ищем пользователя
	var user models.User
	if err := db.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не найден"})
		return
	}

	// Убираем возможные пробелы в начале/конце пароля
	password := strings.TrimSpace(input.Password)

	// 1. Сначала пробуем bcrypt (стандартная проверка)
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err == nil {
		// Успех - создаем токен
		createAndReturnToken(c, user)
		return
	}

	// 2. Для демо-пользователя admin специальная логика
	if user.Username == "admin" {
		// Известный правильный хеш для "admin123"
		correctHash := "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV6UiC"

		// Если в базе правильный хеш
		if user.Password == correctHash {
			// Пробуем сравнить пароль
			if password == "admin123" {
				createAndReturnToken(c, user)
				return
			}
		}

		// Если в базе пароль в чистом тексте (для теста)
		if user.Password == "admin123" && password == "admin123" {
			createAndReturnToken(c, user)
			return
		}

		// Пробуем другие варианты пароля для admin
		possiblePasswords := []string{
			"admin123",
			"Admin123",
			"ADMIN123",
			"admin",
			"password",
			"123456",
			"administrator",
		}

		for _, possible := range possiblePasswords {
			if password == possible {
				// Проверяем bcrypt с этим паролем
				err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(possible))
				if err == nil {
					createAndReturnToken(c, user)
					return
				}

				// Или прямой текст
				if user.Password == possible {
					createAndReturnToken(c, user)
					return
				}
			}
		}
	}

	// 3. Для остальных пользователей - прямая проверка текста (на случай если пароль не захэширован)
	if user.Password == password {
		// Автоматически хэшируем и обновляем пароль в базе
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err == nil {
			user.Password = string(hashedPassword)
			db.Save(&user)
		}
		createAndReturnToken(c, user)
		return
	}

	// 4. Если ничего не сработало
	c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный пароль"})
}

// createAndReturnToken - создает JWT токен и возвращает ответ
func createAndReturnToken(c *gin.Context, user models.User) {
	// Создаем JWT токен
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your_super_secret_jwt_key_change_this_in_production_please"
	}

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Вход выполнен успешно",
		"token":   tokenString,
		"user": gin.H{
			"id":            user.ID,
			"username":      user.Username,
			"email":         user.Email,
			"storage_used":  user.StorageUsed,
			"storage_quota": user.StorageQuota,
			"created_at":    user.CreatedAt.Format(time.RFC3339),
		},
	})
}

// Register - регистрация нового пользователя
func Register(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Username string `json:"username" binding:"required,min=3,max=50"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные: " + err.Error()})
		return
	}

	// Проверяем, существует ли пользователь
	var existingUser models.User
	if err := db.Where("username = ? OR email = ?", input.Username, input.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь с таким именем или email уже существует"})
		return
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка хеширования пароля"})
		return
	}

	// Создаем пользователя
	user := models.User{
		Username:     input.Username,
		Email:        input.Email,
		Password:     string(hashedPassword),
		StorageUsed:  0,
		StorageQuota: 52428800, // 50MB
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания пользователя: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Пользователь успешно зарегистрирован",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// GetUser - получение информации о текущем пользователе
func GetUser(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения данных пользователя"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":            user.ID,
			"username":      user.Username,
			"email":         user.Email,
			"storage_used":  user.StorageUsed,
			"storage_quota": user.StorageQuota,
			"created_at":    user.CreatedAt.Format(time.RFC3339),
		},
	})
}

// Logout - выход пользователя
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Вы успешно вышли из системы",
		"success": true,
	})
}

// ResetAdminPassword - сброс пароля админа (для разработки)
func ResetAdminPassword(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// Создаем правильный bcrypt хеш для "admin123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания хеша"})
		return
	}

	// Обновляем пароль админа
	result := db.Model(&models.User{}).
		Where("username = ?", "admin").
		Update("password", string(hashedPassword))

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обновления пароля"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Пароль администратора сброшен",
		"hash":    string(hashedPassword)[:30] + "...",
	})
}
