@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Parar O Profissional Certo
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 .*LISTENING"') do taskkill /PID %%P /F >nul 2>nul
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":24678 .*LISTENING"') do taskkill /PID %%P /F >nul 2>nul
echo O Profissional Certo encerrado.
timeout /t 2 >nul
