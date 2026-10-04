# 代码电影 · Code Films

**用代码做纪录片：画面逐帧程序绘制，配乐由代码作曲，旁白由 AI 合成，一份脚本驱动一切。**
*Documentary films made entirely in code — procedural picture, code-composed score, AI narration, all driven by one script file.*

## 影片

| 片名 | 时长 | 简介 |
|---|---|---|
| [**凡人 · Ordinary**](films/ordinary/) | 约 6 分钟，中 / 英 | 三重退位：位置、起源、心智。科学所做的，或许只有一件事：把我们，从神坛上请下来。 |

成片见 [Releases](../../releases)。

## 工作流

```
films/<片名>/script.mjs ──► tts.py ──► vo_trim / vo_pace ──► build_timeline.mjs ──┬──► mix.py ──► loudnorm
  (旁白 + 镜头表)          (ElevenLabs)  (修剪静音、控语速)     (按实测时长排镜头)      │   (sfx.py + score.py + 旁白)
                                                                                 └──► render.mjs ──► mp4 ──► compress.sh
                                                                                      (Chromium 渲染 shots/)
```

- **一份脚本决定一切**：`script.mjs` 写双语旁白与镜头表；镜头时长由实测旁白长度排出，画面和声音读同一条时间轴。
- **画面**：Canvas 2D 纯函数式逐帧绘制（任意帧可单独渲染、并行渲染），无头 Chromium 出帧，ffmpeg 编码；可叠加公有领域档案图（缓推缓移、版画反相）。
- **声音**：`orchestra.py` 是一支合成乐团（弦乐、铜管、合唱、钢琴、竖琴、太鼓……），片子用它编曲；`dsp.py` 是音效库；混音自动给旁白让位，响度标准化到 -16 LUFS。
- **旁白**：ElevenLabs CLI 逐句合成（带上下句语境、按内容缓存），自动修剪静音、限制语速；可用语音转写核对发音。

## 快速开始

依赖：Node 20+、Python 3.10+、ffmpeg、Noto CJK 字体；合成旁白需要已登录的 [ElevenLabs CLI](https://www.npmjs.com/package/@elevenlabs/cli)。

```bash
npm install && npx playwright install chromium
pip install -r requirements.txt

./run.sh ordinary preview     # 浏览器实时预览《凡人》
./run.sh ordinary stills zh @go+5 @recap   # 渲染任意镜头的任意时刻
./run.sh ordinary all         # 旁白 → 时间轴 → 混音 → 渲染 → 压缩
./run.sh new my-film          # 从模板新建一部片子
```

仓库里带着《凡人》排好的时间轴和处理好的档案图，**不合成旁白也能直接预览和渲染画面**。

## 目录

```
engine/web/          画面引擎：噪声与光晕、字幕、档案图推拉、调度与合成、可复用母题（火、星空、人物、手）
engine/pipeline/     流水线：旁白、控速、时间轴、混音、乐团、音效库、渲染、截帧、压缩、档案图下载、飞书交付（可选）
films/<片名>/        一部片子：film.json（配置）、script.mjs、shots/、score.py、sfx.py、img/、docs/
films/_template/     新片模板（最小可运行的片子）
docs/WORKFLOW.md     工作流与踩过的坑
run.sh               ./run.sh <片名> <步骤>
```

## 授权

代码以 [MIT](LICENSE) 授权。各片的档案图、字体与声音来源见各自目录下的 `CREDITS.md`。

---

## English

**Code Films** is a small toolkit for documentary films made entirely in code. Each film lives in `films/<name>/`: a `script.mjs` (bilingual narration + shot list), shot functions drawn with Canvas 2D, a score arranged with the built-in synth orchestra, and a sound-design file. The shared engine synthesizes narration with ElevenLabs, lays out shot timings from the measured narration, mixes and loudness-normalizes the sound, renders every frame in headless Chromium, and encodes with ffmpeg.

```bash
npm install && npx playwright install chromium && pip install -r requirements.txt
./run.sh ordinary preview     # live preview of "Ordinary"
./run.sh ordinary all         # narration → timeline → audio → render → compress
./run.sh new my-film          # start a new film from the template
```

First film: **[Ordinary (凡人)](films/ordinary/)** — three dethronements: of our place, our origin, and our mind. See [docs/WORKFLOW.md](docs/WORKFLOW.md) for the full process. Code is MIT-licensed.
