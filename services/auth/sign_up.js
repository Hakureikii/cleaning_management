import { supabase } from "../config.js";

let btn_sign_up = document.getElementById("btn_sign_up");
btn_sign_up.addEventListener('click', async function () {

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
        console.error("Auth sign up error:", signup_err);
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
            console.error("Insert error:", error);
            return;
        }

        alert("President signed up successfully!");

    }

});