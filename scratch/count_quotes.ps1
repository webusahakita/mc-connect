$lines = Get-Content "c:\Users\Nawakara\.gemini\antigravity-ide\scratch\mc-connect\scratch\test_soundboard_config.ps1"
$inSingle = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $num = $i + 1
    # Count single quotes in line
    $chars = $line.ToCharArray()
    for ($j = 0; $j -lt $chars.Count; $j++) {
        if ($chars[$j] -eq "'") {
            $inSingle = -not $inSingle
            Write-Host "Line $num Col $($j+1): inSingle is now $inSingle"
        }
    }
}
Write-Host "Final inSingle: $inSingle"
