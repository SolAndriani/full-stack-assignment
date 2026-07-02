const { createAdminSupabaseClient } = require('./supabase-server');

const ALLOWED_FIELDS = [
  'name',
  'description',
  'department_id',
  'permissions',
  'reporting_role_id',
  'hierarchy_level',
  'display_order',
];

async function updateRole(roleId, body) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    throw new Error('Failed to create admin Supabase client');
  }

  const updates = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] =
        field === 'name' && typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No valid fields provided to update');
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', roleId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update role');
  }

  return data;
}

const roleManagementService = { updateRole };

exports.roleManagementService = roleManagementService;