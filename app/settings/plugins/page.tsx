"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase";
import { Plug, Unplug, Settings, Activity } from "lucide-react";
import Image from "next/image";

export default function PluginSettings() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [connections, setConnections] = useState<Record<string, any>>({});
  const supabase = createClient();

  useEffect(() => {
    supabase.from("plugins").select("*").eq("is_enabled", true).then(({ data }) => setPlugins(data || []));
    supabase.from("user_plugin_connections").select("*").then(({ data }) => {
      const connMap: Record<string, any> = {};
      data?.forEach(conn => connMap[conn.plugin_id] = conn);
      setConnections(connMap);
    });
  }, []);

  const toggleConnection = async (pluginId: string, isConnected: boolean) => {
    // In real implementation, this would trigger OAuth or call /api/plugins/connect
    if (isConnected) {
      await supabase.from("user_plugin_connections").delete().eq("plugin_id", pluginId);
    } else {
      await supabase.from("user_plugin_connections").insert({ plugin_id: pluginId, user_id: (await supabase.auth.getUser()).data.user?.id, is_connected: true });
    }
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Plug className="text-indigo-600" /> Integrations & Plugins
        </h1>
        <p className="text-gray-500 mt-2">Connect EduOS to your other academic tools.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plugins.map(plugin => {
          const isConnected = !!connections[plugin.id];
          return (
            <div key={plugin.id} className="bg-white border p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center p-2">
                    {/* Mock Icon */}
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {plugin.display_name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{plugin.display_name}</h3>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isConnected ? 'Connected' : 'Available'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{plugin.description}</p>
              </div>
              
              <div className="flex items-center justify-between border-t pt-4">
                {isConnected ? (
                  <>
                    <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <Settings size={14} /> Configure
                    </button>
                    <button onClick={() => toggleConnection(plugin.id, true)} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                      <Unplug size={14} /> Disconnect
                    </button>
                  </>
                ) : (
                  <button onClick={() => toggleConnection(plugin.id, false)} className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium text-sm hover:bg-indigo-100 flex items-center justify-center gap-2">
                    <Plug size={16} /> Connect Account
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
