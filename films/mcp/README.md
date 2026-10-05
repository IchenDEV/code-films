# MCP 跑偏了

> 两边都写着“支持 MCP”，说的却是两种方言。

一支关于 MCP、代码模式、客户端兼容性与执行沙箱的中文技术短片。暗色画面、铜色线条，使用程序绘制的接口、凭据、支持矩阵和纸片讲述个人开发经验。

16:9，1920×1080，30 fps，中文旁白与字幕。

| 版本 | 旁白 | 时长 | 观看 |
|---|---|---|---|
| E | Ian | 2 分 40 秒 | [下载 E 版](https://github.com/IchenDEV/code-films/releases/download/mcp-v1.0/mcp-E-zh.mp4) |
| F（默认） | Evan Zhao | 2 分 42 秒 | [下载 F 版](https://github.com/IchenDEV/code-films/releases/download/mcp-v1.0/mcp-F-zh.mp4) |

[原文《MCP 跑偏了》](article.md) · [素材与授权](CREDITS.md)

## 制作与预览

从仓库根目录运行。依赖与其他影片共用 Node、Python、ffmpeg；本片使用 HyperFrames **0.8.124**。HyperFrames 需要 Node 22+；画面使用系统安装的 Noto CJK 和 DejaVu 字体。

```bash
npm install
npx playwright install chromium
pip install -r requirements.txt
npm install -g hyperframes@0.8.124

./run.sh mcp timeline F      # 用保存的配音时长与逐字对齐数据重建画面，无需 API
./run.sh mcp preview F       # HyperFrames Studio
./run.sh mcp stills F --at 20,45,70,100,125,150
./run.sh mcp check F         # 重建契约、缓存与版本隔离测试，以及 HyperFrames 检查
```

省略版本时使用 F；把 `F` 换成 `E` 即可使用 Ian。E、F 共用 `script.json` 和 `src/`，各自有独立的时间轴、声音与渲染目录，可以分别重建。

仓库附带两版完整的画面、实测配音时长和逐字对齐数据。音频与成片保存在本地并由 Git 忽略，成片通过 Release 分发。从新克隆恢复旁白与混音，需要已登录的 [ElevenLabs CLI](https://www.npmjs.com/package/@elevenlabs/cli)：

```bash
./run.sh mcp tts F           # 逐句合成与强制对齐；文本、声音、语境未变时使用缓存
./run.sh mcp audio F         # 重建时间轴，程序作曲、音效与旁白混音到 -16 LUFS
./run.sh mcp check F
./run.sh mcp render F        # 1080p30 母版
./run.sh mcp compress F      # H.265 交付版

# 完整流程
./run.sh mcp all E
```

使用系统 Chromium 的 Linux 环境可设置 `HYPERFRAMES_BROWSER_PATH=/usr/bin/chromium`。本地交付文件为 `out/E/MCP跑偏了_E_1080p_h265.mp4` 和 `out/F/MCP跑偏了_F_1080p_h265.mp4`。

## 时间与声音

画面与音效共用 `build_timeline.py` 生成的事件时间：插头咔哒、凭据重试、扩展层落下、纸片落地都锚定在旁白的句子或分句上。结尾卡片的落地时间由同一组重力与回弹参数计算，动画和声音一起重排。

旁白合成速度为 1.1；较慢的长句以保持音高的方式加速，目标约 4.9 字/秒，最多 1.18 倍。较快的句子会放慢。停顿直接写在脚本里，声音和语速参数集中在 `film.json`。选择声音时，在完整配乐和混音中试听。

改词或改声音后，依次执行 `tts → audio → check → render → compress`。改变语速处理参数会复用原始合成音频，并重做处理与对齐。缺失、损坏或过期的输入会阻止重建；渲染前也会检查混音是否与当前时间轴和旁白相符。

## 文件

| 文件 | 内容 |
|---|---|
| `film.json` | 输出规格、默认版本、E/F 声音与语速参数 |
| `script.json` / `article.md` | 旁白、幕结构、停顿与原文 |
| `src/` | HTML 样式与一条可任意定位的 GSAP 动画时间轴 |
| `timing/E/`、`timing/F/` | 各版实测时长与按音频内容缓存的逐字对齐数据 |
| `timeline_E.json`、`timeline_F.json` | 各版画面、字幕与音效事件时间 |
| `film/E/`、`film/F/` | 可直接预览的 HyperFrames 项目 |
| `tts.py` / `align.py` | 旁白合成、静音修剪、变速与强制对齐 |
| `build_timeline.py` / `audio.py` | 时间轴、物理事件、程序配乐与混音 |
| `run.sh` / `project.py` | 仓库命令入口、配置与版本路径 |
| `tests/` | 离线重建、版本隔离、缓存与失效输入的契约 |
| `out/E/`、`out/F/` | 本地配音缓存、混音中间文件、截帧与成片 |
