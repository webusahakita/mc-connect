# Script to move editInvoiceModal and addRiderModal OUTSIDE of any container,
# placing them just before </body>

$src = "public\admin.html"
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $src))

# Find the indices (0-based):
# editInvoiceModal starts at line 5185 (index 5184), ends at line 5221 (index 5220)
# addRiderModal starts at line 5223 (index 5222), ends at line 5262 (index 5261)
# Line 5264 (index 5263) is </div> - closing outer container
# Line 5264 (index 5263) should stay

$editModalStart = 5184  # line 5185
$editModalEnd   = 5221  # line 5221 (inclusive)
$riderModalStart = 5222 # line 5223
$riderModalEnd   = 5261 # line 5262 (inclusive)

# Extract the two modal blocks
$editModal  = $lines[$editModalStart..$editModalEnd]
$riderModal = $lines[$riderModalStart..$riderModalEnd]

# Build new lines:
# Keep everything up to and including line 5184 (index 5183, the last script tag)
# Then keep the closing </div> at index 5263, the inline script, </body>, </html>
# Skip the modal blocks where they were

$part1 = $lines[0..5183]          # Up to <script cms-overrides> line
$part2 = $lines[5263..($lines.Length - 1)]  # From </div> to end of file

# Find </body> in part2 and insert modals before it
$bodyCloseIdx = -1
for ($i = 0; $i -lt $part2.Length; $i++) {
    if ($part2[$i] -match '^\s*</body>') {
        $bodyCloseIdx = $i
        break
    }
}

if ($bodyCloseIdx -ge 0) {
    $before = $part2[0..($bodyCloseIdx - 1)]
    $after  = $part2[$bodyCloseIdx..($part2.Length - 1)]
    $newLines = $part1 + $before + $editModal + @("") + $riderModal + @("") + $after
} else {
    Write-Host "ERROR: </body> not found in part2!"
    exit 1
}

[System.IO.File]::WriteAllLines((Resolve-Path $src), $newLines)
Write-Host "Done. Total lines now: $($newLines.Length)"
