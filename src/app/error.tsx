"use client";

import { Button, ErrorState } from "@/components/ui";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="container loading-page">
      <ErrorState action={<Button onClick={reset}>重新加载</Button>} />
    </main>
  );
}
