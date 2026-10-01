; Codex Desktop Chinese Localization Enhancer installer.
#ifndef AppVersion
#define AppVersion "0.8.2"
#endif

[Setup]
AppId={{B9A6E6D0-2E82-4A2B-9A7D-4F6A9B76F4C8}
AppName=Codex Desktop Chinese Localization Enhancer
AppVersion={#AppVersion}
AppPublisher=718572560-crypto
DefaultDirName={localappdata}\CodexZhLauncher
DefaultGroupName=Codex Desktop Chinese Localization Enhancer
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputBaseFilename=Codex-Zh-Launcher-Windows-x64-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\Codex-Zh-Launcher-Windows-x64.exe

[Files]
Source: "..\dist\Codex-Zh-Launcher-Windows-x64.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Codex Desktop Chinese Localization Enhancer"; Filename: "{app}\Codex-Zh-Launcher-Windows-x64.exe"
Name: "{autodesktop}\Codex Desktop Chinese Localization Enhancer"; Filename: "{app}\Codex-Zh-Launcher-Windows-x64.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; Flags: unchecked

[Run]
Filename: "{app}\Codex-Zh-Launcher-Windows-x64.exe"; Description: "Launch Codex Desktop Chinese Localization Enhancer"; Flags: postinstall nowait skipifsilent
