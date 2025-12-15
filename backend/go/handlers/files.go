package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"portfolio/database"
	"portfolio/middleware"
	"portfolio/models"
)

// Максимальный размер файла (5GB)
const MaxUploadSize = 5 * 1024 * 1024 * 1024

// Получение списка файлов пользователя
func GetFiles(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Параметры запроса
	folder := c.DefaultQuery("folder", "root")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var files []models.File
	query := database.DB.Where("user_id = ?", user.ID)

	if folder != "all" {
		query = query.Where("folder = ?", folder)
	}

	// Получаем файлы
	if err := query.Order("uploaded_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get files"})
		return
	}

	// Формируем ответ
	var response []models.FileResponse
	for _, file := range files {
		response = append(response, models.FileResponse{
			ID:         file.ID,
			Filename:   file.Filename,
			Size:       file.Size,
			SizeHuman:  file.GetSizeHuman(),
			MimeType:   file.MimeType,
			Folder:     file.Folder,
			UploadedAt: file.UploadedAt,
			URL:        fmt.Sprintf("/api/files/download/%d", file.ID),
		})
	}

	// Получаем общую статистику
	var totalSize int64
	database.DB.Model(&models.File{}).
		Where("user_id = ?", user.ID).
		Select("COALESCE(SUM(size), 0)").
		Scan(&totalSize)

	var fileCount int64
	database.DB.Model(&models.File{}).
		Where("user_id = ?", user.ID).
		Count(&fileCount)

	c.JSON(http.StatusOK, gin.H{
		"files":     response,
		"total":     fileCount,
		"totalSize": totalSize,
		"quota":     5 * 1024 * 1024 * 1024, // 5GB
		"used":      totalSize,
		"available": 5*1024*1024*1024 - totalSize,
	})
}

