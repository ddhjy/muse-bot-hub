# 目录数据参考

本文件是 `data/catalog.json` 的技术参考。操作步骤见 [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md)；设计决策见 [PRODUCT.md](PRODUCT.md)。

## 文件结构

```json
{
  "updated": "YYYY-MM-DD",
  "sections": [{ "id": "...", "label": "..." }],
  "entries": [{ ... }]
}
```

`updated` 是最近一次修改日期（上海时区）。`sections` 定义分区顺序和中文标签。`entries` 是全部条目的有序数组。

## 字段

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | 是 | `string` | 全仓库唯一，小写 kebab-case |
| `added` | 是 | `string` | 收录日期 `YYYY-MM-DD`（上海时区），指进入本目录的日期，不是原文发布日 |
| `title` | 是 | `string` | 卡片标题，中文优先；英文专有名词可放在标题里或 `aliases` |
| `url` | 是 | `string` | 真实可打开的 `https` 地址，不带跟踪参数（`utm_*`、`fbclid`、`ref` 等会被校验拒绝） |
| `blurb` | 是 | `string` | 一句中文，以中文句号「。」结尾，中间不再出现句号 |
| `section` | 是 | `SectionId` | 七个分区 id 之一，见下表 |
| `tags` | 否 | `string[]` | 从闭集标签表中取，最多 5 个 |
| `aliases` | 否 | `string[]` | 检索别名（英文原题、拼音、同义词） |
| `cluster` | 否 | `ClusterId` | 仅 `official` 分区使用，见下表 |
| `featured` | 否 | `boolean` | 仅 `official` 分区：在对应分组里置顶 |

## 分区

| `section` id | 中文标签 | 收什么 |
| --- | --- | --- |
| `official` | 官方资源 | muse.ai、Meta 帮助中心、Meta Newsroom、Meta AI Research、Meta 博客与漏洞赏金页上的官方文档 |
| `tutorials` | 教程 | 个人上手教程、注册与权限设置指南、提示词写法 |
| `cases` | 实战案例 | 一次真实使用的记录：媒体实测、博客复盘、多任务实录 |
| `skills` | 技能/连接器/MCP | 连接器目录、技能存档、自定义连接器与 MCP 接入 |
| `reviews` | 评测对比 | 横向评测，尤其是与 Grok Bot、Dots、Hermes、OpenClaw 的比较 |
| `alternatives` | 开源替代 | 自托管方案、开源框架和可本地运行的模型 |
| `community` | 社区与坑 | 论坛讨论、踩坑现场、安全事件、运行环境逆向分析、社区清单 |

## 官方分区集群

仅 `section: "official"` 的条目可设 `cluster`：

| `cluster` id | 含义 |
| --- | --- |
| `start` | 入门：官网、发布稿、帮助中心总览、开始使用、性格与记忆 |
| `computer` | 电脑：连接器、技能、浏览器、Mac 版、定时任务、产物、平台接入 |
| `billing` | 计费：订阅方案、付款 |
| `safety` | 安全：审批与权限、隐私、数据管理、条款、安全白皮书、漏洞赏金 |

## 标签闭集

只能从以下闭集取值，不要新建标签：

| 标签 | 含义 |
| --- | --- |
| `坑` | 踩坑、风控、封号、边界 |
| `上手` | 注册、第一次、入门教程 |
| `文档` | 官方帮助、发布稿、概念说明 |
| `排障` | 连不上、登录、任务卡住、恢复 |
| `用量` | 额度、订阅、定价、token |
| `安全` | 审批、隐私、凭据、Sentinel、提示注入 |
| `编制` | 目标（Goals）、定时任务、子智能体、工作流编排 |
| `电脑操作` | Secure VM、终端、文件系统、Mac 电脑操作 |
| `插件` | 连接器、自定义连接器、MCP、技能 |
| `视频` | 以视频为主 |
| `开源` | 自托管与替代 |
| `对比` | 横评：对 Grok Bot / Dots / Hermes / OpenClaw / 聊天助手 |
| `购物` | 购物、付款、Link、商家封禁 |
| `小企业` | Muse for Small Business、商业连接器 |
| `日文` | 日文来源 |

与姊妹站 Grok Bot 导航相比，去掉了 `销售` `工程` `跑腿` `多Bot` `iOS` `Linux` 这些只对多 Bot 编队有意义的标签，新增 `购物` `小企业`。

## 收录范围

只收 **Meta Muse** 这一个产品：Meta 于 2026-09-08 推出的个人 AI 智能体，运行在每人一台的 Muse Secure VM 上，入口是 Muse 应用、muse.ai、WhatsApp 和 Mac 桌面版。

不收：

- Discord 音乐机器人「Muse」
- Muse Bot Builder 及其他同名「Muse」产品
- Muse Code（终端编程智能体）与 Meta Model API 的纯开发文档
- 只评 Muse Spark 模型、几乎不谈智能体产品的文章
- 失效链接、缩短链接、需要登录才能确认存在的空页
- 微信群二维码、线下活动物料、其他站点的品牌视觉
- 以发邀请码为主的页面；目录标题和说明里不出现邀请码
- 编造的用量数字、排名、「第一」「最强」一类空话

拿不准时，先读官方帮助中心总览：<https://www.meta.com/help/artificial-intelligence/1303670544995562/>

## 构建脚本

| 命令 | 作用 |
| --- | --- |
| `npm run validate` | 运行 `scripts/validate-catalog.mjs` + `scripts/check-search.mjs`，校验 JSON 格式、字段约束与检索规则 |
| `npm run og` | 运行 `scripts/write-og-cards.mjs` + `scripts/generate-og.py`，生成 Open Graph 卡片图（需 Pillow 与 Noto CJK 字体） |
| `npm run build` | validate + og + `astro build`，产出 `dist/` 目录 |
| `npm run dev` | `astro dev`，本地开发服务器 `http://localhost:4321/muse-bot-hub/` |
| `npm run preview` | `astro preview`，预览已构建的 `dist/` |

站点发布在 GitHub Pages，仓库为 `ddhjy/muse-bot-hub`，站点根路径 `/muse-bot-hub/`。构建由 GitHub Actions 完成（`.github/workflows/pages.yml`）。生成的 `public/og*.png` 与 `scripts/og-cards.json` 不入库。

## TypeScript 类型

源码中的核心类型定义在 `src/lib/catalog.ts`：

- `SectionId` — 七个分区 id 的联合类型
- `ClusterId` — 官方分区四个集群 id 的联合类型
- `CatalogEntry` — 单条目录条目的接口
- `Catalog` — 整个 `catalog.json` 的接口
