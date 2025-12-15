package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"portfolio/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UploadFile загрузка файла
func UploadFile(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	// Получаем файл из формы
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Файл не получен"})
		return
	}
	defer file.Close()

	// Проверяем размер файла (макс 50MB)
	maxSize := int64(50 * 1024 * 1024) // 50MB
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Файл слишком большой (макс. 50MB)"})
		return
	}

	// Проверяем расширение файла
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExts := []string{".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".txt", ".go", ".zip"}
	allowed := false
	for _, a := range allowedExts {
		if ext == a {
			allowed = true
			break
		}
	}
	if !allowed {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Тип файла не разрешён"})
		return
	}

	// Проверяем квоту пользователя
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Пользователь не найден"})
		return
	}

	// Проверяем достаточно ли места (используем StorageQuota из модели)
	if user.StorageUsed+header.Size > user.StorageQuota {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Недостаточно места в хранилище. Использовано: %s/%s",
				formatBytes(user.StorageUsed), formatBytes(user.StorageQuota)), // Исправлено здесь
		})
		return
	}

	// Создаём уникальное имя файла
	fileID := uuid.New().String()
	newFilename := fileID + ext
	uploadPath := filepath.Join("uploads", strconv.Itoa(int(userID)))

	// Создаём директорию если её нет
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории"})
		return
	}

	// Сохраняем файл
	filePath := filepath.Join(uploadPath, newFilename)
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка копирования файла"})
		return
	}

	// Получаем папку из формы
	folder := c.PostForm("folder")
	if folder == "" {
		folder = "general"
	}

	// Создаём запись в базе данных
	fileRecord := models.File{
		UserID:           userID,
		Filename:         newFilename,
		OriginalFilename: header.Filename,
		FilePath:         filePath,
		FileSize:         header.Size,
		MimeType:         header.Header.Get("Content-Type"),
		Folder:           folder,
		UploadedAt:       time.Now(),
	}

	if err := db.Create(&fileRecord).Error; err != nil {
		os.Remove(filePath) // Удаляем файл если не удалось сохранить запись
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения в базу данных"})
		return
	}

	// Обновляем использованное место
	user.StorageUsed += header.Size
	db.Save(&user)

	c.JSON(http.StatusOK, gin.H{
		"message": "Файл успешно загружен",
		"file": gin.H{
			"id":          fileRecord.ID,
			"filename":    fileRecord.OriginalFilename,
			"size":        fileRecord.FileSize,
			"size_human":  fileRecord.GetSizeHuman(),
			"folder":      fileRecord.Folder,
			"uploaded_at": fileRecord.UploadedAt.Format("2006-01-02 15:04:05"),
		},
		"storage_used":  user.StorageUsed,
		"storage_quota": user.StorageQuota, // Используем из модели
	})
}

// GetFiles получение файлов пользователя
func GetFiles(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")
	folder := c.Query("folder")

	var files []models.File
	query := db.Where("user_id = ?", userID)

	if folder != "" && folder != "all" {
		query = query.Where("folder = ?", folder)
	}

	if err := query.Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения файлов"})
		return
	}

	// Получаем информацию о хранилище
	var user models.User
	db.First(&user, userID)

	response := make([]gin.H, len(files))
	for i, file := range files {
		response[i] = gin.H{
			"id":          file.ID,
			"filename":    file.OriginalFilename,
			"size":        file.FileSize,
			"size_human":  file.GetSizeHuman(),
			"mime_type":   file.MimeType,
			"folder":      file.Folder,
			"uploaded_at": file.UploadedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"files":         response,
		"storage_used":  user.StorageUsed,
		"storage_quota": user.StorageQuota, // Используем из модели
	})
}

// GetFile - получение информации о файле
func GetFile(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	id := c.Param("id")
	var file models.File

	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"file": gin.H{
			"id":          file.ID,
			"filename":    file.OriginalFilename,
			"size":        file.FileSize,
			"size_human":  file.GetSizeHuman(),
			"mime_type":   file.MimeType,
			"folder":      file.Folder,
			"uploaded_at": file.UploadedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// DownloadFile скачивание файла
func DownloadFile(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")
	fileID := c.Param("id")

	var file models.File
	if err := db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	// Проверяем существует ли файл
	if _, err := os.Stat(file.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл на диске не найден"})
		return
	}

	// Отправляем файл
	c.FileAttachment(file.FilePath, file.OriginalFilename)
}

// DeleteFile удаление файла
func DeleteFile(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")
	fileID := c.Param("id")

	var file models.File
	if err := db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	// Удаляем файл с диска
	if err := os.Remove(file.FilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка удаления файла"})
		return
	}

	// Обновляем квоту пользователя
	var user models.User
	db.First(&user, userID)
	user.StorageUsed -= file.FileSize
	if user.StorageUsed < 0 {
		user.StorageUsed = 0
	}
	db.Save(&user)

	// Удаляем запись из базы данных
	db.Delete(&file)

	c.JSON(http.StatusOK, gin.H{
		"message":       "Файл успешно удалён",
		"storage_used":  user.StorageUsed,
		"storage_quota": user.StorageQuota, // Используем из модели
	})
}

// RenameFile переименование файла
func RenameFile(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")
	fileID := c.Param("id")

	var request struct {
		Filename string `json:"filename" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный запрос: " + err.Error()})
		return
	}

	// Проверяем имя файла
	if request.Filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Имя файла не может быть пустым"})
		return
	}

	var file models.File
	if err := db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	// Обновляем имя файла
	file.OriginalFilename = request.Filename
	if err := db.Save(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при переименовании файла"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Файл успешно переименован",
		"file": gin.H{
			"id":       file.ID,
			"filename": file.OriginalFilename,
		},
	})
}

// CreateFileFolder создание папки для файлов
func CreateFileFolder(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var request struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный запрос: " + err.Error()})
		return
	}

	// Проверяем имя папки
	if request.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Имя папки не может быть пустым"})
		return
	}

	// Проверяем, нет ли уже такой папки
	var existingFiles []models.File
	db.Where("user_id = ? AND folder = ?", userID, request.Name).Find(&existingFiles)

	c.JSON(http.StatusOK, gin.H{
		"message": "Папка создана",
		"folder": gin.H{
			"name":       request.Name,
			"file_count": len(existingFiles),
			"exists":     len(existingFiles) > 0,
		},
	})
}

// GetFileFolders - получение списка папок пользователя
func GetFileFolders(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")

	var folders []string
	if err := db.Model(&models.File{}).
		Where("user_id = ?", userID).
		Distinct("folder").
		Pluck("folder", &folders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения папок"})
		return
	}

	// Добавляем папку "all" для фильтрации
	allFolders := append([]string{"all"}, folders...)

	c.JSON(http.StatusOK, gin.H{
		"folders": allFolders,
		"count":   len(allFolders),
	})
}

// MoveFile перемещение файла в другую папку
func MoveFile(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")
	fileID := c.Param("id")

	var request struct {
		Folder string `json:"folder" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный запрос: " + err.Error()})
		return
	}

	var file models.File
	if err := db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл не найден"})
		return
	}

	// Сохраняем старую папку для сообщения
	oldFolder := file.Folder

	// Обновляем папку файла
	file.Folder = request.Folder
	if err := db.Save(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при перемещении файла"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Файл перемещён из '%s' в '%s'", oldFolder, request.Folder),
		"file": gin.H{
			"id":       file.ID,
			"filename": file.OriginalFilename,
			"folder":   file.Folder,
		},
	})
}

// Вспомогательная функция для форматирования байтов
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
