@echo off
echo 🚀 Starting AI Voice Agent Platform MVP...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install docker-compose and try again.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. Please review and update the configuration if needed.
)

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start the services
echo 🔨 Building and starting services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 AI Voice Agent Platform MVP is starting up!
echo.
echo 📱 Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Documentation: http://localhost:8000/docs
echo    Data Integration API: http://localhost:8001/docs
echo    Vector Database: http://localhost:6333/dashboard
echo    File Storage Console: http://localhost:9001
echo    Database Admin: http://localhost:8080 (Adminer)
echo.
echo 🔐 Demo Login Credentials:
echo    Email: demo@voiceagent.platform
echo    Password: demo123
echo.
echo 📊 To view logs:
echo    All services: docker-compose logs -f
echo    Backend only: docker-compose logs -f backend
echo    Frontend only: docker-compose logs -f frontend
echo    Data Integration: docker-compose logs -f data-integration
echo.
echo 🛑 To stop the application:
echo    docker-compose down
echo.

REM Follow logs
echo 📋 Following application logs (Ctrl+C to exit)...
docker-compose logs -f
