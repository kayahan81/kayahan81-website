package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/kayahan81/kayahan81-website/backend/go/models"
)

var DB *gorm.DB

func InitDB() error {
	// Формируем строку подключения
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

	// Автомиграция моделей
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

	log.Println("✅ Database tables created")

	// Создаём демо-данные если база пуста
	createDemoData()

	return nil
}

func CloseDB() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Println("Error getting database instance:", err)
		return
	}
	sqlDB.Close()
}

func createDemoData() {
	// Проверяем, есть ли пользователи
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)

	if userCount == 0 {
		// Создаём тестового пользователя
		demoUser := models.User{
			Username: "admin",
			Password: "admin123", // В реальном приложении должен быть хеш!
			Email:    "admin@portfolio.local",
		}
		DB.Create(&demoUser)

		// Создаём демо-задачи
		tomorrow := time.Now().Add(24 * time.Hour)
		demoTasks := []models.Task{
			{
				UserID:      demoUser.ID,
				Title:       "Выполнить задание №23",
				Description: "Решить задачи по математическому анализу",
				Folder:      "Математика",
				Priority:    "high",
				Deadline:    &tomorrow,
			},
			{
				UserID:      demoUser.ID,
				Title:       "Сделать презентацию проекта",
				Description: "Подготовить слайды для отчёта",
				Folder:      "Работа",
				Priority:    "medium",
				Completed:   true,
			},
		}

		for _, task := range demoTasks {
			DB.Create(&task)
		}

		// Создаём демо-записи Shadowrun
		demoShadowrun := []models.ShadowrunEntry{
			{
				Title:       "Создание персонажа",
				Category:    "персонажи",
				Description: "Базовый процесс создания персонажа в Shadowrun 5e",
				Content:     `<h4>Основные шаги создания персонажа:</h4><ol><li>Выбор концепции</li><li>Выбор расы</li><li>Распределение приоритетов</li></ol>`,
				Tags:        `["персонажи", "правила", "начало"]`,
			},
			{
				Title:       "Основные атрибуты",
				Category:    "персонажи",
				Description: "Базовые характеристики персонажа",
				Content:     `<h4>Шесть основных атрибутов:</h4><table><tr><th>Атрибут</th><th>Описание</th></tr><tr><td>BOD</td><td>Телосложение</td></tr></table>`,
				Tags:        `["персонажи", "атрибуты"]`,
			},
		}

		for _, entry := range demoShadowrun {
			DB.Create(&entry)
		}

		log.Println("✅ Demo data created: admin/admin123, tasks, shadowrun entries")
	}
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
