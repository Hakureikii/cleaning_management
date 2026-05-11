import { supabase } from "./config.js";

let { data: sections, error } = await supabase
    .from('sections')
    .select('*');
console.log(sections);