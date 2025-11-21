# Multi-Tenant Organization System

## Overview

This system enables multi-tenant support with automatic organization creation and role-based access control.

## Key Features

### 1. **Automatic Organization Creation**
- First user to create an organization becomes `org_admin` automatically
- Personal organizations created for existing users
- Organization slug for unique URL identification

### 2. **Role-Based Access**
Three role levels:
- **`superuser`** - Full system access, can manage all orgs and users
- **`org_admin`** - Manages their own organization, can invite/manage members
- **`user`** - Basic member access within their organization

### 3. **SuperUser Dashboard**
Accessible only to superusers, provides:
- **Organizations Tab**: View all orgs, manage status, see member counts
- **Users Tab**: View/edit all users, change roles, see org assignments
- **Statistics Tab**: System-wide metrics (total orgs, users, locations)
- **Permissions Tab**: (Coming soon) Advanced permission management

### 4. **Data Isolation**
- RLS policies ensure users only see their organization's data
- Org admins can only manage their own org members
- Superusers bypass all restrictions

## Database Schema

### Tables Created
1. `organizations` - Stores org details (name, slug, industry, etc.)
2. `organization_members` - Junction table for user-org relationships with roles
3. Updated `user_profiles` - Added `primary_organization_id`
4. Updated `locations` - Added `organization_id` for data scoping
5. Updated `location_crops` - Added `organization_id` for data scoping

### Functions
- `create_organization_with_admin()` - Creates org and makes creator admin
- `get_user_org_role()` - Gets user's role in a specific organization
- Auto-triggers to set `organization_id` on new locations/crops

## Usage

### For End Users

#### Creating an Organization
1. If you don't have an organization, a "Create Organization" button appears
2. Fill in organization details (name, industry, etc.)
3. You automatically become the `org_admin`

#### Inviting Members (Org Admins)
1. Go to Admin Panel (accessible to org_admins)
2. Use the UserManagementPanel to invite users
3. Assign roles: `org_admin` or `member`

### For SuperUsers

#### Accessing SuperUser Dashboard
1. Button appears in header if you're a superuser
2. Click to open comprehensive management interface

#### Managing Organizations
- View all organizations in the system
- Activate/deactivate organizations
- See member counts and locations per org
- View detailed member lists

#### Managing Users
- See all users across all organizations
- Change user roles (user → org_admin → superuser)
- View which org each user belongs to
- See user activity and creation dates

## API Examples

### Create Organization
```javascript
const { data: orgId, error } = await supabase.rpc('create_organization_with_admin', {
  org_name: 'Acme Farms',
  org_slug: 'acme-farms',
  org_description: 'Leading agricultural company'
});
```

### Get User's Role in Organization
```javascript
const { data: role } = await supabase.rpc('get_user_org_role', {
  org_id: 'uuid-here',
  user_id: 'uuid-here' // Optional, defaults to current user
});
// Returns: 'superuser' | 'org_admin' | 'member' | 'viewer' | 'none'
```

### Query Organization Data
```javascript
// Get all organizations (superuser only)
const { data } = await supabase
  .from('organizations')
  .select('*, organization_members(count)')
  .order('created_at', { ascending: false });

// Get my organizations
const { data } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', user.primary_organization_id);
```

## Security

### RLS Policies
All tables have Row Level Security enabled:

**Organizations**:
- Users can view their own organizations
- Org admins can update their organization
- Superusers can do everything
- Anyone can create an organization

**Organization Members**:
- Users can view members of their orgs
- Org admins can add/update/remove members (except themselves)
- Superusers have full access

**Locations & Crops**:
- Scoped to organization_id
- Users can only access data from their organizations
- Superusers can access everything
- Legacy data (no org_id) accessible to creator

## Migration

### Existing Users
The migration automatically:
1. Creates a "Personal" organization for each existing user
2. Makes them the org_admin of their personal org
3. Migrates their locations and crops to their org
4. Maintains all existing data

### Production Setup
1. Run the migration: `20251121000001_organizations_system.sql`
2. Existing users get personal orgs automatically
3. Set yourself as superuser (if needed):
   ```sql
   UPDATE user_profiles 
   SET role = 'superuser' 
   WHERE email = 'your-email@example.com';
   ```

## Roadmap

- [ ] Org invitations via email
- [ ] Organization settings and preferences
- [ ] Custom branding per organization
- [ ] Usage analytics per organization
- [ ] Billing and subscription tiers
- [ ] Advanced permission management UI
- [ ] Org-level feature flags
- [ ] API access keys per organization
- [ ] Audit logs for superusers
- [ ] Organization transfer ownership

## Support

For questions or issues with the organization system:
1. Check RLS policies in Supabase dashboard
2. Verify user roles in `user_profiles` table
3. Check `organization_members` for proper relationships
4. Contact support@example.com
