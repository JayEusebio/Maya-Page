"""Bundle the site into one self-contained HTML file (styles, scripts, images, fonts inlined)."""
import base64, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, '_tools')
VENDOR = os.path.join(TOOLS, 'vendor')
OUT = os.path.join(ROOT, 'Maya-Deposit-747Live.html')

def read(p, mode='r'):
    with open(p, mode, **({} if 'b' in mode else {'encoding': 'utf-8'})) as f:
        return f.read()

def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(read(path, 'rb')).decode()

MIME = {'.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'}

html = read(os.path.join(ROOT, 'index.html'))
css = read(os.path.join(ROOT, 'css', 'style.css'))
js = read(os.path.join(ROOT, 'js', 'main.js'))

# fonts: keep latin + latin-ext subsets (₱ lives in latin-ext), embed the woff2 files
fcss = read(os.path.join(VENDOR, 'fonts.css'))
blocks = re.findall(r'/\* ([a-z-]+) \*/\s*(@font-face\s*\{.*?\})', fcss, re.S)
font_css = []
for subset, block in blocks:
    if subset not in ('latin', 'latin-ext'):
        continue
    url = re.search(r'url\((https://[^)]+\.woff2)\)', block).group(1)
    local = os.path.join(VENDOR, 'f_' + re.sub(r'[^A-Za-z0-9.]', '_', url.split('/')[-1]))
    if not os.path.exists(local):
        subprocess.run(['curl', '-sfL', url, '-o', local], check=True)
    font_css.append(block.replace(url, data_uri(local, 'font/woff2')))
print('fonts embedded:', len(font_css))

# images referenced from the HTML
def inline_asset(m):
    rel = m.group(1)
    path = os.path.join(ROOT, rel.replace('/', os.sep))
    return data_uri(path, MIME[os.path.splitext(path)[1]])

html = re.sub(r'<link rel="preconnect"[^>]*>\n', '', html)
html = re.sub(r'<link href="https://fonts\.googleapis\.com[^>]*>\n', '', html)
html = re.sub(r'<link rel="preload" as="image"[^>]*>\n', '', html)
html = re.sub(r'(?<=["(])(assets/web/[A-Za-z0-9._-]+)(?=[")])', inline_asset, html)
leftover = re.findall(r'assets/web/[^"\s)]+', html)
assert not leftover, leftover

# styles and scripts
html = html.replace('<link rel="stylesheet" href="css/style.css">',
                    '<style>\n' + '\n'.join(font_css) + '\n' + css + '\n</style>')
libs = {
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js': 'gsap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js': 'ScrollTrigger.min.js',
    'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js': 'lenis.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js': 'three.min.js',
}
for url, name in libs.items():
    tag = f'<script src="{url}"></script>'
    assert tag in html, url
    code = read(os.path.join(VENDOR, name)).replace('</script', '<\\/script')
    html = html.replace(tag, '<script>' + code + '</script>')
html = html.replace('<script src="js/main.js"></script>', '<script>\n' + js.replace('</script', '<\\/script') + '\n</script>')
assert 'src="js/' not in html and 'href="css/' not in html

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print('wrote', OUT, round(os.path.getsize(OUT) / 1024 / 1024, 2), 'MB')
