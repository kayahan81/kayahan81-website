package main

import (
	"log"
	"os"
	"portfolio/database"
	"portfolio/handlers"
	"portfolio/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Загружаем .env файл
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using defaults")
	}

	// Инициализация базы данных
	db, err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := database.Migrate(db); err != nil {
		log.Printf("⚠️ Предупреждение при миграции: %v", err)
		log.Println("⚠️ Продолжаю работу (таблицы могут уже существовать)")
		// НЕ завершаем с fatal ошибкой!
	}

	router := gin.Default()

	// Настройка CORS для разработки
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://127.0.0.1:5500",
			"http://localhost:8080",
			"http://localhost:5500",
			"http://localhost:*",
			"http://127.0.0.1:*",
			"file://", // Добавьте если открываете через file://
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))
	// Статические файлы (фронтенд)
	router.Static("/frontend", "../frontend")
	router.StaticFile("/", "../frontend/html/index.html")
	router.StaticFile("/index.html", "../frontend/html/index.html")
	router.StaticFile("/tasks.html", "../frontend/html/page/tasks.html")
	router.StaticFile("/storage.html", "../frontend/html/page/storage.html")
	router.StaticFile("/scripts.html", "../frontend/html/page/scripts.html")
	router.StaticFile("/shadowrun.html", "../frontend/html/page/shadowrun.html")

	// Публичные маршруты (без аутентификации, но с БД)
	public := router.Group("/api")
	public.Use(middleware.DBMiddleware()) // <-- ДОБАВЬТЕ ЭТУ СТРОЧКУ
	{
		public.POST("/login", handlers.Login)
		public.POST("/register", handlers.Register)
		public.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "service": "portfolio-backend"})
		})
	}

	// Защищённые маршруты (требуют аутентификации И БД)
	api := router.Group("/api")
	api.Use(middleware.DBMiddleware()) // <-- ДОБАВЬТЕ ЭТУ СТРОЧКУ
	api.Use(middleware.AuthMiddleware())
	{
		// Пользователь
		api.GET("/user", handlers.GetUser)
		api.POST("/logout", handlers.Logout)

		// Задачи
		tasks := api.Group("/tasks")
		{
			tasks.GET("", handlers.GetTasks)
			tasks.GET("/:id", handlers.GetTask)
			tasks.POST("", handlers.CreateTask)
			tasks.PUT("/:id", handlers.UpdateTask)
			tasks.DELETE("/:id", handlers.DeleteTask)
			tasks.PUT("/:id/status", handlers.UpdateTaskStatus)
			tasks.GET("/folders", handlers.GetFolders)
			tasks.POST("/folders", handlers.CreateFolder)
		}

		// Файлы
		files := api.Group("/files")
		{
			// Сначала общие маршруты, затем динамические
			files.GET("/folders", handlers.GetFileFolders) // <-- ДОЛЖЕН БЫТЬ ПЕРВЫМ!
			files.POST("/folders", handlers.CreateFileFolder)

			// Затем остальные
			files.GET("", handlers.GetFiles)
			files.GET("/:id", handlers.GetFile)
			files.POST("/upload", handlers.UploadFile)
			files.DELETE("/:id", handlers.DeleteFile)
			files.GET("/download/:id", handlers.DownloadFile)
			files.PUT("/:id/rename", handlers.RenameFile)
			files.PUT("/:id/move", handlers.MoveFile)
		}

		// Скрипты
		scripts := api.Group("/scripts")
		{
			scripts.POST("/run", handlers.RunScript)
			scripts.GET("", handlers.GetScripts)
			scripts.GET("/:id", handlers.GetScript)
			scripts.POST("", handlers.SaveScript)
			scripts.DELETE("/:id", handlers.DeleteScript)
		}

		// Shadowrun
		shadowrun := api.Group("/shadowrun")
		{
			shadowrun.GET("/entries", handlers.GetShadowrunEntries)
			shadowrun.GET("/categories", handlers.GetShadowrunCategories)
			shadowrun.GET("/entries/:id", handlers.GetShadowrunEntry)
			shadowrun.GET("/tags", handlers.GetShadowrunTags)
			shadowrun.POST("/entries", handlers.AddShadowrunEntry)
			shadowrun.PUT("/entries/:id", handlers.UpdateShadowrunEntry)
			shadowrun.DELETE("/entries/:id", handlers.DeleteShadowrunEntry)
		}
	}

	// Статические файлы загрузок
	uploadsDir := "./uploads"
	if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
		os.MkdirAll(uploadsDir, 0755)
	}
	router.Static("/uploads", uploadsDir)

	// Запуск сервера
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Сервер запущен на http://localhost:%s", port)
	log.Printf("📁 Фронтенд доступен по http://localhost:%s/index.html", port)
	log.Println("👤 Демо пользователь: admin / admin123")

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
