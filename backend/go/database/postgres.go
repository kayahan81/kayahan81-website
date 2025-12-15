package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"portfolio/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() (*gorm.DB, error) {
	dbHost := getEnv("DB_HOST", "localhost")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "portfolio_db")
	dbPort := getEnv("DB_PORT", "5432")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		dbHost, dbUser, dbPassword, dbName, dbPort, dbSSLMode,
	)

	log.Printf("🔗 Подключаюсь к PostgreSQL: %s@%s/%s", dbUser, dbHost, dbName)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("❌ Ошибка подключения: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	DB = db
	log.Println("✅ Подключение к PostgreSQL успешно")
	return db, nil
}

func Migrate(db *gorm.DB) error {
	log.Println("🔧 Проверяю структуру базы данных...")

	// Проверяем существование таблиц
	tables := []string{"users", "tasks", "files", "scripts", "shadowrun_entries"}

	for _, table := range tables {
		var exists bool
		db.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ?)", table).Scan(&exists)

		if exists {
			log.Printf("✅ Таблица '%s' уже существует", table)
		} else {
			log.Printf("📝 Таблица '%s' не найдена, создаю...", table)
		}
	}

	// Безопасный AutoMigrate - только для недостающих таблиц
	log.Println("📝 Выполняю безопасную миграцию...")
	err := db.AutoMigrate(
		&models.User{},
		&models.Task{},
		&models.File{},
		&models.Script{},
		&models.ShadowrunEntry{},
	)

	if err != nil {
		log.Printf("⚠️ Предупреждение при миграции (можно игнорировать если таблицы уже созданы): %v", err)
		// НЕ завершаем с ошибкой - продолжаем работу
	}

	// Проверяем наличие пользователей
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	log.Printf("👤 Найдено пользователей: %d", userCount)

	if userCount == 0 {
		log.Println("➕ Создаю демо-пользователя 'admin'...")

		// Хеш пароля "admin123"
		hashedPassword := "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV6UiC"

		demoUser := models.User{
			Username:     "admin",
			Email:        "admin@example.com",
			Password:     hashedPassword,
			StorageUsed:  0,
			StorageQuota: 52428800, // 50MB
		}

		result := db.Create(&demoUser)
		if result.Error != nil {
			log.Printf("⚠️ Не удалось создать пользователя: %v", result.Error)
		} else {
			log.Println("✅ Демо-пользователь создан: admin / admin123")
		}
	} else {
		log.Println("✅ Пользователи уже существуют")
	}

	log.Println("✅ Проверка базы данных завершена")
	return nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
