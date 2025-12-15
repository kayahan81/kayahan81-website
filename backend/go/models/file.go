package models

import (
	"time"
	
	"gorm.io/gorm"
)

type File struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"not null"`
	Filename    string         `json:"filename" gorm:"not null"`
	Filepath    string         `json:"filepath"` // Путь на сервере
	Size        int64          `json:"size"`     // В байтах
	MimeType    string         `json:"mime_type"`
	Folder      string         `json:"folder" gorm:"default:'root'"`
	Public      bool           `json:"public" gorm:"default:false"`
	UploadedAt  time.Time      `json:"uploaded_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Связь
	User        User           `json:"-" gorm:"foreignKey:UserID"`
}

// DTO для загрузки файла
type UploadRequest struct {
	Folder string `form:"folder" binding:"omitempty"`
}

// DTO для ответа с файлом
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
func (f *File) SizeHuman() string {
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