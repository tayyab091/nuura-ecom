Param(
    [string]$BranchOverride
)

# Interactive push helper: lists remotes and prompts user to choose one.
Write-Host "Available git remotes:"
$remotes = git remote -v 2>$null | Select-String "\w+\s+(\S+)" -AllMatches | ForEach-Object { $_.Matches[0].Value }
if (-not $remotes) { git remote -v; exit 1 }

$uniqueRemotes = git remote | Sort-Object -Unique
[int]$i = 1
$list = @()
foreach ($r in $uniqueRemotes) {
    $url = git remote get-url $r 2>$null
    Write-Host "[$i] $r -> $url"
    $list += $r
    $i++
}

Write-Host "Select a remote to push to (enter number), or type a remote name:" -NoNewline
$choice = Read-Host
if ($choice -match '^[0-9]+$') {
    $idx = [int]$choice - 1
    if ($idx -ge 0 -and $idx -lt $list.Count) { $remote = $list[$idx] } else { Write-Host "Invalid selection"; exit 1 }
} else {
    $remote = $choice
}

if (-not $remote) { Write-Host "No remote chosen"; exit 1 }

$branch = $BranchOverride
if (-not $branch) { $branch = git rev-parse --abbrev-ref HEAD }

Write-Host "Pushing branch '$branch' to remote '$remote'..."
git push $remote $branch
$LASTEXITCODE | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "git push exited with code $LASTEXITCODE"; exit $LASTEXITCODE }
Write-Host "Push complete."
