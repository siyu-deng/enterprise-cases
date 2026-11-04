import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "企业 AI 落地观察 · 公开案例与场景参考",
  description:
    "聚合企业 AI 实践与业务场景参考，阅读公开信息概要，回到原始来源继续研究。",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

const themeScript = `(function(){try{var t=localStorage.getItem('enterprise-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
