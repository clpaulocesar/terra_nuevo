param(
  [string]$Source = (Join-Path $PSScriptRoot 'PROYECTO_TERRA.md'),
  [string]$Output = (Join-Path $PSScriptRoot 'PROYECTO_TERRA.docx')
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Escape-Xml([string]$Text) {
  [System.Security.SecurityElement]::Escape($Text)
}

function Paragraph([string]$Text, [string]$Style = 'Normal') {
  $safe = Escape-Xml $Text
  "<w:p><w:pPr><w:pStyle w:val=`"$Style`"/></w:pPr><w:r><w:t xml:space=`"preserve`">$safe</w:t></w:r></w:p>"
}

function TableRow([string[]]$Cells, [bool]$Header = $false) {
  $shade = if ($Header) { '<w:shd w:fill="9E1B32"/>' } else { '' }
  $color = if ($Header) { 'FFFFFF' } else { '1F2933' }
  $bold = if ($Header) { '<w:b/>' } else { '' }
  $body = ($Cells | ForEach-Object {
    $safe = Escape-Xml $_
    "<w:tc><w:tcPr><w:tcW w:w=`"2600`" w:type=`"dxa`"/>$shade</w:tcPr><w:p><w:r><w:rPr>$bold<w:color w:val=`"$color`"/></w:rPr><w:t xml:space=`"preserve`">$safe</w:t></w:r></w:p></w:tc>"
  }) -join ''
  "<w:tr>$body</w:tr>"
}

$lines = Get-Content -LiteralPath $Source -Encoding UTF8
$body = New-Object System.Collections.Generic.List[string]
$body.Add('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="4800"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="9E1B32"/></w:rPr><w:t>TERRA AUTOSERVICIO</w:t></w:r></w:p>')
$body.Add('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="360"/></w:pPr><w:r><w:rPr><w:sz w:val="30"/></w:rPr><w:t>Documentacion tecnica y funcional</w:t></w:r></w:p>')
$body.Add('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="420"/></w:pPr><w:r><w:rPr><w:color w:val="667085"/></w:rPr><w:t>Guia de arquitectura, operacion y desarrollo</w:t></w:r></w:p>')
$body.Add('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')

$inCode = $false
$table = @()
function Flush-Table {
  if ($script:table.Count -eq 0) { return }
  $rows = $script:table | ForEach-Object { @($_.Trim('|').Split('|') | ForEach-Object { $_.Trim() }) }
  $xmlRows = for ($i = 0; $i -lt $rows.Count; $i++) { TableRow $rows[$i] ($i -eq 0) }
  $script:body.Add("<w:tbl><w:tblPr><w:tblW w:w=`"0`" w:type=`"auto`"/><w:tblBorders><w:top w:val=`"single`" w:sz=`"4`" w:color=`"D0D5DD`"/><w:left w:val=`"single`" w:sz=`"4`" w:color=`"D0D5DD`"/><w:bottom w:val=`"single`" w:sz=`"4`" w:color=`"D0D5DD`"/><w:right w:val=`"single`" w:sz=`"4`" w:color=`"D0D5DD`"/><w:insideH w:val=`"single`" w:sz=`"4`" w:color=`"E4E7EC`"/><w:insideV w:val=`"single`" w:sz=`"4`" w:color=`"E4E7EC`"/></w:tblBorders></w:tblPr>$($xmlRows -join '')</w:tbl>")
  $script:table = @()
}

foreach ($line in $lines) {
  if ($line -match '^```') { Flush-Table; $inCode = -not $inCode; continue }
  if ($inCode) { $body.Add((Paragraph $line 'Code')); continue }
  if ($line -match '^\|') {
    if ($line -match '^\|[-| :]+\|$') { continue }
    $table += $line; continue
  }
  Flush-Table
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  if ($line -match '^# (.+)') { continue }
  if ($line -match '^## (.+)') { $body.Add((Paragraph $Matches[1] 'Heading1')); continue }
  if ($line -match '^### (.+)') { $body.Add((Paragraph $Matches[1] 'Heading2')); continue }
  if ($line -match '^[-*] (.+)') { $body.Add((Paragraph ('• ' + $Matches[1]) 'Normal')); continue }
  if ($line -match '^\d+\. (.+)') { $body.Add((Paragraph ($line) 'Normal')); continue }
  $clean = $line -replace '`', '' -replace '\*\*', ''
  $body.Add((Paragraph $clean 'Normal'))
}
Flush-Table

$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
 <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:color w:val="344054"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="440" w:after="180"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="9E1B32"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="280" w:after="120"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/><w:color w:val="7A1627"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/><w:shd w:fill="F2F4F7"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr></w:style>
</w:styles>
'@

$document = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><w:document xmlns:w=`"http://schemas.openxmlformats.org/wordprocessingml/2006/main`"><w:body>$($body -join '')<w:sectPr><w:pgSz w:w=`"11906`" w:h=`"16838`"/><w:pgMar w:top=`"1440`" w:right=`"1440`" w:bottom=`"1440`" w:left=`"1440`"/></w:sectPr></w:body></w:document>"
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ('terra-docx-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path "$temp/_rels", "$temp/word", "$temp/word/_rels" -Force | Out-Null
[IO.File]::WriteAllText("$temp/[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')
[IO.File]::WriteAllText("$temp/_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
[IO.File]::WriteAllText("$temp/word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
[IO.File]::WriteAllText("$temp/word/document.xml", $document)
[IO.File]::WriteAllText("$temp/word/styles.xml", $styles)
if (Test-Path $Output) { Remove-Item -LiteralPath $Output -Force }
$archive = [System.IO.Compression.ZipFile]::Open($Output, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $temp -Recurse -File | ForEach-Object {
    $entryName = $_.FullName.Substring($temp.Length + 1).Replace('\', '/')
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entryName) | Out-Null
  }
} finally {
  if ($archive) { $archive.Dispose() }
}
Remove-Item -LiteralPath $temp -Recurse -Force
Write-Output "DOCX generado: $Output"
