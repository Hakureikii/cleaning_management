import { supabase } from "../config.js";

let loadingModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById('loadingModal')
);

let today = new Date();

let day_start = new Date(
    today.setHours(0, 0, 0, 0)
).toISOString();

let day_end = new Date(
    today.setHours(23, 59, 59, 999)
).toISOString();

let selected_day = day_start;
let selected_day_end = day_end;

let input_date = document.getElementById('filter_by_date');

let photo_container = document.getElementById(
    'report_photo_container'
);

let container = '';

let area_id = null;

let role = localStorage.getItem('role');

let accept_btn = document.getElementById('btn_accept_report');
let decline_btn = document.getElementById('btn_decline_report');

let selected_cleaning_duty_id = null;

/* =========================
   RENDER AREA ASSIGNMENTS
========================= */
export async function renderAreaAssignments() {

    let area_placeholder =
        document.getElementById("area_assignments");

    let area_assignments = '';

    // GET ALL AREAS
    let { data: areas, error } = await supabase
        .from('area_assignments')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    // GET REPORTS TODAY
    let { data: reports, error: reportError } =
        await supabase
            .from('reports')
            .select(`
                cleaning_duty!inner(
                    area_assignment_id
                ),
                datetime_sent
            `)
            .gte('datetime_sent', day_start)
            .lte('datetime_sent', day_end);

    

    if (reportError) {
        console.error(reportError);
        return;
    }

    // STORE REPORTED AREA IDS
    let reportedAreas = (reports || []).map(report =>
        report.cleaning_duty.area_assignment_id
    );

    areas.forEach(area => {

        let noReportsBadge = '';

        // OFFICER CHECK
        if (role === 'officer') {

            if (
                !reportedAreas.includes(
                    area.area_assignment_id
                )
            ) {

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
                        <strong>Area:</strong>
                        ${area.area}
                    </p>

                    <button
                        type="button"
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

    bindViewButtons();
}

/* =========================
   VIEW REPORTS
========================= */
function bindViewButtons() {

    let views =
        document.querySelectorAll('.view_report_btn');

    views.forEach(view => {

        view.addEventListener('click', async function () {

            accept_btn.disabled = false;
            decline_btn.disabled = false;

            area_id = this.dataset.areaid;

            photo_container.innerHTML = '';

            // IMPORTANT RESET
            container = '';

            // RESET DATE FILTER
            selected_day = day_start;
            selected_day_end = day_end;

            // GET SESSION
            let {
                data: { session }
            } = await supabase.auth.getSession();

            if (!session) {
                console.error("No user signed in!");
                return;
            }

            let userId = session.user.id;

            // GET PRESIDENT SECTION
            let {
                data: section,
                error: s_err
            } = await supabase
                .from('presidents')
                .select('section_id')
                .eq('president_user_id', userId);

            if (s_err) {
                console.error(s_err);
                return;
            }

            // REPORT QUERY
            let query = supabase
                .from('reports')
                .select(`
                    status,
                    datetime_sent,
                    photo_proof,
                    cleaning_duty!inner(
                        cleaning_duty_id,
                        area_assignment_id,
                        section_id
                    )
                `)
                .eq(
                    'cleaning_duty.area_assignment_id',
                    area_id
                )
                .gte('datetime_sent', day_start)
                .lte('datetime_sent', day_end);

            // PRESIDENT FILTER
            if (role === 'president') {

                if (!section || section.length === 0) {
                    console.error('No section found');
                    return;
                }

                query = query.eq(
                    'cleaning_duty.section_id',
                    section[0].section_id
                );
            }

            let {
                data: reports,
                error: r_err
            } = await query;

            if (r_err) {
                console.error(r_err);
                return;
            }

            // NO REPORTS
            if (!reports || reports.length === 0) {

                photo_container.innerHTML =
                    'No reports today';

                accept_btn.disabled = true;
                decline_btn.disabled = true;

                return;
            }

            console.log(reports.status);

            reports.forEach(report => {

                // STORE CLEANING DUTY ID
                selected_cleaning_duty_id =
                    report.cleaning_duty.cleaning_duty_id;

                let { data: photo_url } =
                    supabase.storage
                        .from('reports')
                        .getPublicUrl(
                            report.photo_proof
                        );

                container += `
                    <p>
                        <strong>Report Sent At:</strong>
                        ${report.datetime_sent}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${report.status}
                    </p>

                    <img
                        src="${photo_url.publicUrl}"
                        class="img-fluid mb-2 rounded"
                    >
                `;
            });

            photo_container.innerHTML = container;
        });
    });
}

/* =========================
   FILTER BY DATE
========================= */
let filter_btn =
    document.getElementById('filter_date_btn');

filter_btn.addEventListener(
    'click',
    async function () {

        if (!area_id) return;

        container = '';

        selected_day =
            `${input_date.value}T00:00:00.000Z`;

        selected_day_end =
            `${input_date.value}T23:59:59.999Z`;

        let {
            data: filter_date_record,
            error: f_err
        } = await supabase
            .from('reports')
            .select(`
                status,
                datetime_sent,
                photo_proof,
                cleaning_duty!inner(
                    cleaning_duty_id,
                    area_assignment_id
                )
            `)
            .eq(
                'cleaning_duty.area_assignment_id',
                area_id
            )
            .gte('datetime_sent', selected_day)
            .lte(
                'datetime_sent',
                selected_day_end
            );

        if (f_err) {
            console.error(f_err);
            return;
        }

        // NO RECORDS
        if (
            !filter_date_record ||
            filter_date_record.length === 0
        ) {

            photo_container.innerHTML =
                'No reports found for the selected date.';

            accept_btn.disabled = true;
            decline_btn.disabled = true;

            return;
        }

        // STORE CLEANING DUTY ID
        selected_cleaning_duty_id =
            filter_date_record[0]
                .cleaning_duty.cleaning_duty_id;

        filter_date_record.forEach(record => {

            let { data: photo_url } =
                supabase.storage
                    .from('reports')
                    .getPublicUrl(record.photo_proof);

            container += `
                <p>
                    <strong>Report Sent At:</strong>
                    ${record.datetime_sent}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${record.status}
                </p>

                <img
                    src="${photo_url.publicUrl}"
                    class="img-fluid mb-2 rounded"
                >
            `;
        });

        photo_container.innerHTML = container;
    }
);

/* =========================
   ACCEPT REPORT
========================= */
accept_btn.addEventListener(
    'click',
    async function () {

        if (!selected_cleaning_duty_id) {
            console.error(
                'No cleaning duty selected'
            );
            return;
        }

        let {
            error: s_err
        } = await supabase
            .from('reports')
            .update({
                status: 'Complete'
            })
            .eq(
                'cleaning_duty_id',
                selected_cleaning_duty_id
            )
            .gte('datetime_sent', selected_day)
            .lte(
                'datetime_sent',
                selected_day_end
            );

        if (s_err) {
            console.log(s_err);
            return;
        }

        console.log('Status Updated');
    }
);

/* =========================
   DECLINE REPORT
========================= */
decline_btn.addEventListener(
    'click',
    async function () {

        if (!selected_cleaning_duty_id) {
            console.error(
                'No cleaning duty selected'
            );
            return;
        }

        let {
            error: s_err
        } = await supabase
            .from('reports')
            .update({
                status: 'Declined'
            })
            .eq(
                'cleaning_duty_id',
                selected_cleaning_duty_id
            )
            .gte('datetime_sent', selected_day)
            .lte(
                'datetime_sent',
                selected_day_end
            );

        if (s_err) {
            console.log(s_err);
            return;
        }

        console.log('Status Updated');
    }
);
