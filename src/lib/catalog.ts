import raw from "../../data/catalog.json";
import { matchesQuery, QUERY_EXPAND } from "./query";

export const SECTION_IDS = [
  "official",
  "tutorials",
  "cases",
  "skills",
  "reviews",
  "alternatives",
  "community",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** UI partitions that have a document. Same as catalog sections for this site. */
export const HUB_SECTION_IDS = [...SECTION_IDS] as const;

export type HubSectionId = (typeof HUB_SECTION_IDS)[number];

export const OFFICIAL_CLUSTERS = [
  { id: "start", label: "入门" },
  { id: "computer", label: "电脑" },
  { id: "billing", label: "计费" },
  { id: "safety", label: "安全" },
] as const;

export type ClusterId = (typeof OFFICIAL_CLUSTERS)[number]["id"];

export type PinTone = "cinnabar" | "ink" | "bronze" | "plum";

export interface Section {
  id: SectionId;
  label: string;
}

export interface CatalogEntry {
  id: string;
  /**
   * Asia/Shanghai calendar date this entry entered THIS catalog.
   * Daily harvests must set added to that day's Shanghai date YYYY-MM-DD.
   */
  added?: string;
  title: string;
  url: string;
  blurb: string;
  section: SectionId;
  tags?: string[];
  aliases?: string[];
  cluster?: ClusterId;
  featured?: boolean;
}

export interface Catalog {
  updated?: string;
  sections: Section[];
  entries: CatalogEntry[];
}

export const catalog = raw as Catalog;

export const SITE_NAME = "Muse Bot 目录";

/** Visible section names. Catalog JSON labels stay as harvested. */
export const SECTION_CHIP_LABELS: Partial<Record<SectionId, string>> = {
  skills: "技能",
};

export function sectionDisplayName(id: HubSectionId | "all"): string {
  if (id === "all") return "全部";
  const section = catalog.sections.find((item) => item.id === id);
  if (!section) return id;
  return chipLabel(section);
}

export function chipLabel(section: Section): string {
  return SECTION_CHIP_LABELS[section.id] ?? section.label;
}

/** UI glosses only. Catalog JSON titles stay as harvested; do not write these back. */
const DISPLAY_TITLES: Record<string, string> = {};

const DISPLAY_BLURBS: Record<string, string> = {};

/** Short names used in OG footers and share-query seeds. */
const INDEX_LABELS: Record<string, string> = {
  "muse-ai-home": "官网",
  "newsroom-introducing-muse": "发布稿",
  "help-center-hub": "帮助中心",
  "help-get-started": "开始使用",
  "help-connectors": "连接器",
  "help-permissions": "审批与权限",
  "help-payments": "付款",
  "help-subscriptions-about": "订阅方案",
  "help-manage-data": "数据控制",
  "help-mac-files-apps": "Mac 版",
  "research-safety-secure-vm": "安全白皮书",
  "muse-business": "小企业版",
  "muse-platform-docs": "连接器指南",
  "bugbounty-muse": "漏洞赏金",
};

export function displayTitle(entry: CatalogEntry): string {
  return DISPLAY_TITLES[entry.id] ?? entry.title;
}

export function displayBlurb(entry: CatalogEntry): string {
  return DISPLAY_BLURBS[entry.id] ?? entry.blurb;
}

export function indexLabel(entry: CatalogEntry): string {
  return INDEX_LABELS[entry.id] ?? displayTitle(entry);
}

export function entriesBySection(sectionId: SectionId): CatalogEntry[] {
  return catalog.entries.filter((entry) => entry.section === sectionId);
}

export function entryById(id: string): CatalogEntry | undefined {
  return catalog.entries.find((entry) => entry.id === id);
}

export function officialByCluster(clusterId: ClusterId): CatalogEntry[] {
  return catalog.entries.filter((entry) => {
    if (entry.section !== "official") return false;
    return (entry.cluster ?? "start") === clusterId;
  });
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatZhDate(iso?: string): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}

export function shanghaiTodayIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((part) => part.type === "year")?.value;
  const m = parts.find((part) => part.type === "month")?.value;
  const d = parts.find((part) => part.type === "day")?.value;
  return y && m && d ? `${y}-${m}-${d}` : "";
}

const SHANGHAI_DAY_MS = 24 * 60 * 60 * 1000;

function shanghaiDayMs(iso?: string): number | undefined {
  if (!iso || !/^(\d{4})-(\d{2})-(\d{2})$/.test(iso)) return undefined;
  const ms = Date.parse(`${iso}T00:00:00+08:00`);
  return Number.isFinite(ms) ? ms : undefined;
}

