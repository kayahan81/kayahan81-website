package middleware

import (
	"portfolio/database"

	"github.com/gin-gonic/gin"
)

// DBMiddleware - добавляет базу данных в контекст
func DBMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем соединение с БД
		db := database.DB
		if db == nil {
			// Если DB не инициализирована, создаем новое соединение
			var err error
			db, err = database.InitDB()
			if err != nil {
				c.JSON(500, gin.H{"error": "Не удалось подключиться к базе данных"})
				c.Abort()
				return
			}
		}

		// Сохраняем DB в контекст
		c.Set("db", db)
		c.Next()
	}
}
