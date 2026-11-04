"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  LibraryBig,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import {
  catalogSnapshot,
  createCatalog,
  filterBriefs,
  sortLabels,
  type KindFilter,
  type SortKey,
  type SourceBrief,
} from "@/data/catalog";
import { CaseCard } from "./case-card";
import { CasePreview } from "./case-preview";
import { Footer } from "./footer";
import { Button, EmptyState } from "./ui";

export function CaseCatalog() {
  const [snapshot, setSnapshot] = useState(catalogSnapshot);
  const [refreshError, setRefreshError] = useState(false);
  const [retry, setRetry] = useState(0);
  const { categories, sources, briefs, catalogStats } = useMemo(
    () => createCatalog(snapshot),
    [snapshot],
  );
  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      controller = new AbortController();
      fetch("/api/catalog", { cache: "no-store", signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Refresh failed");
          return response.json();
        })
        .then((data) => {
          createCatalog(data);
          setSnapshot(data);
          setRefreshError(false);
        })
        .catch((error) => {
          if (error.name !== "AbortError") setRefreshError(true);
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller?.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [retry]);
  const kindOptions: { value: KindFilter; label: string; count: number }[] = [
    { value: "all", label: "全部资料", count: catalogStats.total },
    { value: "case", label: "企业案例", count: catalogStats.cases },
    { value: "reference", label: "场景参考", count: catalogStats.references },
  ];
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("case-first");
  const [limit, setLimit] = useState(12);
  const [preview, setPreview] = useState<SourceBrief | null>(null);
  const filtered = useMemo(
    () => filterBriefs({ category, query, kind, sort }, briefs),
    [category, query, kind, sort, briefs],
  );
  const isFiltered = Boolean(
    query.trim() || category !== "all" || kind !== "all",
  );
  const clear = () => {
    setQuery("");
    setCategory("all");
    setKind("all");
    setLimit(12);
  };
  const toggleTheme = () => {
    const theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("enterprise-theme", theme);
    } catch {
      /* Current theme remains usable. */
    }
  };

  return (
    <>
      <header className="navbar">
        <nav className="container nav-container" aria-label="主导航">
          <Link className="brand" href="/customers">
            <span className="brand-mark">
              <LibraryBig size={22} strokeWidth={1.7} />
            </span>
            <span>
              企业 AI <strong>落地观察</strong>
            </span>
          </Link>
          <div className="nav-actions">
            <a href="#library">案例与参考</a>
            <a href="#sources">信息来源</a>
            <button
              type="button"
              className="theme-toggle"
              aria-label="切换浅色或深色主题"
              onClick={toggleTheme}
            >
              <Moon className="theme-moon" size={18} />
              <Sun className="theme-sun" size={18} />
            </button>
          </div>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="container hero-container">
            <p className="hero-eyebrow">企业 AI 落地信息聚合</p>
            <h1>
              企业 AI，<span>如何落地。</span>
            </h1>
            <p className="hero-description">
              汇集公开的企业实践与场景参考，读概要、看出处，
              <br className="desktop-break" />
              为下一次落地找到线索。
            </p>
            <form
              className="search-form"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                document
                  .getElementById("library")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Search size={21} />
              <input
                aria-label="搜索资料"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(12);
                }}
                placeholder="搜索行业、企业或业务场景"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  aria-label="清除关键词"
                  onClick={() => {
                    setQuery("");
                    setLimit(12);
                  }}
                >
                  <X size={17} />
                </button>
              )}
              <Button type="submit">
                查找资料 <ArrowUpRight size={15} />
              </Button>
            </form>
            <p className="collection-note">
              已收录 <strong>{catalogStats.total}</strong> 条公开资料，覆盖{" "}
              <strong>{catalogStats.industries}</strong> 个行业。
            </p>
          </div>
        </section>
        <section
          id="library"
          className="library-section container"
          aria-label="案例与场景参考"
        >
          <div className="library-heading">
            <h2>案例与场景参考</h2>
            <p>从真实实践到应用思路，找到值得继续研究的方向。</p>
          </div>
          <div className="catalog-toolbar">
            <div className="kind-tabs" aria-label="资料类型">
              {kindOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    kind === option.value ? "kind-tab selected" : "kind-tab"
                  }
                  aria-pressed={kind === option.value}
                  onClick={() => {
                    setKind(option.value);
                    setLimit(12);
                  }}
                >
                  {option.label}
                  <span>{option.count}</span>
                </button>
              ))}
            </div>
            <label className="industry-select">
              <span>行业</span>
              <select
                aria-label="行业筛选"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setLimit(12);
                }}
              >
                <option value="all">全部行业</option>
                {categories.map((value) => (
                  <option key={value.id} value={value.slug}>
                    {value.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          {refreshError && (
            <div className="refresh-notice" role="status">
              <span>暂时无法更新资料，正在展示上次收录的内容。</span>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
              >
                重试
              </button>
            </div>
          )}
          <div className="results-toolbar">
            <div className="result-summary" role="status">
              <span>
                {filtered.length} 条资料{query.trim() && ` · “${query.trim()}”`}
              </span>
              {isFiltered && filtered.length > 0 && (
                <button type="button" onClick={clear}>
                  清除筛选 <X size={13} />
                </button>
              )}
            </div>
            <label className="sort-control">
              <span className="sr-only">资料排序</span>
              <select
                aria-label="资料排序"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setLimit(12);
                }}
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
          {kind === "reference" && (
            <p className="reference-filter-note">
              场景参考来自方案或应用思路，未标记为企业实践案例。
            </p>
          )}
          {filtered.length ? (
            <div className="cases-grid">
              {filtered.slice(0, limit).map((item, index) => (
                <CaseCard
                  key={item.id}
                  item={item}
                  onView={setPreview}
                  eager={index < 3}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="暂时没有匹配的资料"
              action={
                <Button variant="secondary" onClick={clear}>
                  清除筛选
                </Button>
              }
            >
              试试其他关键词、行业或资料类型。
            </EmptyState>
          )}
          {limit < filtered.length && (
            <div className="load-more">
              <Button
                variant="secondary"
                onClick={() => setLimit((value) => value + 12)}
              >
                查看更多资料 <ArrowDown size={16} />
              </Button>
              <span>
                已展示 {Math.min(limit, filtered.length)} / {filtered.length} 条
              </span>
            </div>
          )}
        </section>
        <Footer items={briefs} sourceList={sources} />
      </main>
      <CasePreview item={preview} onClose={() => setPreview(null)} />
      <div className="sr-only" aria-live="polite">
        当前显示 {Math.min(limit, filtered.length)} 条，共 {filtered.length}{" "}
        条资料。
      </div>
    </>
  );
}
