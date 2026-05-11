import { supabase } from "../config.js";

let loadingModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loadingModal'));
let today = new Date();
let day_start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
let day_end = new Date(today.setHours(23, 59, 59, 999)).toISOString();
let input_date = document.getElementById('filter_by_date');
let photo_container = document.getElementById('report_photo_container');
let container = '';
let area_id = null;
let role = localStorage.getItem('role');

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
            area_id = this.dataset.areaid;
            container = '';

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

            // get reports based on the rooms and the current date (default view)

            if (role === 'president') {
                let { data: reports, error: r_err } = await supabase
                    .from('reports')
                    .select('cleaning_duty!inner(cleaning_duty_id, area_assignment_id, section_id), datetime_sent, photo_proof')
                    .eq('cleaning_duty.area_assignment_id', area_id)
                    .eq('cleaning_duty.section_id', section[0].section_id)
                    .gte('datetime_sent', day_start)
                    .lte('datetime_sent', day_end);

                console.log(reports);

                if (reports.length === 0) {
                    console.log('No reports found for this area assignment today.');
                    photo_container.innerHTML = 'No reports found for this area assignment today'; // Update the style
                    return;
                }
                // get the url of the photo
                reports.forEach(report => {

                    let { data: photo_url } = supabase.storage
                        .from('reports')
                        .getPublicUrl(report.photo_proof);
                    //display to the modal
                    container += `
                <p><strong>Report Sent At:</strong> ${report.datetime_sent}</p>
                <img src="${photo_url.publicUrl}" class="img-fluid mb-2 rounded">
                `
                });
                photo_container.innerHTML = container;

            } else if (role === 'officer') {
                let { data: reports, error: r_err } = await supabase
                    .from('reports')
                    .select('cleaning_duty!inner(cleaning_duty_id, area_assignment_id), datetime_sent, photo_proof')
                    .eq('cleaning_duty.area_assignment_id', area_id)
                    .gte('datetime_sent', day_start)
                    .lte('datetime_sent', day_end);
                console.log(reports);
                // get the url of the photo
                reports.forEach(report => {

                    let { data: photo_url } = supabase.storage
                        .from('reports')
                        .getPublicUrl(report.photo_proof);
                    //display to the modal
                    container += `
                <p><strong>Report Sent At:</strong> ${report.datetime_sent}</p>
                <img src="${photo_url.publicUrl}" class="img-fluid mb-2 rounded">
                `
                });

                photo_container.innerHTML = container;
            }
        });

    });

    // filter records by date
    let filter_btn = document.getElementById('filter_date_btn');
    filter_btn.addEventListener('click', async function () {
        container = '';
        let filter_day_start = `${input_date.value}T00:00:00.000Z`;
        let filter_day_end = `${input_date.value}T23:59:59.999Z`;

        let { data: filter_date_record, error: f_err } = await supabase
            .from('reports')
            .select("*, cleaning_duty!inner(area_assignment_id)")
            .eq('cleaning_duty.area_assignment_id', area_id)
            .gte('datetime_sent', filter_day_start)
            .lte('datetime_sent', filter_day_end);

        if (filter_date_record.length === 0) {
            photo_container.innerHTML = 'No reports found for the selected date.';
            return;
        }

        filter_date_record.forEach(record => {
            let { data: photo_url } = supabase.storage
                .from('reports')
                .getPublicUrl(record.photo_proof);
            container += `
                <p><strong>Report Sent At:</strong> ${record.datetime_sent}</p>
                <img src="${photo_url.publicUrl}" class="img-fluid mb-2 rounded">
                `
        });
        photo_container.innerHTML = container;
        console.log(filter_date_record);
    });
}

