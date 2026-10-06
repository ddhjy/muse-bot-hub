export const QUERY_EXPAND: Record<string, string[]> = {
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
  anzhuang: ["安装", "开始使用"],
  dingjia: ["定价", "订阅"],
  jineng: ["技能", "skill"],
  keng: ["坑", "排障"],
  jiaocheng: ["教程"],
  shequ: ["社区"],
  chajian: ["插件", "连接器"],
  denglu: ["登录"],
  anquan: ["安全"],
  kaiyuan: ["开源"],
};

/** @deprecated Section chips are gone; kept empty so old call sites compile. */
export const SECTION_QUERY: Record<string, string> = {};

const DENY_BEFORE = /(?:而不是|不是把|伪装成|不要把|并非|并不是|不是)\s*$/;
const LIST_SEP = /[,，、/|]/;
const LATIN_TOKEN = /^[a-z0-9][a-z0-9 .'+-]*$/i;

export function normalizeQuery(value: string): string {
  return value.toLocaleLowerCase("zh-CN").trim();
}

/** Latin tokens (Mac / WhatsApp / Dots) hit title and aliases, not a blurb comma-list. */
export function isLatinTokenQuery(query: string): boolean {
  return LATIN_TOKEN.test(query.trim());
}

/** 「QuickBooks、Shopify、Slack 等」is a list, not a Slack tutorial. */
export function isListContext(field: string, term: string): boolean {
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

/** One Latin letter is still typing, not a query. */
export function isLatinLetterQuery(query: string): boolean {
  return [...query].length === 1 && /^[a-zA-Z]$/u.test(query);
}

/** Empty and one-letter Latin do not filter the grid. */
export function isActiveQuery(query: string): boolean {
  if (!query) return false;
  if (isLatinLetterQuery(query)) return false;
  return true;
}

/** Skip a hit that only exists to deny the noun (「不是 Muse 产品本身」). */
export function fieldMatches(field: string, term: string): boolean {
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

export interface QueryExtras {
  url?: string;
  section?: string;
}

/**
 * Title/alias/tag hits, plus the typed query in the blurb.
 * One-letter Latin does not search (Muse contains s; every URL is https).
 */
export function matchesQuery(
  primary: string,
  blurb: string,
  query: string,
  extras: QueryExtras = {},
): boolean {
  if (!isActiveQuery(query)) return true;
  if (fieldMatches(primary, query)) return true;
  if (!isLatinTokenQuery(query) && fieldMatches(blurb, query) && !isListContext(blurb, query)) {
    return true;
  }
  if ([...query].length <= 1) return false;
  if (extras.url && fieldMatches(extras.url, query)) return true;
  const extra = QUERY_EXPAND[query] ?? QUERY_EXPAND[query.replace(/\s+/g, "")];
  if (!extra) return false;
  return extra.some((term) => fieldMatches(primary, normalizeQuery(term)));
}
