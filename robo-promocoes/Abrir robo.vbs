' Liga o robo escondido (sem janela preta) e abre o painel no navegador.
' Se o robo ja estiver ligado, so abre o painel.
Option Explicit

Dim shell, fso, pasta, painel
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
pasta = fso.GetParentFolderName(WScript.ScriptFullName)
painel = "http://localhost:3000"

Function RoboLigado()
  Dim http
  RoboLigado = False
  On Error Resume Next
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 1000, 1000, 1000, 1000
  http.open "GET", "http://127.0.0.1:3000/api/estado", False
  http.send
  If Err.Number = 0 Then RoboLigado = (http.status > 0)
  On Error GoTo 0
End Function

If RoboLigado() Then
  shell.Run painel
  WScript.Quit
End If

' Atualiza pelo GitHub, confere as pecas e liga o robo, tudo escondido.
' O que o robo escreve vai para dados\robo.log
Dim comando
comando = "cmd /c cd /d """ & pasta & """" & _
  " & (if exist ""..\.git"" git pull --ff-only)" & _
  " & call npm install --no-audit --no-fund --loglevel=error" & _
  " & (if not exist dados mkdir dados)" & _
  " & node robo.js >> dados\robo.log 2>&1"
shell.Run comando, 0, False

' Abre uma pagina de "ligando..." que entra no painel assim que ele responder
shell.Run """" & pasta & "\ligando.html"""
