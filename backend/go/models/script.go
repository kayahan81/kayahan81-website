package models

import (
	"time"

	"gorm.io/gorm"
)

type Script struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	UserID     uint           `json:"user_id" gorm:"not null"`
	Name       string         `json:"name" gorm:"not null"`
	Code       string         `json:"code" gorm:"type:text;not null"`
	Language   string         `json:"language" gorm:"default:'go'"`
	Output     string         `json:"output" gorm:"type:text"`
	ExecutedAt *time.Time     `json:"executed_at"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

type RunScriptRequest struct {
	Code     string `json:"code" binding:"required"`
	Language string `json:"language" binding:"omitempty,oneof=go javascript python"`
}

type SaveScriptRequest struct {
	Name string `json:"name" binding:"required"`
	Code string `json:"code" binding:"required"`
}
