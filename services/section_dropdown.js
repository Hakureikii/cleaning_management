import { supabase } from "./config.js";

export async function sections() {
    let dropdown = document.getElementById('section_dropdown');

    let { data: sections, error } = await supabase
        .from('sections')
        .select('*');

    if (error) {
        console.log(error);
        return;
    }

    let options = `
        <option selected disabled>
            Select Section
        </option>
    `;

    sections.forEach(section => {

        options += `
            <option value="${section.section_id}">
                ${section.section_name}
            </option>
        `;
    });

    dropdown.innerHTML = options;
}