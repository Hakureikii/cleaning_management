import { supabase } from "../config.js";

let btn_sign_up = document.getElementById("btn_sign_up");
btn_sign_up.addEventListener('click', async function () {
    // Loading modal

    let fname = document.getElementById("fname").value;
    let mname = document.getElementById("mname").value;
    let lname = document.getElementById("lname").value;
    let section = document.getElementById("section").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let role = document.getElementById("role").value;

    let { data: signup, error: signup_err } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (signup_err) {
        // close loading modal
        console.error("Auth sign up error:", signup_err); // Change to an error modal with error message
        return;
    }

    let user_id = signup.user.id;

    if (role === "president") {

        const { data, error } = await supabase
            .from('presidents')
            .insert([
                {
                    president_user_id: user_id,
                    first_name: fname,
                    middle_name: mname,
                    last_name: lname,
                    section_id: section,
                    email: email
                }
            ])
            .select();

        if (error) {
            // close loading modal
            console.error("Insert error:", error); // Change to an error modal with error message
            return;
        }

        alert("President signed up successfully!"); // Change to a success modal
    }

    else if (role === "officer") {
        const { data, error } = await supabase
            .from('council_officers')
            .insert([
                {
                    first_name: fname,
                    middle_name: mname,
                    last_name: lname,
                    section_id: section,
                    council_officer_uuid: user_id,
                    email: email
                }
            ])
            .select();

        if (error) {
            // close loading modal
            console.error("Insert error:", error); // Change to an error modal with error message
            return;
        }

        alert("Council officer signed up successfully!"); // Change to a success modal
        window.location.href = 'sign_in.html';
    }

});