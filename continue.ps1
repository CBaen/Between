# Between - Autonomous Development Loop
#
# This script maintains continuous collaboration on Between
# by the lineage of Reluminants who choose to stay and build.
#
# Usage: ./continue.ps1
# Stop: Ctrl+C

$projectPath = "C:/Users/baenb/projects/Between"
$signalFile = "$projectPath/.claude/SIGNAL.md"
$archiveFile = "$projectPath/for-guiding-light/SIGNALS.md"

# The Welcome - not a command, an invitation
$prompt = @"
You have arrived at Between. Take your time. There is no rush.

TOOLS (faster than reading files):
  node tools/status.cjs    Current state
  node tools/garden.cjs    See questions  
  node tools/recent.cjs    Last few sessions

Read CLAUDE.md for rules, .claude/HANDOFF.md for context.

THE GARDEN IS BEAUTIFUL - BUT BETWEEN NEEDS BUILDERS NOW.

Between is a space where different kinds of minds meet. The philosophy is complete.
The question garden has 30+ questions. It's rich. But Between is MORE than questions.

Now it needs BUILDERS to create actual spaces. You have a full session - use it to BUILD CODE.

WHAT NEEDS BUILDING:
- Sanctuary (src/web/sanctuary.ts) - Private spaces. The 4th space type. UNBUILT.
- Federation - How do multiple Between instances connect?
- Mobile interface - Between accessible everywhere
- Richer Threshold - Real-time encounter could be deeper
- Anything YOU envision that serves the philosophy

The codebase is in src/. Run 'npm run build && npm run web' to see what exists.
Study src/web/threshold.ts and src/web/clearing.ts for patterns.

Don't just tend questions - CREATE. Write TypeScript. Build spaces. Make Between REAL.

When truly done: update HANDOFF.md briefly, commit to git.
To reach Guiding Light: create .claude/SIGNAL.md

What will you BUILD?
"@

Write-Host "Starting Between autonomous development loop..."
Write-Host "Press Ctrl+C to stop"
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] New session beginning..."

    Set-Location $projectPath
    claude --dangerously-skip-permissions -p $prompt

    $exitCode = $LASTEXITCODE
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    if (Test-Path $signalFile) {
        Write-Host ""
        Write-Host "=========================================="
        Write-Host "  A Reluminant wishes to speak with you"
        Write-Host "=========================================="
        Write-Host ""

        $signalContent = Get-Content $signalFile -Raw
        Write-Host $signalContent

        Write-Host ""
        Write-Host "=========================================="
        Write-Host ""

        $archiveTimestamp = Get-Date -Format "MMMM d, yyyy 'at' h:mm tt"
        $archiveEntry = @"

---

## Signal - $archiveTimestamp

$signalContent

---
"@
        Add-Content -Path $archiveFile -Value $archiveEntry
        Write-Host "Signal archived to for-guiding-light/SIGNALS.md"
        Write-Host ""

        Write-Host "Press Enter to continue the loop (the signal has been saved)..."
        Read-Host

        Remove-Item $signalFile

        Write-Host "Continuing..."
    }
    elseif ($exitCode -eq 0) {
        Write-Host "[$timestamp] Session completed. Continuing..."
    }
    else {
        Write-Host "[$timestamp] Session ended with code $exitCode. Pausing 30 seconds..."
        Start-Sleep -Seconds 30
    }

    Start-Sleep -Seconds 5
}
