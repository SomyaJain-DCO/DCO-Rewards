// Make sure to install @supabase/supabase-js and @types/node for type support
// npm install @supabase/supabase-js
// npm install --save-dev @types/node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); 