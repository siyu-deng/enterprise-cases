"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, X } from "lucide-react";
import {
  formatCollectedAt,
  kindLabels,
  type SourceBrief,
} from "@/data/catalog";

export function CasePreview({
  item,
  onClose,
}: {
  item: SourceBrief | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          aria-describedby="brief-summary"
        >
          {item && (
            <>
              <div className="dialog-header">
                <div className="brief-heading">
                  <span className={`kind-badge kind-${item.kind}`}>
                    {kindLabels[item.kind]}
                  </span>
                  <span className="brief-industry">{item.category.name}</span>
                </div>
                <Dialog.Title>{item.title}</Dialog.Title>
                {item.organization && (
                  <p className="brief-organization">
                    相关企业：{item.organization}
                  </p>
                )}
              </div>
              <div className="dialog-body">
                <div className="brief-body">
                  <h3>来源概要</h3>
                  <Dialog.Description id="brief-summary">
                    {item.summary}
                  </Dialog.Description>
                </div>
                {item.kind === "reference" && (
                  <p className="reference-note">
                    这是一条场景或方案参考，来源方未将其标记为企业实践案例。
                  </p>
                )}
                <dl className="brief-source">
                  <div>
                    <dt>原始来源</dt>
                    <dd>
                      {item.source.name}
                      <span>{new URL(item.sourceUrl).hostname}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>收录时间</dt>
                    <dd>
                      <time dateTime={item.collectedAt}>
                        {formatCollectedAt(item.collectedAt)}
                      </time>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="brief-actions">
                <p>
                  概要依据公开来源整理，未独立核验实施效果。
                  <br />
                  完整内容请阅读原始来源。
                </p>
                <a
                  className="button button-primary"
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  阅读原始来源 <ArrowUpRight size={16} />
                </a>
              </div>
            </>
          )}
          <Dialog.Close className="dialog-close" aria-label="关闭概要">
            <X size={20} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
