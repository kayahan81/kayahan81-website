package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type File struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	UserID           uint           `json:"user_id" gorm:"not null"`
	Filename         string         `json:"filename" gorm:"not null"`          // Уникальное имя
	OriginalFilename string         `json:"original_filename" gorm:"not null"` // Оригинальное имя
	FilePath         string         `json:"file_path"`                         // Путь на диске
	FileSize         int64          `json:"file_size"`
	MimeType         string         `json:"mime_type"`
	Folder           string         `json:"folder" gorm:"default:'general'"`
	UploadedAt       time.Time      `json:"uploaded_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

type UploadRequest struct {
	Folder string `form:"folder" binding:"omitempty"`
}

// Конвертация размера в читаемый формат
func (f *File) GetSizeHuman() string {
	const unit = 1024
	if f.FileSize < unit {
		return fmt.Sprintf("%d B", f.FileSize)
	}
	div, exp := int64(unit), 0
	for n := f.FileSize / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(f.FileSize)/float64(div), "KMGTPE"[exp])
}
