package models

import (
	"time"

	"gorm.io/gorm"
)

type Script struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     uint           `gorm:"not null" json:"user_id"`
	Name       string         `gorm:"size:255" json:"name"`
	Code       string         `gorm:"type:text" json:"code"`
	Language   string         `gorm:"size:50;default:'go'" json:"language"`
	Output     string         `gorm:"type:text" json:"output"`
	ExecutedAt *time.Time     `json:"executed_at,omitempty"` // Изменено на omitempty
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type RunScriptRequest struct {
	Code     string `json:"code" binding:"required"`
	Language string `json:"language" binding:"omitempty,oneof=go javascript python"`
}

type SaveScriptRequest struct {
	Name string `json:"name" binding:"required"`
	Code string `json:"code" binding:"required"`
}
