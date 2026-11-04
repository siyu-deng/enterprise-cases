import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ImageOff, SearchX, TriangleAlert } from "lucide-react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props} />
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <SearchX size={36} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ action }: { action?: ReactNode }) {
  return (
    <div className="empty-state" role="alert">
      <TriangleAlert size={34} />
      <h3>页面暂时无法加载</h3>
      <p>请重试，或稍后回来查看。</p>
      {action}
    </div>
  );
}

export function CoverFallback() {
  return (
    <div className="cover-fallback">
      <ImageOff size={28} />
      <span>封面暂不可用</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="case-card skeleton" aria-hidden="true">
      <div className="skeleton-cover" />
      <div className="card-content">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}
