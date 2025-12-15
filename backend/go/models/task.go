package models

import (
	"time"

	"gorm.io/gorm"
)

type Task struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null" json:"user_id"`
	Title       string         `gorm:"size:255;not null" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Folder      string         `gorm:"size:100;default:'general'" json:"folder"`
	Deadline    string         `gorm:"size:20" json:"deadline"`
	Priority    string         `gorm:"size:20;default:'medium'" json:"priority"`
	Completed   bool           `gorm:"default:false" json:"completed"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
