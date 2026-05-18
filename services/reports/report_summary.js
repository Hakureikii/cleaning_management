import { supabase } from '../config.js';

let summary_container = document.getElementById('summary');

export async function summary() {

   let report = '';

   const { data: sections, error: s_err } = await supabase
      .from('sections')
      .select('*');

   if (s_err) {
      console.log(s_err);
      return;
   }

   const { data: reports, error: r_err } = await supabase
      .from('reports')
      .select(`
         status,
         datetime_sent,
         cleaning_duty!inner(
            section_id
         )
      `);

   if (r_err) {
      console.log(r_err);
      return;
   }

   sections.forEach(section => {

      // STORE UNIQUE DATES
      let acceptedDates = new Set();
      let declinedDates = new Set();

      reports.forEach(report_item => {

         if (
            report_item.cleaning_duty.section_id ===
            section.section_id
         ) {

            // EXTRACT ONLY DATE
            let reportDate =
               report_item.datetime_sent.split('T')[0];

            // ACCEPTED
            if (report_item.status === 'Complete') {
               acceptedDates.add(reportDate);
            }

            // DECLINED
            if (report_item.status === 'Declined') {
               declinedDates.add(reportDate);
            }
         }
      });

      report += `
         <div class="card mb-3 area-card shadow-sm">

            <div class="card-body">

               <div class="d-flex justify-content-between align-items-start mb-3">

                  <div>
                     <h5 class="mb-1 fw-bold">
                        ${section.section_name}
                     </h5>

                     <small class="area-meta">
                        Section ID: ${section.section_id}
                     </small>
                  </div>

                  <span class="badge bg-primary">
                     Summary
                  </span>

               </div>

               <div class="row g-2">

                  <!-- ACCEPTED -->
                  <div class="col-6">
                     <div class="p-3 rounded-3 text-center"
                        style="background: rgba(16, 185, 129, 0.15);">

                        <div class="fw-bold text-success fs-5">
                           ${acceptedDates.size}
                        </div>

                        <small class="text-success">
                           Accepted Days
                        </small>

                     </div>
                  </div>

                  <!-- DECLINED -->
                  <div class="col-6">
                     <div class="p-3 rounded-3 text-center"
                        style="background: rgba(239, 68, 68, 0.15);">

                        <div class="fw-bold text-danger fs-5">
                           ${declinedDates.size}
                        </div>

                        <small class="text-danger">
                           Declined Days
                        </small>

                     </div>
                  </div>

               </div>

            </div>

         </div>
      `;
   });

   summary_container.innerHTML = report;
}