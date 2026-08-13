"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Library, BookOpen, Brain, Settings } from "lucide-react";

export function MobileTabBar() {
  const pathname = usePathname();

  // Don't show tab bar on fullscreen active study modes (like quiz take or flashcard practice)
  if (pathname.includes("/practice") || pathname.includes("/take")) {
    return null;
  }

  const tabs = [
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Notebooks", href: "/notebooks", icon: BookOpen },
    { label: "Vault", href: "/vault", icon: Library },
    { label: "Study", href: "/study", icon: Brain }, // /study doesn't exist yet but it's part of the spec
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-2 z-40 safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
              isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Icon size={20} className={isActive ? "fill-indigo-50" : ""} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
