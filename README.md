# Worklo — Full-Stack Assignment

## How to Run This Project

1. Clone this repository and install dependencies:

   ```bash
   git clone https://github.com/SolAndriani/full-stack-assignment
   cd full-stack-assignment
   npm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.local.template .env.local
   ```

   Fill in your Supabase project URL and keys in `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   SETUP_SECRET=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Run the database schema in the Supabase SQL Editor:
   - Run `supabase/schema.sql`
   - **Important:** the base schema is missing the `display_order` column on the `roles` table, which the existing `/api/roles` endpoint requires. Also run:

   ```sql
   alter table roles add column display_order integer not null default 0;

   with ordered as (
     select id, row_number() over (order by hierarchy_level desc, name asc) as rn
     from roles
   )
   update roles
   set display_order = ordered.rn
   from ordered
   where roles.id = ordered.id;
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   App runs on `http://localhost:3000` (or the next available port).

5. Complete onboarding to create a superadmin account, then visit `/admin`.

## What I Built

### Users Tab
- Table showing each user's name, email, avatar, and assigned role
- Search input to filter users by name or email
- Remove-user action via a delete button per row

### Roles Tab
- Table showing each role's name, department, hierarchy level, and member count
- Inline rename: click a role's name to edit it in place, save with Enter or the Save button, cancel with Escape
- System roles (Superadmin, No Assigned Role) are not editable or deletable

## Bugs Found & Fixed in the Base Repo

While implementing the Roles tab, I found the existing codebase referenced things that didn't exist in the repo as cloned. I fixed these rather than working around them, since the same errors would block anyone else setting up the project:

1. **Missing `display_order` column** — `app/api/roles/route.js` selects and orders by `roles.display_order`, but `schema.sql` doesn't define this column, causing a 500 on `GET /api/roles`. Fixed via the migration above.

2. **Missing `lib/role-management-service.js`** — `app/api/roles/[roleId]/route.js` imports `roleManagementService.updateRole()` for the PATCH (rename) endpoint, but this file didn't exist anywhere in the repo. I implemented it using the existing admin Supabase client pattern, restricting updatable fields to `name`, `description`, `department_id`, `permissions`, `reporting_role_id`, `hierarchy_level`, and `display_order`.

3. **Missing `lib/api-demo-guard.js`** — the same route imports `checkDemoModeForDestructiveAction()` for the DELETE endpoint, also missing from the repo. I implemented it to check `NEXT_PUBLIC_DEMO_MODE` and block destructive actions when true.

## What I'd Improve With More Time

- Add a "Create Role" flow validation and department dropdown check (currently assumes valid `department_id`)
- Add optimistic UI updates for rename/delete instead of full reloads
- Add cursor-based pagination to the Users table (bonus item, not implemented due to time)
- Add unit tests for `role-management-service.js` and the roles API routes
- Investigate why the base schema and API code were out of sync, in case other endpoints have the same class of issue
- Add a loading skeleton instead of a plain "Loading..." text for both tabs
- Debounce the user search input instead of filtering on every keystroke
