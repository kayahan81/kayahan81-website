package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Формируем DSN строку
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		"localhost",
		"kayah",
		"81",
		"website_db",
		"5432",
		"disable",
	)

	// Подключение к базе данных
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Successfully connected to PostgreSQL database")

	// Создаём таблицы
	sql := `
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(100) UNIQUE NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			storage_used BIGINT DEFAULT 0,
			storage_quota BIGINT DEFAULT 5368709120,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS tasks (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL,
			title VARCHAR(255) NOT NULL,
			description TEXT,
			folder VARCHAR(100),
			deadline VARCHAR(20),
			priority VARCHAR(20) DEFAULT 'medium',
			completed BOOLEAN DEFAULT false,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS files (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL,
			filename VARCHAR(255) NOT NULL,
			filepath TEXT NOT NULL,
			size BIGINT NOT NULL,
			mime_type VARCHAR(100),
			folder VARCHAR(100),
			uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS scripts (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL,
			name VARCHAR(255),
			code TEXT,
			language VARCHAR(50) DEFAULT 'go',
			output TEXT,
			executed_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS shadowrun_entries (
			id SERIAL PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			category VARCHAR(100) NOT NULL,
			description TEXT,
			content TEXT,
			tags TEXT,
			views INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`

	if err := db.Exec(sql).Error; err != nil {
		log.Fatal("Failed to create tables:", err)
	}

	log.Println("Database tables created successfully")

	// Добавляем демо пользователя
	insertUserSQL := `
		INSERT INTO users (username, email, password, storage_used, storage_quota, created_at, updated_at) 
		VALUES ('admin', 'admin@portfolio.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, 5368709120, NOW(), NOW())
		ON CONFLICT (username) DO NOTHING;
	`

	if err := db.Exec(insertUserSQL).Error; err != nil {
		log.Fatal("Failed to insert admin user:", err)
	}

	log.Println("Demo user 'admin' created/verified (password: admin123)")
}
