"""把 archive/ 里的原图处理成影片用的 film/img/*.jpg：
- 彩色原作（壁画、星图、纸草、照片）只缩放、裁边；
- 黑白版画与手稿反相成“黑底上的发光线条”，并染成骨白色，与片中的线描统一。
在片子目录里运行：python3 process_archive.py"""
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
OUT = 'img/'

def save(src, name, maxside=2600, crop_white=False):
    im = Image.open('archive/' + src).convert('RGB')
    if crop_white:  # 去掉扫描件四周的白边
        a = np.asarray(im).astype(int); nonwhite = a.min(-1) < 215
        cols = np.where(nonwhite.mean(0) > 0.5)[0]; rows = np.where(nonwhite.mean(1) > 0.5)[0]
        im = im.crop((cols[0] + 12, rows[0] + 12, cols[-1] - 12, rows[-1] - 12))
    im.thumbnail((maxside, maxside), Image.LANCZOS)
    im.save(OUT + name, quality=92); print(name, im.size)

def engraving(src, name, lo, hi, tint=(236, 226, 204), maxside=2600):
    im = Image.open('archive/' + src).convert('L')
    im.thumbnail((maxside, maxside), Image.LANCZOS)
    a = np.asarray(im).astype(float) / 255
    v = np.clip((hi - a) / (hi - lo), 0, 1)  # 纸色 → 黑，墨线 → 亮
    Image.fromarray(np.stack([v * c for c in tint], -1).astype(np.uint8)).save(OUT + name, quality=92); print(name, im.size)

if __name__ == '__main__':
    save('cellarius_ptolemy.jpg', 'ptolemy.jpg'); save('cellarius_copernicus.jpg', 'copernicus.jpg')
    save('creation_adam.jpg', 'adam.jpg'); save('vitruvian.jpg', 'vitruvian.jpg'); save('geb_nut_shu.jpg', 'nut.jpg')
    save('purkinje.jpg', 'purkinje.jpg'); save('fuxi_nuwa.jpg', 'fuxi.jpg', 3000, crop_white=True)
    save('pale_blue_dot.png', 'paleblue.jpg')
    engraving('chain_of_being.jpg', 'chain.jpg', 0.25, 0.8)
    engraving('darwin_tree.png', 'darwin.jpg', 0.3, 0.75)
    engraving('huxley.jpg', 'huxley.jpg', 0.2, 0.85)
    engraving('descartes.gif', 'descartes.jpg', 0.2, 0.85)
    engraving('flammarion.jpg', 'flammarion.jpg', 0.2, 0.85)
