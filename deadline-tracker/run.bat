@echo off
REM run.bat - Windows equivalent of start.sh. Launches the complete
REM Deadline Tracker setup locally:
REM   1. makes sure the MySQL service is running
REM   2. starts the PHP app (php -S) on PHP_PORT
REM   3. starts the React demo (vite) on REACT_PORT, installing deps if needed
REM   4. opens both in the default browser
REM
REM Usage:
REM   run.bat          start everything
REM   run.bat stop     stop the servers this script started

setlocal enabledelayedexpansion

set "PHP_PORT=8089"
set "REACT_PORT=5173"
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "RUN_DIR=%PROJECT_DIR%\.run"

if /i "%~1"=="stop" goto :stop

if not exist "%RUN_DIR%" mkdir "%RUN_DIR%"

REM ---- 0. Sanity-check required tools are on PATH --------------------
where php >nul 2>&1
if errorlevel 1 (
    echo ERROR: "php" was not found on PATH. Install PHP and add it to PATH first.
    exit /b 1
)

REM ---- 1. MySQL -------------------------------------------------------
echo ==> Checking MySQL...
sc query MySQL >nul 2>&1
if %errorlevel%==0 (
    sc query MySQL | find "RUNNING" >nul
    if errorlevel 1 (
        echo     Starting MySQL service...
        net start MySQL >nul 2>&1
        timeout /t 3 /nobreak >nul
    ) else (
        echo     MySQL already running.
    )
) else (
    echo     Could not find a Windows service named "MySQL" - if you use
    echo     XAMPP/WAMP/MySQL Workbench instead, start MySQL from its own
    echo     control panel before continuing.
)

REM ---- 2. PHP application ----------------------------------------------
echo ==> Starting PHP app on port %PHP_PORT%...
netstat -ano | findstr ":%PHP_PORT% " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo     Port %PHP_PORT% already in use - assuming the app is already running.
) else (
    start "Deadline Tracker - PHP" /min cmd /c "cd /d "%PROJECT_DIR%" && php -S localhost:%PHP_PORT% > "%RUN_DIR%\php.log" 2>&1"
    timeout /t 1 /nobreak >nul
    echo     PHP server started (log: .run\php.log).
)

REM ---- 3. React demo ----------------------------------------------------
echo ==> Starting React demo on port %REACT_PORT%...
set "REACT_DIR=%PROJECT_DIR%\react-demo"
netstat -ano | findstr ":%REACT_PORT% " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo     Port %REACT_PORT% already in use - assuming the demo is already running.
) else (
    where npm >nul 2>&1
    if errorlevel 1 (
        echo     WARNING: "npm" was not found on PATH - skipping the React demo.
        echo     Install Node.js to enable it, then re-run this script.
    ) else (
        if not exist "%REACT_DIR%\node_modules" (
            echo     Installing React demo dependencies (first run only)...
            pushd "%REACT_DIR%"
            call npm install
            popd
        )
        start "Deadline Tracker - React" /min cmd /c "cd /d "%REACT_DIR%" && npm run dev -- --port %REACT_PORT% > "%RUN_DIR%\react.log" 2>&1"
        timeout /t 2 /nobreak >nul
        echo     React dev server started (log: .run\react.log).
    )
)

REM ---- 4. Open in browser -------------------------------------------------
set "PHP_URL=http://localhost:%PHP_PORT%/index.php"
set "REACT_URL=http://localhost:%REACT_PORT%/"

echo ==> Opening browser tabs...
start "" "%PHP_URL%"
timeout /t 1 /nobreak >nul
start "" "%REACT_URL%"

echo.
echo Deadline Tracker is up:
echo   PHP application : %PHP_URL%
echo   React demo      : %REACT_URL%
echo.
echo Stop everything with:
echo   run.bat stop
goto :eof

:stop
echo ==> Stopping Deadline Tracker servers...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PHP_PORT% " ^| findstr "LISTENING"') do (
    echo     Stopping PHP server (PID %%p)...
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%REACT_PORT% " ^| findstr "LISTENING"') do (
    echo     Stopping React dev server (PID %%p)...
    taskkill /PID %%p /F >nul 2>&1
)
echo Done.
goto :eof
