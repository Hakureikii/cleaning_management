import { supabase } from "../config.js";

let btn_send_report = document.getElementById("btn_send_report");

let datetime = new Date();
let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let currDay = days[datetime.getDay()];

//MODALS
let reportModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('reportModal'));
let loadingModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loadingModal'));
let successReportModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('successReportModal'));

btn_send_report.addEventListener('click', async function () {
    // Close report modal
    reportModal.hide();

    // Loading Modal
    loadingModal.show();

    // User Id of the current user
    let { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.error("No user signed in!");
        return;
    }

    let userId = session.user.id;

    // Get section id of the current user
    let { data: presidents, error: presidents_error } = await supabase
        .from('presidents')
        .select('section_id')
        .eq('president_user_id', userId)
        .single();

    let sectionId = presidents.section_id;

    // Get cleaning duty id
    let { data: cleaning_duty, error: cleaning_duties_error } = await supabase
        .from('cleaning_duty')
        .select('cleaning_duty_id')
        .eq('section_id', sectionId)
        .eq('day', currDay)
        .single();

    let cleaningDutyId = cleaning_duty.cleaning_duty_id;

    if (!cleaningDutyId) {
        console.log('Weekends'); // Fix loading issue
        return;
    }

    // Upload image to supabase storage
    let photo = document.getElementById("photoInput").files[0];
    let photoPath = `${Date.now()}_${photo.name}`;

    let { data: storage, error: storage_error } = await supabase.storage
        .from('reports')
        .upload(photoPath, photo, {
            cacheControl: '3600',
            upsert: false
        });

    if (storage_error) {
        // close loading modal
        loadingModal.hide();
        console.error(storage_error); //change to a modal that gives users feedback for error uploading with error message
        return;
    }

    // Upload image and details to database
    let { data: report, error: report_error } = await supabase
        .from('reports')
        .insert([
            {
                cleaning_duty_id: cleaningDutyId,
                photo_proof: photoPath,
                datetime_sent: datetime.toISOString(),
                status: 'pending'
            }
        ])
        .select();

    if (report_error) {
        // close loading modal
        loadingModal.hide();
        console.error(report_error); // Change to a modal that gives users feedback for error submitting report with error message
        return;
    }

    // close loading modal
    loadingModal.hide();
    // show success modal
    successReportModal.show();
    
    photo.value = ''; 
});