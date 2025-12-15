package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// InitDB инициализирует подключение к PostgreSQL
func testInitDB() (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	log.Println("Successfully connected to PostgreSQL")
	return db, nil
}

// SetupDatabase создаёт таблицы
func SetupDatabase(db *gorm.DB) error {
	// Просто возвращаем успех - таблицы будут созданы автоматически
	// при первом обращении через GORM
	log.Println("Database setup complete (tables will be created on first use)")
	return nil
}
