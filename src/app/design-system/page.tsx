import Link from "next/link";
import { ArrowUpRight, LibraryBig, Search } from "lucide-react";
import { Button, CardSkeleton, EmptyState, ErrorState } from "@/components/ui";

export default function DesignSystem() {
  return (
    <main className="design-page">
      <Link className="design-back" href="/customers">
        ← 返回落地观察
      </Link>
      <h1>落地观察设计系统</h1>
      <p className="design-note">
        公开信息、简洁概要、清晰出处。样式真源 globals.css，基础组件
        components/ui.tsx。
      </p>
      <section>
        <h2>颜色与表面</h2>
        <div className="design-row">
          {["bg", "surface", "text", "muted", "brand", "border"].map(
            (token) => (
              <div
                key={token}
                className={`swatch swatch-${token}`}
                style={{ background: `var(--${token})` }}
              >
                {token}
              </div>
            ),
          )}
        </div>
      </section>
      <section>
        <h2>排版与布局</h2>
        <p className="design-title">企业 AI，如何落地。</p>
        <p className="design-heading">企业案例与场景参考</p>
        <p>
          使用系统中文与西文字体，正文 15px / 1.6，资料三列、两列、单列自适应。
        </p>
        <p className="design-caption">来源与收录日期使用辅助文字层级。</p>
      </section>
      <section>
        <h2>间距与圆角</h2>
        <div className="design-row">
          {["1", "2", "4", "6", "8", "12", "16"].map((level) => (
            <div className="spacing-sample" key={level}>
              <span>space-{level}</span>
              <i style={{ width: `var(--space-${level})` }} />
            </div>
          ))}
        </div>
        <div className="design-row" style={{ marginTop: "var(--space-6)" }}>
          {[
            ["卡片", "--radius"],
            ["控件", "--control-radius"],
            ["胶囊", "--pill-radius"],
          ].map(([label, token]) => (
            <div
              className="radius-sample"
              key={token}
              style={{ borderRadius: `var(${token})` }}
            >
              {label}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>按钮与资料类型</h2>
        <div className="design-row">
          <Button>
            阅读原始来源 <ArrowUpRight size={16} />
          </Button>
          <Button variant="secondary">查看更多资料</Button>
          <Button disabled>暂不可用</Button>
          <span className="kind-badge kind-case">企业案例</span>
          <span className="kind-badge kind-reference">场景参考</span>
          <LibraryBig size={22} />
          <Search size={22} />
        </div>
      </section>
      <section>
        <h2>搜索与表单</h2>
        <label htmlFor="sample-field">关键词</label>
        <input
          id="sample-field"
          className="field"
          placeholder="搜索行业、企业或业务场景"
        />
      </section>
      <section>
        <h2>加载、空结果与错误</h2>
        <div className="design-grid">
          <CardSkeleton />
          <EmptyState title="暂时没有匹配的资料">
            试试其他关键词或行业。
          </EmptyState>
          <ErrorState />
        </div>
      </section>
    </main>
  );
}
