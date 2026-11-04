import Link from "next/link";
import { ArrowUpRight, LibraryBig } from "lucide-react";
import {
  briefs,
  sources,
  formatCollectedAt,
  type SourceBrief,
  type Source,
} from "@/data/catalog";

export function Footer({
  items: allItems = briefs,
  sourceList = sources,
}: {
  items?: SourceBrief[];
  sourceList?: Source[];
}) {
  return (
    <>
      <section id="sources" className="sources-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">每一条概要，都有来处</p>
              <h2>信息来源</h2>
            </div>
            <p>保留概要与出处，完整内容回到原始来源阅读。</p>
          </div>
          <div className="source-list">
            {sourceList.map((source) => {
              const items = allItems.filter(
                (item) => item.sourceId === source.id,
              );
              return (
                <div className="source-row" key={source.id}>
                  <div className="source-identity">
                    <div className="source-symbol">
                      <LibraryBig size={23} />
                    </div>
                    <div>
                      <h3>{source.name}</h3>
                      <p>{source.description}</p>
                    </div>
                  </div>
                  <div className="source-counts">
                    <span>
                      {items.filter((item) => item.kind === "case").length}{" "}
                      条企业案例
                    </span>
                    <span>
                      {items.filter((item) => item.kind === "reference").length}{" "}
                      条场景参考
                    </span>
                  </div>
                  <div className="source-date">
                    最近核对
                    <time dateTime={source.collectedAt}>
                      {formatCollectedAt(source.collectedAt)}
                    </time>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    访问来源 <ArrowUpRight size={16} />
                  </a>
                </div>
              );
            })}
          </div>
          <p className="source-footnote">
            资料类型沿用来源标记，收录不代表对其实施效果的独立验证。
          </p>
        </div>
      </section>
      <footer className="site-footer">
        <div className="container footer-content">
          <p>© 2026 企业 AI 落地观察</p>
          <div>
            <a href="#library">案例与参考</a>
            <a href="#sources">信息来源</a>
            <Link href="/design-system">设计系统</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
