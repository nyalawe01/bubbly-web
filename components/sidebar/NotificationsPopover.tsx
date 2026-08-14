"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { createClient } from "@/app/utils/supabase";

interface NotificationsPopoverProps {
  colors: any;
  showContent: boolean;
}

export function NotificationsPopover({ colors, showContent }: NotificationsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = createClient();

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
      
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();

    // Setup realtime subscription
    const channel = supabase.channel('notifications_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    fetchNotifications();
  };

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`icon-motion w-full flex items-center gap-2.5 rounded-lg transition-colors ${colors.textPrimary} ${colors.bgHover} border ${colors.borderBase} ${
          showContent ? "px-2.5 py-2" : "justify-center py-2"
        } relative`}
      >
        <Bell size={16} className="flex-shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 left-5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm border border-white" />
        )}
        {showContent && (
          <div className="flex flex-1 items-center justify-between min-w-0">
            <span className="text-[13px] font-medium truncate">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`absolute bottom-0 left-full ml-2 w-80 ${colors.bgCard} border ${colors.borderBase} rounded-xl shadow-2xl z-50 flex flex-col max-h-[400px] animate-in fade-in slide-in-from-left-2 duration-200`}>
          <div className={`p-3 border-b ${colors.borderBase} flex items-center justify-between bg-white/40 backdrop-blur-sm rounded-t-xl`}>
            <h3 className={`font-semibold text-sm ${colors.textPrimary}`}>Notifications</h3>
            <div className="flex items-center gap-1">
              <button onClick={markAllAsRead} className={`p-1 rounded hover:bg-black/5 text-gray-500 transition-colors`} title="Mark all as read">
                <Check size={14} />
              </button>
              <button onClick={clearAll} className={`p-1 rounded hover:bg-black/5 text-gray-500 transition-colors`} title="Clear all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No new notifications.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 rounded-lg text-sm transition-colors ${n.read ? 'opacity-70' : 'bg-indigo-50 border border-indigo-100'}`}>
                  <div className="font-medium text-gray-900 mb-0.5 flex items-start justify-between gap-2">
                    {n.title}
                    {!n.read && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                  <div className="text-gray-600 text-xs leading-relaxed">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
