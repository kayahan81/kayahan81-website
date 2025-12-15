package models

import "time"

type ShadowrunEntry struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Category    string    `json:"category" gorm:"not null;index"`
	Description string    `json:"description" gorm:"type:text"`
	Content     string    `json:"content" gorm:"type:text;not null"`
	Tags        []string  `json:"tags" gorm:"type:text[]"`
	Views       int       `json:"views" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// DTO для поиска
type SearchRequest struct {
	Query    string   `form:"q"`
	Category string   `form:"category"`
	Tags     []string `form:"tags"`
	Limit    int      `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset   int      `form:"offset" binding:"omitempty,min=0"`
}