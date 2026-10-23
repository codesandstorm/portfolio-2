import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts — Akshita Mahajan",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
