@echo off
echo Starting eTabla Development Server...
echo.
echo Opening browser to: http://localhost:8000/etabla.html
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the Python server
python -m http.server 8000
