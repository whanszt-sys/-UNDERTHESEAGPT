"""Bundle the editable source modules into one self-contained HTML. No packages required."""
from pathlib import Path
import base64,json,re
project=Path(__file__).resolve().parent
root=project/'src'
photos=json.loads((root/'assets/sources.json').read_text())
for key,p in photos.items():
    assert not p.get('error'),f'Failed source asset: {key}'
    assert p.get('author') and p.get('license'),f'Missing image credit: {key}'
    p['data']='data:image/webp;base64,'+base64.b64encode((root/f'assets/{key}.webp').read_bytes()).decode()
def text(path):return (root/path).read_text()
def script(s):return re.sub(r'</script',r'<\\/script',s,flags=re.I)
data=text('data.js').replace('__PHOTOS__',json.dumps(photos,ensure_ascii=False,separators=(',',':')))
css=text('styles.css').replace('__REEF__',photos['reef']['data'])
page=text('index.template.html')
values={'CSS':css,'HERO':photos['hero']['data'],'THREE':script(text('vendor/three.min.js')),'GSAP':script(text('vendor/gsap.min.js')),'SCROLLTRIGGER':script(text('vendor/ScrollTrigger.min.js')),'DATA':script(data),'SCENE':script(text('scene.js')),'AUDIO':script(text('audio.js')),'APP':script(text('app.js'))}
for key,value in values.items():page=page.replace('__'+key+'__',value)
assert not re.search(r'__(?:CSS|HERO|GSAP|SCROLLTRIGGER|DATA|SCENE|AUDIO|APP|PHOTOS|REEF)__',page)
(project/'index.html').write_text(page,encoding='utf-8')
print(f'Built index.html: {len(page.encode()):,} bytes')
