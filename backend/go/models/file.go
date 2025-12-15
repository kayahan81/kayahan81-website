package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type File struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	UserID     uint           `json:"user_id" gorm:"not null"`
	Filename   string         `json:"filename" gorm:"not null"`
	Filepath   string         `json:"filepath"`
	Size       int64          `json:"size"`
	MimeType   string         `json:"mime_type"`
	Folder     string         `json:"folder" gorm:"default:'root'"`
	Public     bool           `json:"public" gorm:"default:false"`
	UploadedAt time.Time      `json:"uploaded_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

type UploadRequest struct {
	Folder string `form:"folder" binding:"omitempty"`
}

type FileResponse struct {
	ID         uint      `json:"id"`
	Filename   string    `json:"filename"`
	Size       int64     `json:"size"`
	SizeHuman  string    `json:"size_human"`
	MimeType   string    `json:"mime_type"`
	Folder     string    `json:"folder"`
	UploadedAt time.Time `json:"uploaded_at"`
	URL        string    `json:"url,omitempty"`
}

// Конвертация размера в читаемый формат
func (f *File) GetSizeHuman() string {
	const unit = 1024
	if f.Size < unit {
		return fmt.Sprintf("%d B", f.Size)
	}
	div, exp := int64(unit), 0
	for n := f.Size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(f.Size)/float64(div), "KMGTPE"[exp])
}
