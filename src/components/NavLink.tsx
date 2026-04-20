"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 text-[13px] rounded-[8px] transition-colors whitespace-nowrap",
        active
          ? "text-text font-medium bg-accent-soft"
          : "text-text-muted hover:text-text hover:bg-surface-muted"
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