// Загрузка файла
func UploadFile(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Проверяем размер запроса
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxUploadSize)

	// Получаем файл из запроса
	file, err := c.FormFile("file")
	if err != nil {
		if err == http.ErrMissingFile {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		} else if strings.Contains(err.Error(), "request body too large") {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "File too large (max 5GB)"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	// Проверяем размер файла
	if file.Size > MaxUploadSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "File too large (max 5GB)"})
		return
	}

	// Проверяем квоту пользователя
	var totalSize int64
	database.DB.Model(&models.File{}).
		Where("user_id = ?", user.ID).
		Select("COALESCE(SUM(size), 0)").
		Scan(&totalSize)

	if totalSize+file.Size > 5*1024*1024*1024 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Storage quota exceeded"})
		return
	}

	// Получаем папку из запроса
	folder := c.DefaultPostForm("folder", "root")

	// Создаём уникальное имя файла
	ext := filepath.Ext(file.Filename)
	filename := strings.TrimSuffix(filepath.Base(file.Filename), ext)
	uniqueID := uuid.New().String()[:8]
	safeFilename := fmt.Sprintf("%s_%s%s",
		strings.ReplaceAll(filename, " ", "_"),
		uniqueID,
		ext)

	// Создаём папку для загрузок если её нет
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	userDir := filepath.Join(uploadDir, fmt.Sprintf("user_%d", user.ID))
	if err := os.MkdirAll(userDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Сохраняем файл
	filePath := filepath.Join(userDir, safeFilename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Определяем MIME-тип
	mimeType := file.Header.Get("Content-Type")
	if mimeType == "" {
		// Пытаемся определить по расширению
		switch strings.ToLower(ext) {
		case ".jpg", ".jpeg":
			mimeType = "image/jpeg"
		case ".png":
			mimeType = "image/png"
		case ".gif":
			mimeType = "image/gif"
		case ".pdf":
			mimeType = "application/pdf"
		case ".doc", ".docx":
			mimeType = "application/msword"
		case ".zip":
			mimeType = "application/zip"
		default:
			mimeType = "application/octet-stream"
		}
	}

	// Сохраняем информацию о файле в БД
	dbFile := models.File{
		UserID:     user.ID,
		Filename:   file.Filename,
		Filepath:   filePath,
		Size:       file.Size,
		MimeType:   mimeType,
		Folder:     folder,
		UploadedAt: time.Now(),
	}

	if err := database.DB.Create(&dbFile).Error; err != nil {
		// Удаляем файл если не удалось сохранить в БД
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file info"})
		return
	}

	// Обновляем использованное место у пользователя
	database.DB.Model(&user).Update("storage_used", totalSize+file.Size)

	c.JSON(http.StatusCreated, gin.H{
		"message": "File uploaded successfully",
		"file": models.FileResponse{
			ID:         dbFile.ID,
			Filename:   dbFile.Filename,
			Size:       dbFile.Size,
			SizeHuman:  dbFile.GetSizeHuman(),
			MimeType:   dbFile.MimeType,
			Folder:     dbFile.Folder,
			UploadedAt: dbFile.UploadedAt,
			URL:        fmt.Sprintf("/api/files/download/%d", dbFile.ID),
		},
	})
}

// Загрузка нескольких файлов (Drag & Drop)
func UploadMultipleFiles(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Проверяем размер запроса
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxUploadSize*10)

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	files := form.File["files"]
	folder := c.DefaultPostForm("folder", "root")

	// Проверяем общий размер файлов
	var totalSize int64
	for _, file := range files {
		totalSize += file.Size
	}

	// Проверяем квоту
	var currentSize int64
	database.DB.Model(&models.File{}).
		Where("user_id = ?", user.ID).
		Select("COALESCE(SUM(size), 0)").
		Scan(&currentSize)

	if currentSize+totalSize > 5*1024*1024*1024 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Storage quota exceeded"})
		return
	}

	// Создаём папку для загрузок
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	userDir := filepath.Join(uploadDir, fmt.Sprintf("user_%d", user.ID))
	if err := os.MkdirAll(userDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	var uploadedFiles []models.FileResponse
	var failedFiles []string

	// Обрабатываем каждый файл
	for _, file := range files {
		// Создаём уникальное имя
		ext := filepath.Ext(file.Filename)
		filename := strings.TrimSuffix(filepath.Base(file.Filename), ext)
		uniqueID := uuid.New().String()[:8]
		safeFilename := fmt.Sprintf("%s_%s%s",
			strings.ReplaceAll(filename, " ", "_"),
			uniqueID,
			ext)

		// Сохраняем файл
		filePath := filepath.Join(userDir, safeFilename)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			failedFiles = append(failedFiles, file.Filename)
			continue
		}

		// Определяем MIME-тип
		mimeType := file.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		// Сохраняем в БД
		dbFile := models.File{
			UserID:     user.ID,
			Filename:   file.Filename,
			Filepath:   filePath,
			Size:       file.Size,
			MimeType:   mimeType,
			Folder:     folder,
			UploadedAt: time.Now(),
		}

		if err := database.DB.Create(&dbFile).Error; err != nil {
			os.Remove(filePath)
			failedFiles = append(failedFiles, file.Filename)
			continue
		}

		uploadedFiles = append(uploadedFiles, models.FileResponse{
			ID:         dbFile.ID,
			Filename:   dbFile.Filename,
			Size:       dbFile.Size,
			SizeHuman:  dbFile.GetSizeHuman(),
			MimeType:   dbFile.MimeType,
			Folder:     dbFile.Folder,
			UploadedAt: dbFile.UploadedAt,
			URL:        fmt.Sprintf("/api/files/download/%d", dbFile.ID),
		})
	}

	// Обновляем использованное место
	database.DB.Model(&user).Update("storage_used", currentSize+totalSize)

	response := gin.H{
		"message":       fmt.Sprintf("Uploaded %d files", len(uploadedFiles)),
		"uploaded":      uploadedFiles,
		"uploadedCount": len(uploadedFiles),
		"failedCount":   len(failedFiles),
	}

	if len(failedFiles) > 0 {
		response["failed"] = failedFiles
		response["message"] = fmt.Sprintf("Uploaded %d files, failed: %d", len(uploadedFiles), len(failedFiles))
	}

	c.JSON(http.StatusOK, response)
}