function shanghaiDayDiff(added: string, today: string): number | undefined {
  const addedMs = shanghaiDayMs(added);
  const todayMs = shanghaiDayMs(today);
  if (addedMs === undefined || todayMs === undefined) return undefined;
  return Math.round((todayMs - addedMs) / SHANGHAI_DAY_MS);
}

/** Card date: 今天 / 昨天 / M月D日 (Asia/Shanghai, relative to `todayIso` or catalog.updated). */
export function formatAddedLabel(iso?: string, todayIso?: string): string {
  if (!iso) return "";
  const ref = todayIso ?? catalog.updated ?? shanghaiTodayIso();
  const diff = shanghaiDayDiff(iso, ref);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[2])}月${Number(match[3])}日`;
}

export function formatAddedShort(iso?: string): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[2])}月${Number(match[3])}日`;
}

export function addedSearchText(entry: CatalogEntry): string {
  const iso = entry.added;
  if (!iso) return "";
  const label = formatAddedLabel(iso, catalog.updated);
  return [label, "今天", "昨天", formatAddedShort(iso), formatZhDate(iso), iso].join(" ");
}

export type AddedSort = "new" | "old";

/** Missing `added` sorts last. `"new"` is newest first; `"old"` is oldest first. */
export function compareAdded(a: CatalogEntry, b: CatalogEntry, sort: AddedSort): number {
  const left = shanghaiDayMs(a.added);
  const right = shanghaiDayMs(b.added);
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  if (left === right) return 0;
  const cmp = left < right ? -1 : 1;
  return sort === "old" ? cmp : -cmp;
}

export function sortByAdded(entries: readonly CatalogEntry[], sort: AddedSort): CatalogEntry[] {
  return entries.slice().sort((a, b) => compareAdded(a, b, sort));
}

/**
 * Homepage feed order: newest `added` first; within the same day, official entries lead
 * so a fresh seed does not open on a forum thread.
 */
export function allEntriesNewest(): CatalogEntry[] {
  const sectionRank = new Map<string, number>(SECTION_IDS.map((id, index) => [id, index]));
  return catalog.entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const byDate = compareAdded(a.entry, b.entry, "new");
      if (byDate !== 0) return byDate;
      const bySection =
        (sectionRank.get(a.entry.section) ?? 99) - (sectionRank.get(b.entry.section) ?? 99);
      if (bySection !== 0) return bySection;
      return a.index - b.index;
    })
    .map((item) => item.entry);
}

