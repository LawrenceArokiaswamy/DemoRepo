"""Bundle docs/ into one self-contained HTML file (for sharing a preview link)."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "docs"
html = (root / "index.html").read_text()
css = (root / "assets/css/styles.css").read_text()
html = html.replace('<link rel="stylesheet" href="assets/css/styles.css">', "<style>\n" + css + "\n</style>")
def inline(m):
    return "<script>\n" + (root / m.group(1)).read_text() + "\n</script>"
html = re.sub(r'<script src="(assets/js/[^"]+)"></script>', inline, html)
if "--fragment" in sys.argv:  # strip the document shell for hosts that add their own
    html = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*|</head>\s*<body>|</body>\s*</html>\s*$", "", html, flags=re.I)
    html = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", html)
out = pathlib.Path(sys.argv[1])
out.write_text(html)
print(out, len(html))
