import { supabase } from "../config.js";

let btn_sign_in = document.getElementById("btn_sign_in");
btn_sign_in.addEventListener('click', async function () {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let role = document.getElementById("role").value

    let { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })

    if (error) {
        console.log("error:", error); // change to a error modal with close button
        return;
    }

    alert("Signed In"); // Change modal to a success modal

    window.location.href = 'president_dashboard.html';
});