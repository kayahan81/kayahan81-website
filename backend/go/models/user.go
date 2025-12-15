package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"size:100;uniqueIndex;not null" json:"username"`
	Email        string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Password     string         `gorm:"size:255;not null" json:"-"`
	StorageUsed  int64          `gorm:"default:0" json:"storage_used"`
	StorageQuota int64          `gorm:"default:52428800" json:"storage_quota"` // 50MB = 50 * 1024 * 1024
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Связи
	Tasks   []Task   `gorm:"foreignKey:UserID" json:"tasks,omitempty"`
	Files   []File   `gorm:"foreignKey:UserID" json:"files,omitempty"`
	Scripts []Script `gorm:"foreignKey:UserID" json:"scripts,omitempty"`
}
