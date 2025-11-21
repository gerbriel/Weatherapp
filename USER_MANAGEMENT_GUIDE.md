# User & Organization Management System

## Overview
Complete user and organization management system with role-based access control (RBAC), permission management, and organization settings.

## Features Implemented

### 1. Organization Management (Edit Organization)
**Removed Fields:**
- ❌ Irrigation Methods
- ❌ System Efficiency Target
- ❌ Water Conservation Target
- ❌ Cost per Acre-Foot
- ❌ Labor Rate per Hour
- ❌ Default Crops

**Current Fields:**
- ✅ Organization Name (editable)
- ✅ Description (optional text area)
- ✅ Organization ID (read-only)

### 2. User Management (Manage Users)

#### View Users
- Display all organization members
- Show user avatars, names, emails
- Display role badges (Admin, Editor, Viewer)
- Show account status (Active, Pending, Suspended)
- Show access level indicators (Full Access, Limited Access, Read Only)

#### Add New User
**Fields:**
- Email Address (required)
- Display Name (required)
- Role Selection (Viewer/Editor/Admin)
- Organization Assignment
- Automatic invitation email notification

#### Edit User Permissions
**Editable Fields:**
- Display Name
- Role & Permissions (Viewer/Editor/Admin)
- Account Status (Active/Suspended/Pending)

**Access Restrictions (Checkboxes):**
- Can view weather data
- Can view reports
- Can manage locations
- Can export data

#### Remove User
- Confirmation dialog with warning
- Immediate access revocation
- Cannot be undone warning

### 3. Role-Based Access Control

#### Admin Role (Purple Badge)
- Full access to all features
- Can manage users and organization
- Can edit, create, and delete all content
- Can view all reports and data

#### Editor Role (Orange Badge)
- Can create, edit, and delete content
- Can view all reports and data
- Cannot manage users or organization settings
- Limited administrative functions

#### Viewer Role (Gray Badge)
- Read-only access to data and reports
- Cannot edit or delete content
- Cannot manage users
- Cannot access organization settings

### 4. Permission Management

**Access Levels:**
- 🔒 **Full Access** - All features available
- 🔓 **Limited Access** - Selected features only
- 📖 **Read Only** - View-only access

**Granular Permissions:**
- View weather data
- View reports
- Manage locations
- Export data
- Manage users (Admin only)
- Edit organization (Admin only)

### 5. User Interface Components

#### Organization Management Modal
- Clean organization info editing
- Simple name and description fields
- Read-only ID for reference

#### Manage Users Modal
- Comprehensive user list
- Visual role indicators
- Status badges
- Quick edit/delete actions
- Permission level descriptions

#### Add User Modal
- Step-by-step user invitation
- Role selection
- Organization assignment
- Email invitation notice

#### Edit User Modal
- Full permission control
- Role assignment
- Status management
- Granular access restrictions
- Real-time updates

#### Delete Confirmation Modal
- Warning dialog
- User information display
- Cannot be undone notice
- Confirmation required

## Security Features

✅ Role-based access control (RBAC)
✅ Granular permission management
✅ Email-based user invitations
✅ Account suspension capability
✅ Access restriction toggles
✅ Read-only fields for system data
✅ Confirmation dialogs for destructive actions

## User Workflow Examples

### Adding a New User
1. Click "Manage Users" in Organization Management
2. Click "Add New User"
3. Enter email and display name
4. Select role (Viewer/Editor/Admin)
5. Assign to organization
6. Click "Send Invitation"
7. User receives email with setup instructions

### Editing User Permissions
1. Click "Manage Users"
2. Click edit icon on user card
3. Modify role and permissions
4. Toggle access restrictions
5. Update account status if needed
6. Click "Save Changes"

### Removing a User
1. Click "Manage Users"
2. Click trash icon on user card
3. Review warning message
4. Confirm removal
5. User immediately loses access

### Editing Organization
1. Click "Edit Organization"
2. Update organization name
3. Add/edit description
4. Click "Save Changes"

## TODO: Implementation Notes

The following functions need to be implemented to make the system fully functional:

### User Management
- [ ] `addUser()` - Create new user and send invitation email
- [ ] `updateUser()` - Save user permission changes to database
- [ ] `removeUser()` - Delete user from organization
- [ ] `sendInvitation()` - Send email invitation to new users

### Organization Management
- [ ] `updateOrganization()` - Save organization settings to database
- [ ] `loadOrganizationMembers()` - Fetch all users in organization
- [ ] `validatePermissions()` - Check user permissions before actions

### Data Persistence
- [ ] Store user data in Supabase `profiles` table
- [ ] Store organization data in `organizations` table
- [ ] Store permissions in `user_permissions` table
- [ ] Create audit log for user management actions

### Email Integration
- [ ] Use Resend API for invitation emails
- [ ] Create invitation email templates
- [ ] Handle invitation acceptance workflow
- [ ] Send notification emails on permission changes

## Database Schema Recommendations

```sql
-- User Permissions Table
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50), -- 'admin', 'editor', 'viewer'
  can_view_weather BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  can_manage_locations BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  status VARCHAR(50), -- 'active', 'suspended', 'pending'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Audit Log
CREATE TABLE user_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100), -- 'user_added', 'permission_changed', 'user_removed'
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Best Practices

1. **Always validate permissions** before allowing user management actions
2. **Log all user management actions** for audit trail
3. **Send email notifications** when permissions change
4. **Require confirmation** for destructive actions
5. **Provide clear role descriptions** to avoid confusion
6. **Use granular permissions** for fine-tuned access control
7. **Implement proper error handling** for all operations
8. **Display meaningful error messages** to users

## Integration Points

- **AuthContext** - User authentication and session management
- **Supabase** - Database and authentication backend
- **Resend** - Email delivery for invitations
- **localStorage** - Temporary storage for development
- **SuperAdminPanel** - System-wide user management (super admin only)
