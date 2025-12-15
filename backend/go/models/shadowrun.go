package models

import "time"

type ShadowrunEntry struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Category    string    `json:"category" gorm:"not null;index"`
	Description string    `json:"description" gorm:"type:text"`
	Content     string    `json:"content" gorm:"type:text;not null"`
	Tags        string    `json:"tags" gorm:"type:text"` // JSON массив строк
	Views       int       `json:"views" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type SearchRequest struct {
	Query    string `form:"q"`
	Category string `form:"category"`
	Limit    int    `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset   int    `form:"offset" binding:"omitempty,min=0"`
}
