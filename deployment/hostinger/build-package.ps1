param(
    [string]$Domain = 'mc.webusaha.com'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$buildRoot = Join-Path $projectRoot "scratch/hostinger-$stamp"
$packageRoot = Join-Path $buildRoot 'package'
$appRoot = Join-Path $packageRoot 'mc-connect'
$publicRoot = Join-Path $packageRoot 'public_html'
New-Item -ItemType Directory -Path $appRoot,$publicRoot -Force | Out-Null

# Use an explicit allowlist: local secrets and browser profiles never enter the ZIP.
foreach ($directory in @('app','config','resources','routes','deployment')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination $appRoot -Recurse
}
foreach ($file in @('artisan','composer.json','composer.lock','.env.production.example')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $appRoot
}
New-Item -ItemType Directory -Path (Join-Path $appRoot 'bootstrap/cache'),(Join-Path $appRoot 'database') -Force | Out-Null
Copy-Item -Path (Join-Path $projectRoot 'bootstrap/*.php') -Destination (Join-Path $appRoot 'bootstrap')
Copy-Item -LiteralPath (Join-Path $projectRoot 'database/migrations') -Destination (Join-Path $appRoot 'database') -Recurse

foreach ($directory in @('css','js','build')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot "public/$directory") -Destination $publicRoot -Recurse
}
foreach ($file in @('.htaccess','index.html','login.html','favicon.jpg','manifest.json','sw.js')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot "public/$file") -Destination $publicRoot
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'index.php') -Destination (Join-Path $publicRoot 'index.php')

foreach ($directory in @('storage/app/public','storage/app/private','storage/framework/cache/data','storage/framework/sessions','storage/framework/views','storage/logs')) {
    New-Item -ItemType Directory -Path (Join-Path $appRoot $directory) -Force | Out-Null
}
foreach ($directory in @('profile','gallery','wardrobe','music','expenses')) {
    New-Item -ItemType Directory -Path (Join-Path $publicRoot "uploads/$directory") -Force | Out-Null
}
Copy-Item -LiteralPath (Join-Path $projectRoot 'public/uploads/.htaccess') -Destination (Join-Path $publicRoot 'uploads/.htaccess')

$templatePath = Join-Path $appRoot '.env.production.example'
$template = [IO.File]::ReadAllText($templatePath).Replace('APP_URL=https://example.com', "APP_URL=https://$Domain")
[IO.File]::WriteAllText($templatePath, $template, (New-Object Text.UTF8Encoding($false)))

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = Join-Path $buildRoot 'mc-connect-hostinger.zip'
$archive = [IO.Compression.ZipFile]::Open($zipPath, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($entry in Get-ChildItem -LiteralPath $packageRoot -Recurse -Force) {
        $relative = $entry.FullName.Substring($packageRoot.Length + 1).Replace('\', '/')
        if ($entry.PSIsContainer) {
            $null = $archive.CreateEntry($relative + '/')
        } else {
            $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $entry.FullName, $relative)
        }
    }
} finally {
    $archive.Dispose()
}
$archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $forbidden = $archive.Entries | Where-Object {
        $_.FullName -match '^mc-connect/(\.env$|(?:chrome_snap_profile|vendor|temp-app|scratch|\.git)(/|$))' -or
        $_.FullName -match '(\.bak$|admin_test\.html$|/hot$|/sessions/[^/]+$|\\)'
    }
    if ($forbidden) { throw 'The package contains files outside the deployment allowlist.' }
    Write-Output "Validated ZIP entries: $($archive.Entries.Count)"
} finally {
    $archive.Dispose()
}
Write-Output "Package: $zipPath"
Write-Output "SHA256: $((Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash)"
