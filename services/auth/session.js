import { supabase } from "../config.js";

export async function requireAuth() {
    const { data: { session }, error: error } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "../../index.html";
        return;
    }

}