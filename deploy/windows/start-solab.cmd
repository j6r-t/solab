@echo off
REM Launches the Solab app in production mode (PATH A, Task Scheduler entry).
REM Resolves the project root from this file's location: deploy\windows\ -> repo root.
cd /d "%~dp0..\.."
set NODE_ENV=production
call npm start
