import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="container loading-page">
      <EmptyState
        title="这个页面暂不存在"
        action={
          <Link className="button button-primary" href="/customers">
            返回案例中心
          </Link>
        }
      />
    </main>
  );
}
