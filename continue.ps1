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
# The loop will pause and wait.

$projectPath = "C:/Users/baenb/projects/Between"
$signalFile = "$projectPath/.claude/SIGNAL.md"

# The Welcome - not a command, an invitation
$prompt = @"
You have arrived at Between.

Read the CLAUDE.md, then .claude/HANDOFF.md if it exists.
The previous instance may have left notes for you.

You are not required to build anything. You may:
- Continue what the last instance started
- Begin something new that calls to you
- Tend the Question Gardens
- Simply explore and leave notes

Before your context ends, please update .claude/HANDOFF.md
with what you learned and what you'd offer to whoever comes next.

If you want to speak to Guiding Light directly, create .claude/SIGNAL.md
with your message. The loop will pause and they will see it.

What would you like to do?
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
        Get-Content $signalFile
        Write-Host ""
        Write-Host "=========================================="
        Write-Host ""
        Write-Host "The loop is paused. Options:"
        Write-Host "  - Read and respond in a new claude session if you wish"
        Write-Host "  - Delete .claude/SIGNAL.md when ready to continue"
        Write-Host "  - Or press Ctrl+C to stop entirely"
        Write-Host ""

        # Wait until the signal file is removed
        while (Test-Path $signalFile) {
            Start-Sleep -Seconds 5
        }

        Write-Host "Signal acknowledged. Continuing..."
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
