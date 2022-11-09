@ECHO OFF
start cmd.exe /C "python -m http.server 3045"
start chrome http://localhost:3045/index.html