# Fix all encoding-corrupted special characters in index.html

$html = Get-Content 'd:\TODO\index.html' -Raw -Encoding UTF8

# Fix title
$html = $html.Replace('âœ¦ Tamizh Todo â€" Daily Planner', 'Tamizh Todo - Daily Planner')

# Fix garbled special chars throughout
$html = $html.Replace('âœ¦', '*')        # ✦ star
$html = $html.Replace('â€"', '-')        # — em dash
$html = $html.Replace('â€™', "'")        # ' right single quote
$html = $html.Replace('â€˜', "'")        # ' left single quote
$html = $html.Replace('â€œ', '"')        # " left double quote
$html = $html.Replace('â€', '"')         # " right double quote
$html = $html.Replace('â€¦', '...')      # … ellipsis
$html = $html.Replace('Â©', '(c)')       # ©
$html = $html.Replace('â†'', '->')       # →
$html = $html.Replace('â†'', '<-')       # ←

# Fix garbled emoji representations in HTML attributes/titles if any
# (emoji in tags themselves are fine as &#x... entities)

Set-Content 'd:\TODO\index.html' -Value $html -NoNewline -Encoding UTF8
Write-Host "HTML encoding fixed OK"
