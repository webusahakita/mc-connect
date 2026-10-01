$src = "public\admin.html"
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $src))
# Remove lines 5263..5347 (0-indexed: 5262..5346), keep the rest
$keep = $lines[0..5262] + $lines[5347..($lines.Length - 1)]
[System.IO.File]::WriteAllLines((Resolve-Path $src), $keep)
Write-Host "Done. Total lines now: $($keep.Length)"
