"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, FileText, MonitorPlay, ChevronRight } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

export function RecentActivityMobile() {
  const [activities, setActivities] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadRecent() {
      // Mock fetching recent activities for Phase 12 checkpoint
      const recent = [
        { id: "1", type: "flashcards", title: "SQL Joins Flashcards", subtitle: "3 cards reviewed", href: "/chat" },
        { id: "2", type: "document", title: "Chapter 5 - Normalization", subtitle: "Notes", href: "/chat" },
        { id: "3", type: "quiz", title: "Week 8 Practice Quiz", subtitle: "Question 4 of 10", href: "/chat" }
      ];
      setActivities(recent);
    }
    loadRecent();
  }, []);

  if (activities.length === 0) return null;

  return (
    <div className="md:hidden w-full px-4 pt-4 pb-2 bg-[var(--background)]">
      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Continue where you left off</h3>
      <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 snap-x">
        {activities.map((act) => {
          let Icon = FileText;
          if (act.type === "flashcards" || act.type === "quiz") Icon = Brain;
          if (act.type === "slides") Icon = MonitorPlay;
          
          return (
            <Link 
              key={act.id} 
              href={act.href}
              className="snap-start shrink-0 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Icon size={16} />
                </div>
                <ChevronRight size={16} className="text-[var(--text-secondary)]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{act.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{act.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
