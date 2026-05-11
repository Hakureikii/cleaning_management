import { supabase } from "../config.js";

let btn_sign_in = document.getElementById("btn_sign_in");
btn_sign_in.addEventListener('click', async function () {
    // Loading modal

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let role = document.getElementById("role").value

    if (role === "president") {
        let { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            // close loading modal
            console.log("error:", error); // change to a error modal with close button
            return;
        }

        window.location.href = 'president_dashboard.html';

    } else if (role === "officer") {
        let { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            // close loading modal
            console.log("error:", error); // change to a error modal with close button
            return;
        }

        window.location.href = 'officer_dashboard.html';
    }

    // close loading modal
    localStorage.setItem('role', role);
    alert("Signed In"); // Change modal to a success modal
});