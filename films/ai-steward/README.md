# AI 越来越能干，人为什么越来越忙？

> 让 AI 协调执行，让人掌握方向。

中文概念短片，白板手绘风格，约 2 分 33 秒，1920×1080，30 fps。邮件、用户反馈、群消息、Agent 回执和定时事件进入同一张工作图；大管家随反馈调整安排，人负责目标、取舍和关键决定。

**概念演示，非产品实录。** 片中展示的是一种有待实现与验证的工作方式。

- 成片：[下载白板版](https://github.com/IchenDEV/code-films/releases/download/ai-steward-v1.0/ai-steward-zh.mp4)；本地位于 `out/AI越来越能干_人为什么越来越忙_白板版.mp4`
- 公众号文章：[公众号文案.md](公众号文案.md)
- 素材与授权：[CREDITS.md](CREDITS.md)

## 制作与预览

从仓库根目录运行。依赖与《凡人》共用 Node、Python、ffmpeg 和 Playwright；本片另使用 HyperFrames CLI，归档时的版本为 **0.8.124**。

```bash
npm install
npx playwright install chromium
pip install -r requirements.txt
npm install -g hyperframes@0.8.124

./run.sh ai-steward timeline     # 用已保存的配音时长与逐字对齐数据重建画面
./run.sh ai-steward check        # 重建契约测试与 HyperFrames 检查
./run.sh ai-steward preview      # 打开 HyperFrames Studio
./run.sh ai-steward stills --at 15,40,65,90,115,140
./run.sh ai-steward render       # 1080p30 → out/AI越来越能干_人为什么越来越忙_白板版.mp4
```

源码附带正式版本的时间轴、配音时长和字幕对齐数据，重建画面无需 API。旁白音频、混音与成片按仓库惯例保存在本地并由 Git 忽略；从新克隆恢复声音需合成旁白，再排时间轴、混音：

```bash
./run.sh ai-steward tts          # 已登录的 ElevenLabs CLI；逐句合成并对齐
./run.sh ai-steward timeline
./run.sh ai-steward audio        # 从画面导出音效事件，生成配乐并混音
./run.sh ai-steward render
```

`tts` 与 `align` 都按内容缓存。改变声音会改变实测时长，应重新生成时间轴与混音。旁白参数集中在 `film.json`。

在使用系统 Chromium 的 Linux 环境中，可为这些命令设置 `HYPERFRAMES_BROWSER_PATH=/usr/bin/chromium`。

## 文件

| 文件 | 内容 |
|---|---|
| `film.json` | 片名、输出规格、旁白声音与参数 |
| `script.json` | 中文旁白、幕结构、停顿和字幕断句 |
| `src/` | 白板绘制、镜头运动与 HTML 模板 |
| `timing/` | 正式版的配音时长与逐字对齐数据 |
| `timeline.json` | 由实测声音排出的画面、字幕时间轴 |
| `film/` | 可直接预览的 HyperFrames 合成项目与本地字体、绘图库 |
| `tts.py` / `align.py` | 合成旁白、修剪静音、限制语速、逐字对齐 |
| `build_timeline.py` | 重建时间轴和 `film/index.html` |
| `export_sfx.mjs` / `audio.py` | 导出绘制音效事件、程序作曲与混音 |
| `tests/` | 独立重建与缺失、损坏输入的契约测试 |
| `out/` | 本地旁白、音效事件、混音中间文件与成片 |
