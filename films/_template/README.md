# 新片模板

`./run.sh new <片名>` 会复制这个目录。之后：

1. 改 `film.json`（片名、语言、输出文件名、旁白声音）；
2. 在 `script.mjs` 写旁白与镜头表；
3. 在 `shots/*.js` 写镜头函数，并在 `index.html` 里引入；
4. `score.py` 编曲，`sfx.py` 放音效；需要档案图就放进 `img/` 并列进 `film.json → images`；
5. `./run.sh <片名> timeline` → `stills` 检查画面 → `tts` → `timeline` → `audio` → `render`。
