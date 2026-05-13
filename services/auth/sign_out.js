import { supabase } from "../config.js";

let btn_sign_out = document.getElementById("btn_sign_out");
// confirmation modal for signing out

btn_sign_out.addEventListener('click', async function () {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "../index.html";
});