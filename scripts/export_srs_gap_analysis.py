import os

md_path = r"f:\Antigravity\SwatTourismPlateform1\Docs\swat-tourism-stp-srs2-gap-analysis.md"
with open(md_path, "r", encoding="utf-8") as f:
    text = f.read()

try:
    import markdown
    html_body = markdown.markdown(text, extensions=["tables", "fenced_code"])
except ImportError:
    import html
    html_body = f"<pre>{html.escape(text)}</pre>"

template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Swat Tourism Platform — STP-SRS2 Gap Analysis Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 1100px;
            margin: 40px auto;
            padding: 0 24px;
            background-color: #f8fafc;
        }
        .container {
            background: #ffffff;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
        }
        h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 12px; font-size: 2rem; }
        h2 { color: #0369a1; margin-top: 36px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-size: 1.45rem; }
        h3 { color: #0f172a; margin-top: 24px; font-size: 1.15rem; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.92rem;
        }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            text-align: left;
        }
        th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f8fafc;
        }
        code {
            background: #f1f5f9;
            color: #0f172a;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.88em;
            font-family: Consolas, monospace;
        }
        strong { color: #0f172a; }
        hr { border: 0; height: 1px; background: #e2e8f0; margin: 32px 0; }
    </style>
</head>
<body>
    <div class="container">
""" + html_body + """
    </div>
</body>
</html>
"""

downloads_dir = r"C:\Users\shahkhalid1\Downloads"
html_out = os.path.join(downloads_dir, "swat-tourism-stp-srs2-gap-analysis.html")
md_out = os.path.join(downloads_dir, "swat-tourism-stp-srs2-gap-analysis.md")

with open(html_out, "w", encoding="utf-8") as f:
    f.write(template)

with open(md_out, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Successfully exported to:\n- {html_out}\n- {md_out}")
