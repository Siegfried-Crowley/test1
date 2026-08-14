@echo off
rem ============================================================
rem  双源码树同步脚本
rem  src/   = 现场源码(live,MySQL)
rem  server/= docker 打包树(H2/PostgreSQL)
rem  只同步 Java 源码与测试,保留两棵树的配置差异
rem  (application.yml / data.sql / pom.xml / Dockerfile 等)
rem  用法: 双击运行,或命令行执行 sync.bat
rem ============================================================
echo Syncing Java sources from src/ to server/ ...
rem /XF DiscordApplication.java: 保留 server 树的主类差异(docker 打包用,勿覆盖)
robocopy "%~dp0src\main\java" "%~dp0server\src\main\java" /E /XF DiscordApplication.java /NFL /NDL /NJH /NJS
robocopy "%~dp0src\test" "%~dp0server\src\test" /E /NFL /NDL /NJH /NJS
echo.
echo Done. 可用以下命令核对差异(预期仅剩 DiscordApplication.java):
echo   diff -rq src\main\java server\src\main\java
pause
