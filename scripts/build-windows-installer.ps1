[CmdletBinding()]
param(
    [string]$Version = '0.8.1'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$distDirectory = Join-Path $projectRoot 'dist'
$script = Join-Path $projectRoot 'installer\windows.iss'
$portable = Join-Path $distDirectory 'Codex-Zh-Launcher-Windows-x64.exe'
$compilerCandidates = @(
    (Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6\ISCC.exe'),
    (Join-Path $env:ProgramFiles 'Inno Setup 6\ISCC.exe')
)
$compiler = $compilerCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $compiler) {
    throw 'Inno Setup 6 is required to build the Windows installer.'
}
if (-not (Test-Path -LiteralPath $portable)) {
    throw "Windows launcher is missing: $portable"
}

New-Item -ItemType Directory -Force -Path $distDirectory | Out-Null
& $compiler "/DAppVersion=$Version" "/O$distDirectory" $script
if ($LASTEXITCODE -ne 0) {
    throw "Inno Setup failed. Exit code: $LASTEXITCODE"
}

$installer = Join-Path $distDirectory 'Codex-Zh-Launcher-Windows-x64-Setup.exe'
if (-not (Test-Path -LiteralPath $installer)) {
    throw "Installer was not generated: $installer"
}
Write-Host "Installer completed: $installer"
