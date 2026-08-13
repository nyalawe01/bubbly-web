import { createClient } from "@supabase/supabase-js";
import { GoogleDrivePlugin } from "./google_drive";
import { GoogleCalendarPlugin } from "./google_calendar";

export interface TriggerDefinition {
  type: string;
  description: string;
}

export interface ActionDefinition {
  name: string;
  description: string;
}

export interface EduOSPlugin {
  id: string;
  name: string;
  
  onConnect(userId: string): Promise<void>;
  onDisconnect(userId: string): Promise<void>;
  
  capabilities: {
    triggers?: TriggerDefinition[];
    actions?: ActionDefinition[];
    search?: boolean;
  };
  
  executeAction(userId: string, action: string, payload: any): Promise<any>;
}

const PLUGINS: Record<string, EduOSPlugin> = {
  "google_drive": new GoogleDrivePlugin(),
  "google_calendar": new GoogleCalendarPlugin(),
};

export class PluginManager {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  async connectPlugin(userId: string, pluginName: string, oauthCode: string) {
    const plugin = PLUGINS[pluginName];
    if (!plugin) throw new Error("Unknown plugin");

    // Stub for OAuth exchange
    const { data: pluginRow } = await this.supabase.from("plugins").select("id").eq("name", pluginName).single();
    if (!pluginRow) throw new Error("Plugin not found in DB");

    await this.supabase.from("user_plugin_connections").upsert({
      user_id: userId,
      plugin_id: pluginRow.id,
      is_connected: true,
      access_token_encrypted: "MOCKED_TOKEN", // In real system, exchange oauthCode and encrypt
    }, { onConflict: "user_id,plugin_id" });

    await plugin.onConnect(userId);
  }

  async disconnectPlugin(userId: string, pluginName: string) {
    const plugin = PLUGINS[pluginName];
    if (!plugin) throw new Error("Unknown plugin");

    const { data: pluginRow } = await this.supabase.from("plugins").select("id").eq("name", pluginName).single();
    if (!pluginRow) return;

    await plugin.onDisconnect(userId);
    
    await this.supabase.from("user_plugin_connections").delete()
      .eq("user_id", userId)
      .eq("plugin_id", pluginRow.id);
  }

  async executePluginAction(userId: string, pluginName: string, action: string, payload: any) {
    const plugin = PLUGINS[pluginName];
    if (!plugin) throw new Error("Unknown plugin");

    const { data: pluginRow } = await this.supabase.from("plugins").select("id").eq("name", pluginName).single();
    
    try {
      const result = await plugin.executeAction(userId, action, payload);
      
      if (pluginRow) {
        await this.supabase.from("plugin_action_log").insert({
          user_id: userId,
          plugin_id: pluginRow.id,
          action,
          payload_summary: payload,
          status: "success"
        });
      }
      return result;
    } catch (error: any) {
      if (pluginRow) {
        await this.supabase.from("plugin_action_log").insert({
          user_id: userId,
          plugin_id: pluginRow.id,
          action,
          payload_summary: payload,
          status: `error: ${error.message}`
        });
      }
      throw error;
    }
  }
}
