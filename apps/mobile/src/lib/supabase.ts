import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra ?? {};

const supabaseUrl = extra.supabaseUrl as string;
const supabaseAnonKey = extra.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Configure supabaseUrl e supabaseAnonKey em app.json (campo expo.extra) ou via EAS env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);