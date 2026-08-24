Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $root 'public\og.png'
$spritePath = Join-Path $root 'public\sprites\mario.png'

$canvas = New-Object System.Drawing.Bitmap 1200, 630
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$background = [System.Drawing.ColorTranslator]::FromHtml('#14181b')
$panel = [System.Drawing.ColorTranslator]::FromHtml('#20262a')
$border = [System.Drawing.ColorTranslator]::FromHtml('#3b454b')
$red = [System.Drawing.ColorTranslator]::FromHtml('#d94c3f')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#e6b83f')
$blue = [System.Drawing.ColorTranslator]::FromHtml('#63b8ef')
$white = [System.Drawing.ColorTranslator]::FromHtml('#f5f3ed')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#b8c0c5')
$brick = [System.Drawing.ColorTranslator]::FromHtml('#9f382f')
$brickDark = [System.Drawing.ColorTranslator]::FromHtml('#682923')

$graphics.Clear($background)

# Crisp NES-inspired frame and ground, kept secondary to the title.
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush $red), 0, 0, 1200, 12)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush $gold), 0, 12, 1200, 4)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush $panel), 56, 58, 1088, 474)
$graphics.DrawRectangle((New-Object System.Drawing.Pen $border, 2), 56, 58, 1088, 474)

for ($x = 0; $x -lt 1200; $x += 80) {
  $offset = if (([int]($x / 80) % 2) -eq 0) { 0 } else { 8 }
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $brick), $x, 566 + $offset, 76, 64 - $offset)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $brickDark), $x, 566 + $offset, 76, 6)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $gold), $x + 68, 566 + $offset, 8, 64 - $offset)
}

$sprites = [System.Drawing.Bitmap]::FromFile($spritePath)
$source = New-Object System.Drawing.Rectangle 0, 57, 18, 22
$destination = New-Object System.Drawing.Rectangle 86, 168, 234, 286
$graphics.DrawImage($sprites, $destination, $source, [System.Drawing.GraphicsUnit]::Pixel)

$eyebrowFont = New-Object System.Drawing.Font 'Segoe UI', 22, ([System.Drawing.FontStyle]::Bold)
$titleFont = New-Object System.Drawing.Font 'Arial Black', 55, ([System.Drawing.FontStyle]::Regular)
$subtitleFont = New-Object System.Drawing.Font 'Segoe UI', 25, ([System.Drawing.FontStyle]::Regular)
$urlFont = New-Object System.Drawing.Font 'Segoe UI', 20, ([System.Drawing.FontStyle]::Bold)

$graphics.DrawString('SMB1 ENGINE', $eyebrowFont, (New-Object System.Drawing.SolidBrush $red), 382, 116)
$graphics.DrawString('COMBINED', $titleFont, (New-Object System.Drawing.SolidBrush $white), 374, 158)
$graphics.DrawString('LEADERBOARD', $titleFont, (New-Object System.Drawing.SolidBrush $white), 374, 228)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush $blue), 382, 321, 122, 7)
$graphics.DrawString('Every board. Every runner. One ranking.', $subtitleFont, (New-Object System.Drawing.SolidBrush $muted), 382, 356)
$graphics.DrawString('smb1ecl.loopie.fr', $urlFont, (New-Object System.Drawing.SolidBrush $gold), 382, 430)

$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$eyebrowFont.Dispose()
$titleFont.Dispose()
$subtitleFont.Dispose()
$urlFont.Dispose()
$sprites.Dispose()
$graphics.Dispose()
$canvas.Dispose()

Write-Output "Created $outputPath"