// Скачивание файла
func DownloadFile(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Получаем ID файла
	fileID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	// Получаем файл из БД
	var file models.File
	if err := database.DB.Where("id = ? AND user_id = ?", fileID, user.ID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Проверяем существование файла на диске
	if _, err := os.Stat(file.Filepath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found on server"})
		return
	}

	// Отправляем файл
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Filename))
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", fmt.Sprintf("%d", file.Size))
	c.File(file.Filepath)
}

// Удаление файла
func DeleteFile(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	fileID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	// Получаем файл
	var file models.File
	if err := database.DB.Where("id = ? AND user_id = ?", fileID, user.ID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Удаляем файл с диска
	if err := os.Remove(file.Filepath); err != nil && !os.IsNotExist(err) {
		log.Printf("Warning: failed to delete file from disk: %v", err)
	}

	// Удаляем запись из БД
	if err := database.DB.Delete(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	// Обновляем использованное место
	database.DB.Model(&user).
		Where("id = ?", user.ID).
		Update("storage_used", user.StorageUsed-file.Size)

	c.JSON(http.StatusOK, gin.H{
		"message": "File deleted successfully",
		"freed":   file.Size,
	})
}

// Создание папки
func CreateFolder(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	type FolderRequest struct {
		Name string `json:"name" binding:"required"`
	}

	var req FolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Просто сохраняем информацию о папке
	// В реальном приложении можно создать таблицу folders
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Folder '%s' created", req.Name),
		"folder":  req.Name,
	})
}

// Получение статистики хранилища
func GetStorageStats(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Получаем статистику по папкам
	var folderStats []struct {
		Folder string
		Count  int64
		Size   int64
	}

	database.DB.Model(&models.File{}).
		Select("folder, COUNT(*) as count, SUM(size) as size").
		Where("user_id = ?", user.ID).
		Group("folder").
		Scan(&folderStats)

	// Общая статистика
	var totalSize int64
	var fileCount int64

	database.DB.Model(&models.File{}).
		Where("user_id = ?", user.ID).
		Select("COALESCE(SUM(size), 0)").
		Scan(&totalSize)

	database.DB.Model(&models.File{}).
		Where("user_id = ?", user.ID).
		Count(&fileCount)

	c.JSON(http.StatusOK, gin.H{
		"totalSize":      totalSize,
		"totalSizeHuman": formatBytes(totalSize),
		"fileCount":      fileCount,
		"quota":          5 * 1024 * 1024 * 1024,
		"quotaHuman":     "5 GB",
		"usedPercent":    float64(totalSize) / float64(5*1024*1024*1024) * 100,
		"folders":        folderStats,
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

// Получение превью файла (для изображений и PDF)
func GetFilePreview(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	fileID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	var file models.File
	if err := database.DB.Where("id = ? AND user_id = ?", fileID, user.ID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Проверяем тип файла
	if !strings.HasPrefix(file.MimeType, "image/") && file.MimeType != "application/pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Preview not available for this file type"})
		return
	}

	// Читаем первые 500KB для превью
	f, err := os.Open(file.Filepath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer f.Close()

	// Для изображений отправляем как есть
	if strings.HasPrefix(file.MimeType, "image/") {
		c.Header("Content-Type", file.MimeType)
		io.Copy(c.Writer, f)
		return
	}

	// Для PDF нужно конвертировать в изображение (в реальном приложении)
	c.JSON(http.StatusNotImplemented, gin.H{"error": "PDF preview not implemented"})
}
