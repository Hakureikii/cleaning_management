import { supabase } from "../config.js";

let loadingModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loadingModal'));
let today = new Date();
let day_start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
let day_end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

console.log(day_start, day_end);

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
                        <button
                        type='button'
                        class="btn btn-primary view_report_btn"
                        data-bs-toggle="modal"
                        data-bs-target="#detailsModal"
                        data-areaid="${area.area_assignment_id}">
                            View Reports
                        </button>
                    </p>
                </div>
            </div>`
    });

    area_placeholder.innerHTML = area_assignments;

    let views = document.querySelectorAll('.view_report_btn');
    views.forEach(view => {
        view.addEventListener('click', async function () {
            let area_id = this.dataset.areaid;

            // for presidents get section id
            let { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.error("No user signed in!");
                return;
            }

            let userId = session.user.id;

            let { data: section, error: s_err } = await supabase
                .from('presidents')
                .select('section_id')
                .eq('president_user_id', userId);

            // console.log(section);

            // get reports based on the rooms and the current date (default view)
            let { data: reports, error: r_err } = await supabase
                .from('reports')
                .select('cleaning_duty!inner(cleaning_duty_id, area_assignment_id, section_id), datetime_sent, photo_proof')
                .eq('cleaning_duty.area_assignment_id', area_id)
                .eq('cleaning_duty.section_id', section[0].section_id);
                // .gte('datetime_sent', day_start)
                // .lte('datetime_sent', day_end);
            
            // console.log(r_err);
            console.log(reports);
            // if (!reports) {
            //     console.log('Null');
            // }
            

            // retrieve images from storage
            // let { data, error } = await supabase.storage.from('reports').list('', {
            //     limit: 100,
            //     offset: 0
            // });

            // if (error) {
            //     console.error("Error listing files:", error);
            //     return;
            // }

            // let photo_name = data[1].name;

            // // get the url of the photo
            // let { data: photo } = supabase.storage
            //     .from('reports')
            //     .getPublicUrl(photo_name);

            // console.log(photo.publicUrl);

        });
    });
}

