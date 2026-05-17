import { supabase } from "../config.js";

let loadingModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById('loadingModal')
);

let today = new Date();
let day_start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
let day_end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

let input_date = document.getElementById('filter_by_date');
let photo_container = document.getElementById('report_photo_container');

let area_id = null;
let role = localStorage.getItem('role');

let container = "";

/* =========================
   AREA ASSIGNMENTS RENDER
========================= */
export async function renderAreaAssignments() {

    const area_placeholder = document.getElementById("area_assignments");
    area_placeholder.innerHTML = "";

    const { data, error } = await supabase
        .from('area_assignments')
        .select('*');

    if (error) {
        console.error(error);
        area_placeholder.innerHTML = `<p class="text-danger">Failed to load areas.</p>`;
        return;
    }

    let html = "";

    data.forEach(area => {
        html += `
        <div class="card area-card shadow-sm mb-3 border-0">
            <div class="card-body d-flex justify-content-between align-items-center">

                <div>
                    <h5 class="mb-1">${area.area}</h5>
                    <small class="area-meta">
                        Area Assignment ID: ${area.area_assignment_id}
                    </small>
                </div>

                <button 
                    class="btn btn-outline-primary view_report_btn"
                    data-bs-toggle="modal"
                    data-bs-target="#detailsModal"
                    data-areaid="${area.area_assignment_id}">
                    <i class="bi bi-arrows-expand"></i> View
                </button>

            </div>
        </div>`;
    });

    area_placeholder.innerHTML = html;

    bindViewButtons();
}


/* =========================
   VIEW REPORT BUTTONS
========================= */
function bindViewButtons() {

    document.querySelectorAll('.view_report_btn')
        .forEach(btn => {

            btn.addEventListener('click', async function () {

                area_id = this.dataset.areaid;
                photo_container.innerHTML = "";

                const { data: { session } } = await supabase.auth.getSession();

                if (!session) return;

                const userId = session.user.id;

                const { data: sectionData } = await supabase
                    .from('presidents')
                    .select('section_id')
                    .eq('president_user_id', userId)
                    .single();

                let query = supabase
                    .from('reports')
                    .select(`
                        datetime_sent,
                        photo_proof,
                        cleaning_duty!inner (
                            area_assignment_id,
                            section_id
                        )
                    `)
                    .eq('cleaning_duty.area_assignment_id', area_id)
                    .gte('datetime_sent', day_start)
                    .lte('datetime_sent', day_end);

                if (role === 'president') {
                    query = query.eq(
                        'cleaning_duty.section_id',
                        sectionData.section_id
                    );
                }

                const { data: reports, error } = await query;

                renderReports(reports);
            });

        });
}


/* =========================
   REPORT RENDERER (FIXED UI)
========================= */
function renderReports(reports) {

    if (!reports || reports.length === 0) {
        photo_container.innerHTML = `
            <div class="text-muted text-center p-4">
                No reports found.
            </div>`;
        return;
    }

    container = `<div class="report-grid">`;

    reports.forEach(r => {

        let { data: img } = supabase.storage
            .from('reports')
            .getPublicUrl(r.photo_proof);

        container += `
        <div class="report-photo-card">

            <img src="${img.publicUrl}" class="report-img"/>

            <div class="report-meta">
                <small>${new Date(r.datetime_sent).toLocaleString()}</small>
            </div>

        </div>`;
    });

    container += `</div>`;
    photo_container.innerHTML = container;
}


/* =========================
   FILTER BY DATE
========================= */
document.getElementById('filter_date_btn')
    .addEventListener('click', async function () {

        if (!area_id) return;

        container = "";

        let date = input_date.value;

        let start = `${date}T00:00:00.000Z`;
        let end = `${date}T23:59:59.999Z`;

        const { data, error } = await supabase
            .from('reports')
            .select(`
                datetime_sent,
                photo_proof,
                cleaning_duty!inner(area_assignment_id)
            `)
            .eq('cleaning_duty.area_assignment_id', area_id)
            .gte('datetime_sent', start)
            .lte('datetime_sent', end);

        renderReports(data);
    });