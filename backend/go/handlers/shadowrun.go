package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"portfolio/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetShadowrunEntries - поиск по справочнику
func GetShadowrunEntries(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	query := c.Query("q")
	category := c.Query("category")

	var entries []models.ShadowrunEntry
	dbQuery := db.Model(&models.ShadowrunEntry{})

	if query != "" {
		searchTerm := "%" + strings.ToLower(query) + "%"
		dbQuery = dbQuery.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if category != "" && category != "all" {
		dbQuery = dbQuery.Where("category = ?", category)
	}

	if err := dbQuery.Order("id ASC").Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entries"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entries": entries,
		"count":   len(entries),
	})
}

// GetShadowrunEntry - получение записи по ID
func GetShadowrunEntry(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var entry models.ShadowrunEntry
	if err := db.First(&entry, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Entry not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Увеличиваем счетчик просмотров
	db.Model(&entry).Update("views", gorm.Expr("views + ?", 1))

	c.JSON(http.StatusOK, gin.H{
		"entry": entry,
	})
}

// GetShadowrunCategories - список категорий
func GetShadowrunCategories(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var categories []string
	if err := db.Model(&models.ShadowrunEntry{}).
		Distinct().
		Pluck("category", &categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// AddShadowrunEntry - добавление новой записи (админ)
func AddShadowrunEntry(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Title       string   `json:"title" binding:"required"`
		Category    string   `json:"category" binding:"required"`
		Description string   `json:"description"`
		Content     string   `json:"content"`
		Tags        []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Конвертируем массив тегов в строку
	tagsStr := strings.Join(input.Tags, ",")

	entry := models.ShadowrunEntry{
		Title:       input.Title,
		Category:    input.Category,
		Description: input.Description,
		Content:     input.Content,
		Tags:        tagsStr,
	}

	if err := db.Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create entry"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Entry created successfully",
		"entry":   entry,
	})
}

// UpdateShadowrunEntry - обновление записи
func UpdateShadowrunEntry(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Title       string   `json:"title"`
		Category    string   `json:"category"`
		Description string   `json:"description"`
		Content     string   `json:"content"`
		Tags        []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var entry models.ShadowrunEntry
	if err := db.First(&entry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Entry not found"})
		return
	}

	// Обновляем поля напрямую (удаляем переменную updates)
	if input.Title != "" {
		entry.Title = input.Title
	}
	if input.Category != "" {
		entry.Category = input.Category
	}
	if input.Description != "" {
		entry.Description = input.Description
	}
	if input.Content != "" {
		entry.Content = input.Content
	}
	if input.Tags != nil {
		entry.Tags = strings.Join(input.Tags, ",")
	}

	if err := db.Save(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update entry"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Entry updated successfully",
		"entry":   entry,
	})
}

// DeleteShadowrunEntry - удаление записи
func DeleteShadowrunEntry(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := db.Delete(&models.ShadowrunEntry{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete entry"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Entry deleted successfully"})
}

// GetShadowrunTags - получение уникальных тегов
func GetShadowrunTags(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var entries []models.ShadowrunEntry
	if err := db.Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entries"})
		return
	}

	// Собираем все уникальные теги
	tagMap := make(map[string]bool)
	for _, entry := range entries {
		if entry.Tags != "" {
			tags := strings.Split(entry.Tags, ",")
			for _, tag := range tags {
				tag = strings.TrimSpace(tag)
				if tag != "" {
					tagMap[tag] = true
				}
			}
		}
	}

	// Конвертируем в массив
	var tags []string
	for tag := range tagMap {
		tags = append(tags, tag)
	}

	c.JSON(http.StatusOK, gin.H{"tags": tags})
}
