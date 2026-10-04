"""档案图像：从 Wikimedia Commons 下载（全部为公有领域）。
在片子目录里运行：python3 ../../engine/pipeline/fetch_archive.py   下载 archive_sources.tsv 里的全部原图到 archive/
      python3 pipeline/fetch_archive.py search 关键词 ...   在 Commons 搜索文件
      python3 pipeline/fetch_archive.py info "File:xxx.jpg" ...  查看尺寸与授权
Commons 会限流：下载之间留了间隔，遇到 429 会自动等待重试。"""
import json, os, sys, time, urllib.parse, urllib.request
UA = {'User-Agent': 'OrdinaryFilm/1.0 (open-source documentary pipeline)'}
HERE = os.path.dirname(os.path.abspath(__file__))

def api(params):
    params.update(format='json')
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))

def info(titles):
    r = api(dict(action='query', titles='|'.join(titles), prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=2400))
    for p in r['query']['pages'].values():
        ii = (p.get('imageinfo') or [{}])[0]; m = ii.get('extmetadata', {})
        print(p['title'], '→', ii.get('width'), 'x', ii.get('height'), m.get('LicenseShortName', {}).get('value'))

def search(q, n=6):
    r = api(dict(action='query', list='search', srsearch=q, srnamespace=6, srlimit=n))
    for s in r['query']['search']: print('  ', s['title'])

def download():
    os.makedirs('archive', exist_ok=True)
    for line in open('archive_sources.tsv', encoding='utf-8'):  # 片子目录里的来源清单
        if line.startswith('#') or not line.strip(): continue
        name, _title, url = line.rstrip('\n').split('\t')
        if os.path.exists(f'archive/{name}'): continue
        for attempt in range(5):
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
                open(f'archive/{name}', 'wb').write(data); print(name, len(data)); break
            except Exception as e:
                print('retry', name, e); time.sleep(30 * (attempt + 1))
        time.sleep(8)

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'search': [search(q) for q in sys.argv[2:]]
    elif len(sys.argv) > 1 and sys.argv[1] == 'info': info(sys.argv[2:])
    else: download()