export function catalogTagStats(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of catalog.entries) {
    for (const tag of entry.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

const META_HOSTS = ["muse.ai", "meta.com", "meta.ai", "fb.com", "instagram.com"];

export function isOfficialHost(host: string): boolean {
  return META_HOSTS.some((item) => host === item || host.endsWith(`.${item}`));
}

export function hostTone(host: string): PinTone {
  if (isOfficialHost(host)) return "cinnabar";
  if (host.includes("github.com")) return "ink";
  if (host.includes("ycombinator.com") || host.includes("reddit.com")) return "plum";
  return "bronze";
}

export function searchPrimary(entry: CatalogEntry): string {
  return [
    displayTitle(entry),
    indexLabel(entry),
    entry.title,
    ...(entry.tags ?? []),
    ...(entry.aliases ?? []),
    addedSearchText(entry),
  ]
    .join(" ")
    .toLocaleLowerCase("zh-CN");
}

export function searchUrl(entry: CatalogEntry): string {
  return [hostnameOf(entry.url), entry.url].join(" ").toLocaleLowerCase("zh-CN");
}

export function searchBlurb(entry: CatalogEntry): string {
  return displayBlurb(entry).toLocaleLowerCase("zh-CN");
}

export const SEARCH_OG = {
  title: `搜索 · ${SITE_NAME}`,
  description: "在目录里搜标题、别名和标签。输入关键词开始。",
  image: "og-search.png",
  imageAlt: `搜索 · ${SITE_NAME}，非官方`,
} as const;

export function searchDocumentTitle(q: string): string {
  return `「${q}」的搜索 · ${SITE_NAME}`;
}

export function ogHitName(entry: CatalogEntry): string {
  if (INDEX_LABELS[entry.id]) return INDEX_LABELS[entry.id];
  const title = displayTitle(entry);
  const cut = title.split("：")[0];
  return [...cut].length <= 10 ? cut : title;
}

export function queryHits(q: string): CatalogEntry[] {
  if (!q) return [];
  return catalog.entries.filter((entry) =>
    matchesQuery(searchPrimary(entry), searchBlurb(entry), q, {
      url: searchUrl(entry),
      section: entry.section,
    }),
  );
}

export function searchDocumentDescription(q: string): string {
  const hits = queryHits(q);
  if (hits.length === 0) return `目录里标题、别名和分区含「${q}」的条目。`;
  const names = hits.slice(0, 3).map((entry) => ogHitName(entry)).join("、");
  return `目录里「${q}」有${hits.length}条：${names}。`;
}

export function searchOgFile(q: string): string {
  const safe = q.replace(/[/\\?%*:|"<>]/g, "").slice(0, 40);
  if (!safe) return "og-search.png";
  return `og-q-${safe}.png`;
}

const SKIP_SHARE_QUERY = new Set([
  "技能",
  "教程",
  "官方资源",
  "实战案例",
  "评测对比",
  "开源替代",
  "社区与坑",
  "全部",
]);

/** Core share documents (indexable). Additional catalog tokens are noindex share cards. */
export const SHARE_CORE = ["连接器", "审批", "坑", "订阅", "Mac", "WhatsApp", "Grok Bot", "Dots"] as const;

function hasCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function collectShareQuerySeeds(): string[] {
  const seeds = new Set<string>(SHARE_CORE);
  for (const label of Object.values(INDEX_LABELS)) {
    if (!SKIP_SHARE_QUERY.has(label)) seeds.add(label);
  }
  for (const entry of catalog.entries) {
    for (const alias of entry.aliases ?? []) {
      if (SKIP_SHARE_QUERY.has(alias)) continue;
      if (hasCjk(alias) && [...alias].length >= 2) seeds.add(alias);
    }
  }
  for (const key of Object.keys(QUERY_EXPAND)) {
    if (SKIP_SHARE_QUERY.has(key)) continue;
    if (hasCjk(key)) seeds.add(key);
  }
  return [...seeds];
}

let cachedShareQueries: string[] | undefined;

/** Static `/search/{q}/` documents. Section names go to section pages instead. */
export function shareQueries(): string[] {
  if (cachedShareQueries) return cachedShareQueries;
  cachedShareQueries = collectShareQuerySeeds()
    .filter((q) => !SKIP_SHARE_QUERY.has(q))
    .filter((q) => queryHits(q).length > 0)
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  return cachedShareQueries;
}

export function isShareQuery(q: string): boolean {
  if (!q) return false;
  const lower = q.toLocaleLowerCase("en-US");
  return shareQueries().some((item) => item === q || item.toLocaleLowerCase("en-US") === lower);
}

export function isCoreShareQuery(q: string): boolean {
  const key = canonicalShareQuery(q);
  return SHARE_CORE.some((item) => item === key);
}

export function canonicalShareQuery(q: string): string {
  const all = shareQueries();
  if (all.includes(q)) return q;
  const lower = q.toLocaleLowerCase("en-US");
  return all.find((item) => item.toLocaleLowerCase("en-US") === lower) ?? q;
}

export function zhResultCount(n: number): string {
  const map = ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (n >= 0 && n <= 10) return `${map[n]}个结果`;
  return `${n}个结果`;
}

export function searchQueryOgMeta(q: string): {
  file: string;
  kicker: string;
  footer: string;
} | null {
  const hits = queryHits(q);
  if (hits.length === 0) return null;
  return {
    file: searchOgFile(q),
    kicker: zhResultCount(hits.length),
    footer: hits.slice(0, 2).map((entry) => ogHitName(entry)).join(" · "),
  };
}

export function queryHitsInSection(section: HubSectionId, q: string): CatalogEntry[] {
  const needle = canonicalShareQuery(q);
  return catalog.entries.filter((entry) => {
    if (entry.section !== section) return false;
    return matchesQuery(searchPrimary(entry), searchBlurb(entry), needle, {
      url: searchUrl(entry),
      section: entry.section,
    });
  });
}

export function shareSectionQueryPairs(): { section: HubSectionId; q: string }[] {
  const pairs: { section: HubSectionId; q: string }[] = [];
  for (const q of shareQueries()) {
    for (const section of HUB_SECTION_IDS) {
      if (queryHitsInSection(section, q).length > 0) {
        pairs.push({ section, q });
      }
    }
  }
  return pairs;
}

export function searchHaystack(entry: CatalogEntry): string {
  return `${searchPrimary(entry)} ${searchBlurb(entry)}`;
}
