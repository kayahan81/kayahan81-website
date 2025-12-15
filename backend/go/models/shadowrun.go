package models

import (
	"time"

	"gorm.io/gorm"
)

type ShadowrunEntry struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"size:255;not null" json:"title"`
	Category    string         `gorm:"size:100;not null" json:"category"`
	Description string         `gorm:"type:text" json:"description"`
	Content     string         `gorm:"type:text" json:"content"`
	Tags        string         `gorm:"type:text" json:"tags"` // Строка с тегами через запятую
	Views       int            `gorm:"default:0" json:"views"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
