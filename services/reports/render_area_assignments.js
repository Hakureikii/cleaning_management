import { supabase } from "../config.js";

let loadingModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loadingModal'));
let today = new Date();
let day_start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
let day_end = new Date(today.setHours(23, 59, 59, 999)).toISOString();
let selected_day = day_start;
let selected_day_end = day_end;
let input_date = document.getElementById('filter_by_date');
let photo_container = document.getElementById('report_photo_container');
let container = '';
let area_id = null;
let role = localStorage.getItem('role');
let accept_btn = document.getElementById('btn_accept_report');
let decline_btn = document.getElementById('btn_decline_report');
let selected_cleaning_duty_id = null;

export async function renderAreaAssignments() {
    let area_placeholder = document.getElementById("area_assignments");
    let area_assignments = '';

    // GET ALL AREAS
    let { data: areas, error } = await supabase
        .from('area_assignments')
        .select('*');

    // GET ALL REPORTS TODAY
    let { data: reports, error: reportError } = await supabase
        .from('reports')
        .select(`
            cleaning_duty!inner(
                area_assignment_id
            ),
            datetime_sent
        `)
        .gte('datetime_sent', day_start)
        .lte('datetime_sent', day_end);

    // STORE REPORTED AREA IDS
    let reportedAreas = reports.map(report =>
        report.cleaning_duty.area_assignment_id
    );

    areas.forEach(area => {

        let noReportsBadge = '';

        if (role === 'officer') {
            // CHECK IF AREA HAS REPORT
            if (!reportedAreas.includes(area.area_assignment_id)) {

                noReportsBadge = `
                <span class="badge bg-danger ms-2">
                    No Reports
                </span>
            `;
            }
        }

        area_assignments += `
            <div class="card shadow-sm mb-3 mx-3">
                <div class="card-body">

                    <h5 class="card-title">
                        Area Assignment
                        ${noReportsBadge}
                    </h5>

                    <p class="card-text">
                        <strong>Area:</strong> ${area.area}
                    </p>

                    <button
                    type='button'
                    class="btn btn-primary view_report_btn"
                    data-bs-toggle="modal"
                    data-bs-target="#detailsModal"
                    data-areaid="${area.area_assignment_id}">
                        View Reports
                    </button>

                </div>
            </div>
        `;
    });

    area_placeholder.innerHTML = area_assignments;

    let views = document.querySelectorAll('.view_report_btn');
    views.forEach(view => {
        view.addEventListener('click', async function () {
            accept_btn.disabled = false;
            decline_btn.disabled = false;
            area_id = this.dataset.areaid;
            photo_container.innerHTML = '';

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

            let query = supabase
                .from('reports')
                .select('cleaning_duty!inner(cleaning_duty_id, area_assignment_id, section_id), datetime_sent, photo_proof')
                .eq('cleaning_duty.area_assignment_id', area_id)
                .gte('datetime_sent', day_start)
                .lte('datetime_sent', day_end)

            if (role === 'president') {
                query = query.eq('cleaning_duty.section_id', section[0].section_id);
            }

            let { data: reports, error: r_err } = await query;

            if (reports.length === 0) {
                photo_container.innerHTML = 'No reports today';
                return;
            }

            reports.forEach(report => {

                selected_cleaning_duty_id = report.cleaning_duty.cleaning_duty_id;

                let { data: photo_url } = supabase.storage
                    .from('reports')
                    .getPublicUrl(report.photo_proof);
                container += `
                <p><strong>Report Sent At:</strong> ${report.datetime_sent}</p>
                <p><strong>Status:</strong> ${report.status}</p>
                <img src="${photo_url.publicUrl}" class="img-fluid mb-2 rounded"></img>
                `
            });
            photo_container.innerHTML = container;
        });

    });

    // filter records by date
    let filter_btn = document.getElementById('filter_date_btn');
    filter_btn.addEventListener('click', async function () {
        container = '';
        selected_day = `${input_date.value}T00:00:00.000Z`;
        selected_day_end = `${input_date.value}T23:59:59.999Z`;

        let { data: filter_date_record, error: f_err } = await supabase
            .from('reports')
            .select("*, cleaning_duty!inner(area_assignment_id)")
            .eq('cleaning_duty.area_assignment_id', area_id)
            .gte('datetime_sent', selected_day)
            .lte('datetime_sent', selected_day_end);

        if (filter_date_record.length === 0) {
            photo_container.innerHTML = 'No reports found for the selected date.';
            accept_btn.disabled = true;
            decline_btn.disabled = true;
            return;
        }

        selected_cleaning_duty_id = filter_date_record[0].cleaning_duty_id;

        filter_date_record.forEach(record => {
            let { data: photo_url } = supabase.storage
                .from('reports')
                .getPublicUrl(record.photo_proof);
            container += `
                <p><strong>Report Sent At:</strong> ${record.datetime_sent}</p>
                <p><strong>Status:</strong> ${record.status}</p>
                <img src="${photo_url.publicUrl}" class="img-fluid mb-2 rounded">
                `
        });
        photo_container.innerHTML = container;
    });

    // report status
    accept_btn.addEventListener('click', async function () {
        let { data: status, error: s_err } = await supabase
            .from('reports')
            .update({
                status: 'Complete'
            })
            .eq('cleaning_duty_id', selected_cleaning_duty_id)
            .gte('datetime_sent', selected_day)
            .lte('datetime_sent', selected_day_end);
        
        if (s_err) {
            console.log(s_err);
            return;
        }

        console.log('Status Report'); // change to a success modal
    });

    decline_btn.addEventListener('click', async function () {
        let { data: status, error: s_err } = await supabase
            .from('reports')
            .update({
                status: 'Declined'
            })
            .eq('cleaning_duty_id', selected_cleaning_duty_id)
            .gte('datetime_sent', selected_day)
            .lte('datetime_sent', selected_day_end);
        
        if (s_err) {
            console.log(s_err);
            return;
        }

        console.log('Status Report'); // change to a success modal
    });
}