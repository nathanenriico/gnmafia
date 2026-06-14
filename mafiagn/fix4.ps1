$file = 'c:\Users\enric\OneDrive\Desktop\rifa-site\mafiagn\index.html'
$lines = Get-Content $file -Encoding UTF8
# DOCTYPE is at line 1 (index 0) and also duplicated - find the SECOND <!DOCTYPE
$docIdx = -1
for ($i = 1; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '<!DOCTYPE') { $docIdx = $i; break }
}
if ($docIdx -gt 0) {
    $result = $lines[$docIdx..($lines.Length-1)]
    Set-Content $file $result -Encoding UTF8
    Write-Host "Removed $docIdx duplicate lines. New total: $($result.Length)"
} else {
    Write-Host "No duplicate found, file OK"
}
