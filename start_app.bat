@echo off
echo Starting shiri_sensor_tco...
docker-compose up --build -d
echo.
echo App started! Opening in browser...
timeout /t 5 >nul
start http://localhost:8888/
pause
