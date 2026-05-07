import { supabase } from "../config.js";

let btn_sign_in = document.getElementById("btn_sign_in");
btn_sign_in.addEventListener('click', async function() {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let role = document.getElementById("role").value

    alert("Sign In button clicked");
});