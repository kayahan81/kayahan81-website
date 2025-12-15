package database

import (
	"fmt"
	"log"
	"os"
	"time"
	
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	
	"portfolio-backend/models"
)

var DB *gorm.DB

func InitDB() error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)
	
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	
	log.Println("✅ Database connection established")
	
	// Автомиграция
	err = DB.AutoMigrate(
		&models.User{},
		&models.Task{},
		&models.File{},
		&models.Script{},
		&models.ShadowrunEntry{},
	)
	
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}
	
	log.Println("✅ Database migrated successfully")
	
	// Создаём демо-данные если их нет
	createDemoData()
	
	return nil
}

func createDemoData() {
	// Демо-данные для Shadowrun
	var count int64
	DB.Model(&models.ShadowrunEntry{}).Count(&count)
	
	if count == 0 {
		demoEntries := []models.ShadowrunEntry{
			{
				Title:       "Создание персонажа",
				Category:    "персонажи",
				Description: "Базовый процесс создания персонажа в Shadowrun 5e",
				Content:     `<h4>Основные шаги создания персонажа...</h4>`,
				Tags:        []string{"персонажи", "правила", "начало"},
			},
			{
				Title:       "Основные атрибуты",
				Category:    "персонажи",
				Description: "Базовые характеристики персонажа",
				Content:     `<h4>Шесть основных атрибутов...</h4>`,
				Tags:        []string{"персонажи", "атрибуты", "правила"},
			},
			{
				Title:       "Расы персонажей",
				Category:    "персонажи",
				Description: "Доступные расы в Shadowrun 5e",
				Content:     `<h4>Пять основных рас...</h4>`,
				Tags:        []string{"персонажи", "расы"},
			},
		}
		
		for _, entry := range demoEntries {
			DB.Create(&entry)
		}
		
		log.Println("✅ Demo data created for Shadowrun")
	}
	
	// Создаём тестового пользователя если его нет
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	
	if userCount == 0 {
		hashedPassword, _ := HashPassword("admin123")
		demoUser := models.User{
			Username: "admin",
			Password: hashedPassword,
			Email:    "admin@portfolio.local",
		}
		DB.Create(&demoUser)
		
		// Создаём демо-задачи
		demoTasks := []models.Task{
			{
				UserID:      demoUser.ID,
				Title:       "Выполнить задание №23",
				Description: "Решить задачи по математическому анализу",
				Folder:      "Математика",
				Priority:    "high",
			},
			{
				UserID:      demoUser.ID,
				Title:       "Сделать презентацию проекта",
				Description: "Подготовить слайды для отчёта",
				Folder:      "Работа",
				Priority:    "medium",
			},
		}
		
		for _, task := range demoTasks {
			DB.Create(&task)
		}
		
		log.Println("✅ Demo user and tasks created")
	}
}

// Хеширование пароля
func HashPassword(password string) (string, error) {
	// Временно возвращаем пароль как есть
	// В реальном приложении используйте bcrypt
	return password, nil
}

// Проверка пароля
func CheckPassword(password, hash string) bool {
	// Временно сравниваем как есть
	return password == hash
}

// Получение пользователя по ID
func GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := DB.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// Получение пользователя по имени
func GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	if err := DB.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}