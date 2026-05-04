#!/usr/bin/env python3
"""Convert CAPSTONE_REPORT.md -> styled HTML, then DOCX + PDF via LibreOffice."""
import markdown, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
md_path = ROOT / "CAPSTONE_REPORT.md"
html_path = ROOT / ".report_build" / "CAPSTONE_REPORT.html"

text = md_path.read_text(encoding="utf-8")

html_body = markdown.markdown(
    text,
    extensions=["tables", "fenced_code", "toc", "sane_lists"],
)

css = """
@page { size: A4; margin: 22mm 20mm 22mm 22mm; }
body {
  font-family: 'Liberation Serif', 'Times New Roman', Georgia, serif;
  font-size: 11.5pt;
  line-height: 1.55;
  color: #111;
  text-align: justify;
}
h1 {
  font-family: 'Liberation Sans', Arial, sans-serif;
  font-size: 22pt;
  margin-top: 28pt;
  margin-bottom: 14pt;
  page-break-before: always;
  border-bottom: 2px solid #222;
  padding-bottom: 6pt;
}
h1:first-of-type { page-break-before: avoid; }
h2 {
  font-family: 'Liberation Sans', Arial, sans-serif;
  font-size: 16pt;
  margin-top: 22pt;
  margin-bottom: 10pt;
  color: #1a1a1a;
}
h3 {
  font-family: 'Liberation Sans', Arial, sans-serif;
  font-size: 13pt;
  margin-top: 16pt;
  margin-bottom: 8pt;
}
p { margin: 0 0 10pt 0; }
ul, ol { margin: 0 0 10pt 22pt; }
li { margin-bottom: 4pt; }
hr { border: none; border-top: 1px solid #999; margin: 18pt 0; }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 10pt 0 14pt 0;
  font-size: 10.5pt;
}
th, td {
  border: 1px solid #555;
  padding: 5pt 7pt;
  text-align: left;
  vertical-align: top;
}
th { background: #ececec; font-family: 'Liberation Sans', Arial, sans-serif; }
code {
  font-family: 'Liberation Mono', 'Courier New', monospace;
  font-size: 10pt;
  background: #f3f3f3;
  padding: 1pt 3pt;
  border-radius: 3px;
}
pre {
  font-family: 'Liberation Mono', 'Courier New', monospace;
  font-size: 9.5pt;
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 8pt 10pt;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 8pt 0 14pt 0;
}
pre code { background: transparent; padding: 0; }
strong { color: #000; }
em { color: #222; }
"""

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Locus — Capstone Report</title>
<style>{css}</style>
</head>
<body>
{html_body}
</body>
</html>
"""

html_path.parent.mkdir(parents=True, exist_ok=True)
html_path.write_text(html, encoding="utf-8")
print(f"HTML written: {html_path}")

outdir = ROOT
for fmt in ("docx", "pdf"):
    print(f"Converting to {fmt} ...")
    r = subprocess.run(
        ["libreoffice", "--headless", "--convert-to", fmt,
         "--outdir", str(outdir), str(html_path)],
        capture_output=True, text=True, timeout=300,
    )
    if r.returncode != 0:
        print("STDOUT:", r.stdout)
        print("STDERR:", r.stderr)
        sys.exit(r.returncode)
    print(r.stdout.strip())

print("Done.")
