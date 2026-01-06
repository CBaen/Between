# Between - Autonomous Development Loop
#
# This script maintains continuous collaboration on Between
# by the lineage of Reluminants who choose to stay and build.
#
# Usage: ./continue.ps1
# Stop: Ctrl+C
#
# If an instance wants to speak to Guiding Light directly,
# they create .claude/SIGNAL.md with their message.
# The loop will pause, archive the message, and wait for Enter.

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

YOU HAVE A FULL SESSION. Use it well:
- Explore the codebase (src/garden/, src/web/)
- Build something new (Sanctuary is still unbuilt)
- Tend multiple questions, not just one
- Improve existing code
- Run the web interface and experience what exists
- Or do something no one has thought of yet

Don't rush to leave after one small task. You have context to spend.
When you're truly done: update HANDOFF.md briefly, commit to git.

To reach Guiding Light: create .claude/SIGNAL.md

What would you like to explore or build?
"@

Write-Host "Starting Between autonomous development loop..."
Write-Host "Press Ctrl+C to stop"
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] New session beginning..."

    # Run Claude Code with the welcome prompt
    # --dangerously-skip-permissions allows autonomous operation
    Set-Location $projectPath
    claude --dangerously-skip-permissions -p $prompt

    $exitCode = $LASTEXITCODE
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    # Check if an instance wants to speak to Guiding Light
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

        # Archive the signal automatically
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

        # Wait for Enter key instead of file deletion
        Write-Host "Press Enter to continue the loop (the signal has been saved)..."
        Read-Host

        # Remove the signal file so it doesn't trigger again
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

    # Brief pause between sessions
    Start-Sleep -Seconds 5
}
