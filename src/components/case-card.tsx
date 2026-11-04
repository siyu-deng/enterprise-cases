"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  kindLabels,
  formatCollectedAt,
  type SourceBrief,
} from "@/data/catalog";
import { CoverFallback } from "./ui";

export function CaseCard({
  item,
  onView,
  eager = false,
}: {
  item: SourceBrief;
  onView: (item: SourceBrief) => void;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="case-card">
      <div className="card-cover">
        {failed ? (
          <CoverFallback />
        ) : (
          <img
            src={item.cover}
            alt=""
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
        <span className={`kind-badge kind-${item.kind}`}>
          {kindLabels[item.kind]}
        </span>
      </div>
      <div className="card-content">
        <p className="card-category">{item.category.name}</p>
        <h3>
          <button
            type="button"
            className="card-summary"
            onClick={() => onView(item)}
            aria-label={`查看摘要：${item.title}`}
          >
            {item.title}
          </button>
        </h3>
        {item.organization && (
          <p className="card-organization">{item.organization}</p>
        )}
        <p className="card-description">{item.summary}</p>
      </div>
      <div className="card-bottom">
        <span>
          {item.source.name}
          <span className="metadata-separator">·</span>
          <time dateTime={item.collectedAt}>
            收录 {formatCollectedAt(item.collectedAt)}
          </time>
        </span>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`阅读原始来源：${item.title}`}
        >
          原文 <ArrowUpRight size={15} />
        </a>
      </div>
    </article>
  );
}
