import { CardSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <main
      className="container loading-page"
      aria-busy="true"
      aria-label="正在加载案例"
    >
      <div className="cases-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
