@echo off
echo Starting Scaffold AI Review Application...

:: Start the FastAPI backend in a new command window
echo Starting Backend (FastAPI)...
start "Scaffold AI Backend" cmd /k "cd backend && .\venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait 3 seconds to let the backend initialize
timeout /t 3 /nobreak > nul

:: Start the Vite React frontend in a new command window
echo Starting Frontend (React/Vite)...
start "Scaffold AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo Once Vite is ready, you can access the app at: http://localhost:5173
echo.
pause
