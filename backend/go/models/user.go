package models

import (
	"time"
	
	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"unique;not null"`
	Password  string         `json:"-" gorm:"not null"` // Хеш пароля
	Email     string         `json:"email" gorm:"unique"`
	StorageUsed int64        `json:"storage_used" gorm:"default:0"` // В байтах
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Связи
	Files []File            `json:"files,omitempty" gorm:"foreignKey:UserID"`
	Tasks []Task            `json:"tasks,omitempty" gorm:"foreignKey:UserID"`
	Scripts []Script        `json:"scripts,omitempty" gorm:"foreignKey:UserID"`
}

// DTO для регистрации
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Email    string `json:"email" binding:"required,email"`
}

// DTO для входа
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// DTO для ответа с пользователем
type UserResponse struct {
	ID         uint      `json:"id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	StorageUsed int64    `json:"storage_used"`
	StorageQuota int64   `json:"storage_quota"`
	CreatedAt  time.Time `json:"created_at"`
}