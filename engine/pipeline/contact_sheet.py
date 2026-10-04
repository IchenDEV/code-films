"""把若干帧拼成一张对照图，方便逐帧检查。用法：python3 pipeline/contact_sheet.py out/sheet.jpg a.png b.png ..."""
import sys
from PIL import Image, ImageDraw
files = sys.argv[2:]; out = sys.argv[1]
w, h = 960, 540
cols = 2
rows = (len(files)+1)//2
S = Image.new('RGB', (w*cols, h*rows))
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    ImageDraw.Draw(im).text((8, 6), f.split('/')[-1][:-4], fill=(255, 255, 0))
    S.paste(im, ((i % cols)*w, (i//cols)*h))
S.save(out, quality=88)
