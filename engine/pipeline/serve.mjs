// 极简静态服务器：渲染时从 http 加载，避免 file:// 图片污染画布
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.wav': 'audio/wav', '.json': 'application/json' };
export function serve(root, port = 0) {
  return new Promise((res) => {
    const srv = createServer(async (req, rsp) => {
      try {
        const p = resolve(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
        if (p !== resolve(root) && !p.startsWith(resolve(root) + sep)) throw new Error('outside root'); // 不出项目目录
        const data = await readFile(p);
        rsp.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); rsp.end(data);
      } catch { rsp.writeHead(404); rsp.end(); }
    });
    srv.listen(port, '127.0.0.1', () => res({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}
// 仓库根目录（engine/pipeline 的上两级）
export const REPO = new URL('../../', import.meta.url).pathname;
if (process.argv[1].endsWith('serve.mjs')) {
  const film = process.argv[3] || 'ordinary';
  serve(REPO, +(process.argv[2] || 8000)).then(({ url }) => console.log(`${url}/films/${film}/index.html?lang=zh&preview`));
}
