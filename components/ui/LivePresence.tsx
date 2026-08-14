"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";

interface LivePresenceProps {
  roomId: string;
}

export function LivePresence({ roomId }: LivePresenceProps) {
  const [users, setUsers] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function setupPresence() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase.channel(`room:${roomId}`, {
        config: { presence: { key: user.id } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeUsers = Object.values(state).map((presence: any) => presence[0]);
        setUsers(activeUsers);
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            email: user.email,
            online_at: new Date().toISOString(),
          });
        }
      });
    }

    setupPresence();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId]);

  if (users.length <= 1) return null; // Don't show if it's just me

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-100 rounded-full shadow-sm animate-in fade-in zoom-in-95">
      <div className="flex -space-x-2">
        {users.map((u, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" title={u.email}>
            {u.email ? u.email.charAt(0).toUpperCase() : "U"}
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-gray-600">
        {users.length} viewing
      </span>
    </div>
  );
}
