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

    let { data: areas, error } = await supabase
        .from('area_assignments')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

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

    let reportedAreas = (reports || []).map(report =>
        report.cleaning_duty.area_assignment_id
    );

    areas.forEach(area => {

        let noReportsBadge = '';

        if (role === 'officer') {

            if (!reportedAreas.includes(area.area_assignment_id)) {
                noReportsBadge = `
                    <span class="badge bg-danger ms-2">
                        No Reports
                    </span>
                `;
            }
        }

        area_assignments += `
            <div class="card shadow-sm mb-3 mx-3 area-card">

                <div class="card-body">

                    <div class="d-flex justify-content-between align-items-start mb-2">

                        <h5 class="card-title mb-0">
                            ${area.area}
                        </h5>

                        ${noReportsBadge}

                    </div>

                    <p class="area-meta mb-3">
                        Area Assignment ID: ${area.area_assignment_id}
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

            if (role === 'officer') {
                accept_btn.disabled = false;
                decline_btn.disabled = false;
                accept_btn.classList.remove('btn-outline-success');
                accept_btn.classList.add('btn-success');

                decline_btn.classList.remove('btn-outline-danger');
                decline_btn.classList.add('btn-danger');
            }
            area_id = this.dataset.areaid;

            photo_container.innerHTML = '';
            container = '';

            selected_day = day_start;
            selected_day_end = day_end;

            let {
                data: { session }
            } = await supabase.auth.getSession();

            if (!session) {
                console.error("No user signed in!");
                return;
            }

            let userId = session.user.id;

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
                .eq('cleaning_duty.area_assignment_id', area_id)
                .gte('datetime_sent', day_start)
                .lte('datetime_sent', day_end);

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

            if (role === 'officer') {

                if (!reports || reports.length === 0) {

                    photo_container.innerHTML = `
                        <div class="text-center py-4 text-muted">
                            <i class="bi bi-inbox fs-2"></i>
                            <p class="mt-2 mb-0">No reports found</p>
                        </div>
                    `;

                    accept_btn.disabled = true;
                    decline_btn.disabled = true;

                    return;
                }

                if (
                    reports[0].status === 'Complete' ||
                    reports[0].status === 'Declined'
                ) {
                    accept_btn.disabled = true;
                    decline_btn.disabled = true;
                }
            }

            reports.forEach(report => {

                selected_cleaning_duty_id =
                    report.cleaning_duty.cleaning_duty_id;

                let { data: photo_url } =
                    supabase.storage
                        .from('reports')
                        .getPublicUrl(report.photo_proof);

                let statusBadge = '';

                if (report.status === 'Complete') {
                    statusBadge = `<span class="badge bg-success">Accepted</span>`;
                } else if (report.status === 'Declined') {
                    statusBadge = `<span class="badge bg-danger">Declined</span>`;
                } else {
                    statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
                }

                container += `
                    <div class="report-photo-card mb-3">

                        <img src="${photo_url.publicUrl}" />

                        <div class="report-meta">

                            <div class="date-time">
                                ${report.datetime_sent}
                            </div>

                            <div class="d-flex justify-content-between align-items-center">

                                <span class="meta-label">
                                    Status
                                </span>

                                ${statusBadge}

                            </div>

                        </div>

                    </div>
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

        if (role === 'officer') {
            accept_btn.disabled = false;
            decline_btn.disabled = false;
        }


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
            .eq('cleaning_duty.area_assignment_id', area_id)
            .gte('datetime_sent', selected_day)
            .lte('datetime_sent', selected_day_end);

        if (f_err) {
            console.error(f_err);
            return;
        }

        console.log(filter_date_record);

        if (!filter_date_record || filter_date_record.length === 0) {

            photo_container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-calendar-x fs-2"></i>
                    <p class="mt-2 mb-0">No reports found</p>
                </div>
            `;
            if (role === 'officer') {
                accept_btn.disabled = true;
                decline_btn.disabled = true;

            }

            return;
        }

        if (
            filter_date_record[0].status === 'Complete' ||
            filter_date_record[0].status === 'Declined'
        ) {
            if (role === 'officer') {
                accept_btn.disabled = true;
                decline_btn.disabled = true;
            }

        }

        selected_cleaning_duty_id =
            filter_date_record[0]
                .cleaning_duty.cleaning_duty_id;

        filter_date_record.forEach(record => {

            let { data: photo_url } =
                supabase.storage
                    .from('reports')
                    .getPublicUrl(record.photo_proof);

            let statusBadge = '';

            if (record.status === 'Complete') {
                statusBadge = `<span class="badge bg-success">Accepted</span>`;
            } else if (record.status === 'Declined') {
                statusBadge = `<span class="badge bg-danger">Declined</span>`;
            } else {
                statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
            }

            container += `
                <div class="report-photo-card mb-3">

                    <img src="${photo_url.publicUrl}" />

                    <div class="report-meta">

                        <div class="date-time">
                            ${record.datetime_sent}
                        </div>

                        <div class="d-flex justify-content-between align-items-center">

                            <span class="meta-label">
                                Status
                            </span>

                            ${statusBadge}

                        </div>

                    </div>

                </div>
            `;
        });

        photo_container.innerHTML = container;
    }
);

/* =========================
   ACCEPT REPORT
========================= */
if (role === 'officer') {

    accept_btn.addEventListener('click', async function () {

        if (!selected_cleaning_duty_id) return;

        let { error } = await supabase
            .from('reports')
            .update({ status: 'Complete' })
            .eq('cleaning_duty_id', selected_cleaning_duty_id)
            .gte('datetime_sent', selected_day)
            .lte('datetime_sent', selected_day_end);

        if (error) {
            console.log(error);
            return;
        }

        accept_btn.disabled = true;
        decline_btn.disabled = true;

        alert('Report Accepted');
    });

    /* =========================
       DECLINE REPORT
    ========================= */
    decline_btn.addEventListener('click', async function () {

        if (!selected_cleaning_duty_id) return;

        let { error } = await supabase
            .from('reports')
            .update({ status: 'Declined' })
            .eq('cleaning_duty_id', selected_cleaning_duty_id)
            .gte('datetime_sent', selected_day)
            .lte('datetime_sent', selected_day_end);

        if (error) {
            console.log(error);
            return;
        }

        accept_btn.disabled = true;
        decline_btn.disabled = true;

        alert('Report Declined');
    });
}