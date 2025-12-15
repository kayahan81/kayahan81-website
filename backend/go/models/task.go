package models

import (
	"time"

	"gorm.io/gorm"
)

type Task struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"not null"`
	Title       string         `json:"title" gorm:"not null"`
	Description string         `json:"description"`
	Folder      string         `json:"folder" gorm:"default:'Общее'"`
	Deadline    *time.Time     `json:"deadline"`
	Priority    string         `json:"priority" gorm:"default:'medium'"`
	Completed   bool           `json:"completed" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type TaskRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	Folder      string     `json:"folder"`
	Deadline    *time.Time `json:"deadline"`
	Priority    string     `json:"priority"`
	Completed   bool       `json:"completed"`
}
