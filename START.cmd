@ECHO OFF
cd %~dp0
call %~dp0\src\dependencies\npm install
START /B %~dp0\src\dependencies\node.exe ..\RSM-PCAP\src\app.js