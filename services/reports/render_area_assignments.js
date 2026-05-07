import { supabase } from "../config.js";

export async function renderAreaAssignments() {
    let area_assignments = ''
    let area_placeholder = document.getElementById("area_assignments");

    let { data, error } = await supabase
        .from('area_assignments')
        .select('*')

    data.forEach(area => {
        area_assignments +=
            `<div class="card shadow-sm mb-3 mx-3">
                <div class="card-body">
                    <h5 class="card-title">Area Assignment</h5>
                    <p class="card-text">
                        <strong>Area:</strong> ${area.area}
                        <button type='button' class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#detailsModal">
                            View Reports
                        </button>
                    </p>
                </div>
            </div>`
        console.log(area.area); // Change to rendering the area assignments in the UI
    });
    area_placeholder.innerHTML = area_assignments;
}