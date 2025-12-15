package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/kayahan81/kayahan81-website/backend/go/database"
	"github.com/kayahan81/kayahan81-website/backend/go/handlers"
	"github.com/kayahan81/kayahan81-website/backend/go/middleware"
)

func main() {
	// Загружаем переменные окружения
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Инициализируем базу данных
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.CloseDB()

	// Настраиваем Gin
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// API маршруты
	api := router.Group("/api")
	{
		// Аутентификация
		api.POST("/login", handlers.Login)
		api.POST("/register", handlers.Register)
		api.POST("/logout", handlers.Logout)

		// Защищённые маршруты
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Пользователь
			protected.GET("/user", handlers.GetUserInfo)

			// Задачи
			protected.GET("/tasks", handlers.GetTasks)
			protected.POST("/tasks", handlers.CreateTask)
			protected.PUT("/tasks/:id", handlers.UpdateTask)
			protected.DELETE("/tasks/:id", handlers.DeleteTask)

			// Файлы
			protected.GET("/files", handlers.GetFiles)
			protected.POST("/files/upload", handlers.UploadFile)
			protected.DELETE("/files/:id", handlers.DeleteFile)
			protected.GET("/files/download/:id", handlers.DownloadFile)

			// Go-скрипты
			protected.POST("/scripts/run", handlers.RunScript)
			protected.GET("/scripts", handlers.GetScripts)
			protected.POST("/scripts", handlers.SaveScript)
			protected.DELETE("/scripts/:id", handlers.DeleteScript)

			// Shadowrun справочник
			protected.GET("/shadowrun/search", handlers.SearchShadowrun)
			protected.GET("/shadowrun/entry/:id", handlers.GetShadowrunEntry)
			protected.GET("/shadowrun/categories", handlers.GetCategories)
		}
	}

	// Корневой маршрут для проверки
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Portfolio Backend API",
			"version": "1.0.0",
			"author":  "kayahan81",
			"github":  "https://github.com/kayahan81/kayahan81-website",
		})
	})

	// Запуск сервера
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📁 Database: %s", os.Getenv("DB_NAME"))
	log.Printf("👤 Demo user: admin / admin123")

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
