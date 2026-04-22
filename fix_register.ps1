$filePath = 'd:\TODO\script.js'
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)

# Replace lines 1422 (index 1421) through 1424 (index 1423) with new block
$newLines = @(
    "    // Only show avatar picker if user hasn't set one before on this browser",
    "    var alreadyHasAvatar = !!localStorage.getItem('tamizh_todo_avatar_set');",
    "    if (!alreadyHasAvatar) {",
    "      showToast('Welcome ' + authUsername + '! Now pick your character!');",
    "      setTimeout(function() { showAvatarPicker(true); }, 400);",
    "    } else {",
    "      showToast('Account created! Welcome, ' + authUsername + '!');",
    "    }"
)

$before = $lines[0..1422]  # up to and including line 1423 = "    showToast('Welcome, ' + authUsername + '! Now pick your character!');"
# Wait, original lines:
# 1420:     applyLoginGate();
# 1421:     toggleAuthModal();
# 1422:     fetchDataFromCloud();
# 1423:     showToast('Welcome, ' + authUsername + '! Now pick your character!');
# 1424:     // Show avatar picker (mandatory on first register)
# 1425:     setTimeout(function() { showAvatarPicker(true); }, 400);

# I need to replace index 1422 onwards.
$before = $lines[0..1421] 
$after = $lines[1426..($lines.Length-1)]

$result = $before + $newLines + $after
[System.IO.File]::WriteAllLines($filePath, $result, [System.Text.Encoding]::UTF8)
Write-Host "Done"
