#!/usr/bin/env node
/** Smoke-check query rules used by the directory (keep in sync with src/lib/query.ts). */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const QUERY_EXPAND = {
  发布稿: ["introducing", "newsroom"],
  introducing: ["发布稿"],
  定价: ["订阅", "用量", "plans", "power", "maximum", "token"],
  订阅: ["定价", "用量", "subscriptions", "plans"],
  计费: ["订阅", "用量", "付款"],
  用量: ["订阅", "token", "额度"],
  技能: ["skill", "插件", "连接器"],
  连接器: ["connector", "插件", "mcp"],
  插件: ["连接器", "connector", "mcp", "技能"],
  审批: ["权限", "permissions", "always ask", "hitl"],
  权限: ["审批", "permissions", "always ask"],
  云电脑: ["电脑操作", "secure vm", "vm"],
  电脑操作: ["电脑", "secure vm", "mac"],
  虚拟机: ["vm", "secure vm", "电脑操作"],
  坑: ["排障", "封号", "风控", "踩坑"],
  哨兵: ["sentinel"],
};

const DENY_BEFORE = /(?:而不是|不是把|伪装成|不要把|并非|并不是|不是)\s*$/;
const LIST_SEP = /[,，、/|]/;
const LATIN_TOKEN = /^[a-z0-9][a-z0-9 .'+-]*$/i;

function isLatinTokenQuery(query) {
  return LATIN_TOKEN.test(query.trim());
}

function isListContext(field, term) {
  if (!term) return false;
  const hay = field.toLocaleLowerCase("zh-CN");
  const needle = term.toLocaleLowerCase("zh-CN");
  let from = 0;
  while (from < hay.length) {
    const index = hay.indexOf(needle, from);
    if (index < 0) return false;
    const before = hay.slice(Math.max(0, index - 24), index);
    const after = hay.slice(index + needle.length, index + needle.length + 24);
    if (LIST_SEP.test(before) || LIST_SEP.test(after)) return true;
    from = index + needle.length;
  }
  return false;
}

function isLatinLetterQuery(query) {
  return [...query].length === 1 && /^[a-zA-Z]$/u.test(query);
}

function isActiveQuery(query) {
  if (!query) return false;
  if (isLatinLetterQuery(query)) return false;
  return true;
}

function fieldMatches(field, term) {
  if (!term) return true;
  const hay = field.toLocaleLowerCase("zh-CN");
  const needle = term.toLocaleLowerCase("zh-CN");
  let from = 0;
  while (from < hay.length) {
    const index = hay.indexOf(needle, from);
    if (index < 0) return false;
    const before = hay.slice(Math.max(0, index - 16), index);
    if (DENY_BEFORE.test(before)) {
      from = index + needle.length;
      continue;
    }
    return true;
  }
  return false;
}

function matchesQuery(primary, blurb, query, extras = {}) {
  if (!isActiveQuery(query)) return true;
  if (fieldMatches(primary, query)) return true;
  if (!isLatinTokenQuery(query) && fieldMatches(blurb, query) && !isListContext(blurb, query)) {
    return true;
  }
  if ([...query].length <= 1) return false;
  if (extras.url && fieldMatches(extras.url, query)) return true;
  const extra = QUERY_EXPAND[query] ?? QUERY_EXPAND[query.replace(/\s+/g, "")];
  if (!extra) return false;
  return extra.some((term) => fieldMatches(primary, term.toLocaleLowerCase("zh-CN")));
}

const catalog = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../data/catalog.json"), "utf8"));

function primary(entry) {
  return [entry.title, ...(entry.tags ?? []), ...(entry.aliases ?? [])].join(" ").toLocaleLowerCase("zh-CN");
}

function hits(q) {
  const needle = q.toLocaleLowerCase("zh-CN");
  if (!isActiveQuery(needle)) return [];
  return catalog.entries
    .filter((entry) =>
      matchesQuery(primary(entry), entry.blurb.toLocaleLowerCase("zh-CN"), needle, {
        url: entry.url.toLocaleLowerCase("zh-CN"),
        section: entry.section,
      }),
    )
    .map((entry) => entry.id);
}

function assert(cond, message) {
  if (!cond) {
    console.error(`search: ${message}`);
    process.exitCode = 1;
  }
}

const connectors = hits("连接器");
assert(connectors.includes("help-connectors"), "连接器 misses 官方连接器文档");
assert(connectors.includes("awesome-muse-connectors"), "连接器 misses 社区连接器目录");
assert(connectors.includes("muse-platform-docs"), "连接器 misses 连接器指南");

const approvals = hits("审批");
assert(approvals.includes("help-permissions"), "审批 misses 审批与权限设置");

const subs = hits("订阅");
assert(subs.includes("help-subscriptions-about"), "订阅 misses 订阅方案与额度");
assert(!subs.includes("help-connectors"), "订阅 hits 连接器文档");

const mac = hits("Mac");
assert(mac.includes("help-mac-files-apps"), "Mac misses 官方 Mac 文档");
assert(mac.includes("shipwithmuse-mac"), "Mac misses Mac 版权限教程");
assert(mac.includes("unite-mac-zero-day"), "Mac misses Mac 零日");
assert(!mac.includes("help-get-started"), "Mac hits 开始使用");

const whatsapp = hits("WhatsApp");
assert(whatsapp.includes("shipwithmuse-whatsapp"), "WhatsApp misses WhatsApp 教程");
assert(whatsapp.includes("sealgate-whatsapp-connector"), "WhatsApp misses SealGate");

const grokBot = hits("Grok Bot");
assert(grokBot.includes("aimultiple-always-on-agents"), "Grok Bot misses 五家横评");
assert(grokBot.includes("techysurgeon-first-weeks"), "Grok Bot misses 外科医生头几周");
assert(!grokBot.includes("muse-ai-home"), "Grok Bot hits Muse 官网");

const pit = hits("坑");
assert(pit.includes("naixi-forum-vm"), "坑 misses 奶昔论坛 VM");
assert(pit.includes("verge-filesystem-dump"), "坑 misses 文件系统导出");
assert(pit.length > 0, "坑 returned nothing");

const letterS = hits("s");
assert(letterS.length === 0, `one-letter s still searches (${letterS.length})`);
assert(hits("S").length === 0, "one-letter S still searches");

if (process.exitCode) {
  console.error("search check failed");
  console.error("连接器", connectors);
  console.error("审批", approvals);
  console.error("订阅", subs);
  console.error("Mac", mac);
  console.error("WhatsApp", whatsapp);
  console.error("Grok Bot", grokBot);
  console.error("坑", pit);
  process.exit(process.exitCode);
}

console.log(
  `search OK：连接器 ${connectors.length} · 审批 ${approvals.length} · 订阅 ${subs.length} · Mac ${mac.length} · WhatsApp ${whatsapp.length} · Grok Bot ${grokBot.length} · 坑 ${pit.length} · s ${letterS.length}`,
);
