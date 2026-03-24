@echo off
echo ====================================
echo 502 Bad Gateway Diagnostic
echo ====================================
echo.

echo [1] Container Status
echo --------------------
docker compose -f infra/docker/docker-compose.prod.yml ps
echo.

echo [2] Backend Logs (last 50 lines)
echo ---------------------------------
docker logs ems-backend --tail 50
echo.

echo [3] Nginx Logs (last 30 lines)
echo -------------------------------
docker logs ems-nginx --tail 30
echo.

echo [4] Backend Health Check
echo ------------------------
docker exec ems-backend wget -q -O- http://localhost:3001/health 2>&1
echo.

echo [5] Network Connectivity
echo ------------------------
docker exec ems-nginx ping -c 2 backend 2>&1
echo.

echo [6] Backend Process Status
echo ---------------------------
docker exec ems-backend ps aux 2>&1
echo.

echo ====================================
echo Diagnostic Complete
echo ====================================
pause
