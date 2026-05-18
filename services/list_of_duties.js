import { supabase } from './config.js'

let duty_placeholder = document.getElementById('duties');
let container = '';

export async function duties() {
   // * GET USER ID OF THE CURRENT USER * //
   let { data: { session } } = await supabase.auth.getSession();

   if (!session) {
      console.error("No user signed in!");
      return;
   }

   let userId = session.user.id;

   // * RETRIEVE CURRENT USER'S SECTION * //
   let { data: presidents, error: presidents_error } = await supabase
      .from('presidents')
      .select('section_id')
      .eq('president_user_id', userId)
      .single();

   let section_id = presidents.section_id;

   // * RETRIEVE DUTIES BY SECTION * //
   const { data: duty, error: d_err } = await supabase
      .from('cleaning_duty')
      .select('*, area_assignments!inner(area)')
      .eq('section_id', section_id)

   duty.forEach(duties => {

      container += `
   
      <div class="card area-card shadow-sm mb-3">

         <div class="card-body">

            <!-- TOP -->
            <div class="d-flex justify-content-between align-items-start mb-3">

               <div>
                  <h5 class="fw-bold mb-1">
                     <i class="bi bi-list-task text-info"></i>
                     ${duties.duty}
                  </h5>

                  <small class="area-meta">
                     Cleaning Duty Assignment
                  </small>
               </div>

               <span class="badge bg-primary">
                  ${duties.day}
               </span>

            </div>

            <!-- DETAILS -->
            <div class="row g-3">

               <!-- AREA -->
               <div class="col-md-6">

                  <div class="p-3 rounded-3"
                     style="background: rgba(14, 165, 233, 0.12);">

                     <small class="text-info d-block mb-1">
                        Assigned Area
                     </small>

                     <div class="fw-semibold">
                        <i class="bi bi-geo-alt-fill text-info"></i>
                        ${duties.area_assignments.area}
                     </div>

                  </div>

               </div>

               <!-- DAY -->
               <div class="col-md-6">

                  <div class="p-3 rounded-3"
                     style="background: rgba(16, 185, 129, 0.12);">

                     <small class="text-success d-block mb-1">
                        Scheduled Day
                     </small>

                     <div class="fw-semibold">
                        <i class="bi bi-calendar-event-fill text-success"></i>
                        ${duties.day}
                     </div>

                  </div>

               </div>

            </div>

         </div>

      </div>

   `;
   });

   duty_placeholder.innerHTML = container;
}
