# Muse Bot 导航

非官方的 Meta Muse（muse.ai）中文目录。Git 管内容，网站只负责给人看。

**本站与 Meta、muse.ai 均无隶属、赞助或合作关系。**

在线阅读：<https://ddhjy.github.io/muse-bot-hub/>

姊妹站：[Grok Bot 导航](https://ddhjy.github.io/grok-bot-hub/)（同一套架构，另一个产品）

## 收什么，不收什么

只收 **Meta Muse** 这一个产品：2026-09-08 上线的个人 AI 智能体，每个人一台常驻的 Muse Secure VM，合上应用它也继续干活，入口是 Muse 应用、muse.ai、WhatsApp 和 Mac 桌面版。

不收：Discord 音乐机器人「Muse」、Muse Bot Builder 及其他同名产品、只评 Muse Spark 模型而不谈智能体产品的文章、失效链接、带跟踪参数的链接、微信群二维码、线下活动物料。完整边界见 [PRODUCT.md](PRODUCT.md)。

## 五分钟上手

需要 Node.js 22。生成 OG 卡片还需要 Python 3 的 Pillow 和 Noto CJK 字体（`npm run validate` 和 `npm run dev` 不需要）。

```bash
git clone https://github.com/ddhjy/muse-bot-hub.git
cd muse-bot-hub
npm install
npm run dev          # 打开 http://localhost:4321/muse-bot-hub/
```

试着添加一条目录条目——打开 `data/catalog.json`，在 `entries` 数组末尾追加：

```json
{
  "id": "my-first-entry",
  "added": "2026-10-06",
  "title": "我的第一条",
  "url": "https://example.com",
  "blurb": "用一句中文说清为什么要点这条链接。",
  "section": "tutorials",
  "tags": ["上手"]
}
```

运行校验：

```bash
npm run validate     # 通过了再提交
```

完整构建（含 OG 卡片）：

```bash
sudo apt-get install -y fonts-noto-cjk && python3 -m pip install pillow   # Debian / Ubuntu
npm run build        # 产出 dist/
```

如果只想浏览或改前端，跳过 `catalog.json`，直接跑 `npm run dev`。

## 文档地图

本仓库的文档按 [Divio 四象限](https://docs.divio.com/documentation-system/) 组织：

| 象限 | 文件 | 读谁 |
| --- | --- | --- |
| **Tutorial** 入门引导 | 本文件上方「五分钟上手」 | 第一次 clone 的人 |
| **How-to** 操作指南 | [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md) | 要提拉取请求的贡献者 |
| **Reference** 技术参考 | [CATALOG.zh.md](CATALOG.zh.md) | 写 JSON 或改校验脚本的人 |
| **Explanation** 设计解释 | [PRODUCT.md](PRODUCT.md) | 想理解决策理由的人 |

## 部署

推送到 `main` 后由 GitHub Actions（`.github/workflows/pages.yml`）构建并发布到 GitHub Pages。仓库 Settings → Pages 的 Source 需选 **GitHub Actions**。根目录的 `pages.workflow.yml` 是同一文件的副本，便于与姊妹站对照。

## 许可

- 站点代码（页面、样式、脚本）：[MIT](LICENSE)，Copyright 2026 KAI ddhjy
- 目录数据（`data/catalog.json`）：[CC0 1.0](LICENSE-CATALOG)

## 致谢

站点架构来自 [ddhjy/grok-bot-hub](https://github.com/ddhjy/grok-bot-hub)。首批链接以 muse.ai、Meta 帮助中心、Meta Newsroom 与 Meta AI Research 中可打开的官方页面为骨架，其余条目来自已核验可打开的公开文章、仓库和讨论帖。本站重写了中文说明，不复制品牌物料、邀请码或线下活动信息。

官方产品页：<https://muse.ai/>
