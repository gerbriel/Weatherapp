# 🔐 Complete Organizations + Superuser System

## Overview

This creates a **3-tier permission system**:

1. **Superusers** (Platform Admins) - Can manage EVERYTHING across ALL organizations
2. **Organization Owners/Admins** - Can manage their organization and members
3. **Organization Members** - Can use the platform within their organization

---

## 🎯 Key Differences

| Feature | Superuser | Org Owner | Org Admin | Org Member |
|---------|-----------|-----------|-----------|------------|
| View ALL organizations | ✅ | ❌ | ❌ | ❌ |
| Manage ALL organizations | ✅ | ❌ | ❌ | ❌ |
| View ALL users | ✅ | ❌ | ❌ | ❌ |
| Create organizations | ✅ | ✅ | ❌ | ❌ |
| Manage own organization | ✅ | ✅ | ✅ | ❌ |
| Invite team members | ✅ | ✅ | ✅ | ❌ |
| Manage locations/crops | ✅ | ✅ | ✅ | ✅ |
| View reports | ✅ | ✅ | ✅ | ✅ |
| Billing access | ✅ | ✅ | Custom | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |
| Invisible in user lists | ✅ | ❌ | ❌ | ❌ |

---

## 📋 Tables Created

### 1. **superusers** (NEW)
Platform-level administrators who can manage all organizations
- Full name, email
- Granular permissions (manage orgs, users, billing, etc.)
- Superuser levels: `admin`, `support`, `developer`
- Audit trail (created_by, last_login, etc.)

### 2. **organizations** (NEW)
Company/organization records
- Owner, name, slug, description
- Full address details
- Subscription tier (free, basic, pro, enterprise)
- Custom settings & metadata
- Timezone support

### 3. **organization_members** (NEW)
Links users to organizations
- Roles: `owner`, `admin`, `manager`, `member`, `viewer`
- Granular permissions per user:
  - can_manage_members
  - can_manage_locations
  - can_manage_crops
  - can_view_reports
  - can_manage_billing
- Invitation tracking

### 4. **user_locations** (UPDATED)
Now supports organization-level locations
- Added `organization_id` field
- Keeps `user_id` for personal locations
- Locations can be shared across org members

### 5. **user_profiles** (UPDATED)
Now links to organizations
- Added `current_organization_id`
- Keeps `role` field (now includes 'superuser')
- Deprecated `company` text field (will migrate later)

---

## 🚀 Installation Steps

### Step 1: Run the Main Script
```sql
-- In Supabase SQL Editor, run:
CREATE_ORGANIZATIONS.sql
```

This creates:
- ✅ superusers table
- ✅ organizations table
- ✅ organization_members table
- ✅ Updated user_locations with org support
- ✅ All RLS policies with superuser access
- ✅ Triggers and indexes

### Step 2: Make Yourself a Superuser
```sql
-- Edit MAKE_ME_SUPERUSER.sql
-- Replace 'your-email@example.com' with YOUR email (3 places)
-- Then run it in Supabase SQL Editor
```

This will:
- ✅ Insert you into the `superusers` table
- ✅ Update your `user_profiles.role` to 'superuser'
- ✅ Give you full platform access

### Step 3: Verify
```sql
-- Check if you're a superuser
SELECT * FROM public.superusers WHERE email = 'your-email@example.com';

-- Check your profile
SELECT * FROM public.user_profiles WHERE id = (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

You should see:
- ✅ Record in `superusers` table with `is_active = true`
- ✅ `user_profiles.role = 'superuser'`

---

## 🎨 UI Changes Needed

Now that the database is ready, you'll need to update the UI:

### 1. **Superuser Panel** (Already exists, just update it)
- View all organizations
- View all users across all orgs
- Manage billing for all orgs
- System-wide analytics

### 2. **Organization Switcher** (Update existing)
- Show current organization name
- Allow users to switch between orgs they're members of
- Superusers can switch to ANY org

### 3. **Users Tab** (Already has role hiding)
- Already hides superusers with `profile?.role !== 'superuser'`
- Now will show organization members based on `organization_members` table

### 4. **Create Organization Flow**
- Add "Create Organization" button
- Form: name, description, industry, address
- Auto-adds creator as owner

### 5. **Invite Members Flow**
- Send email invitations
- Assign roles and permissions
- Track pending invitations

---

## 🔧 How It Works

### For Regular Users:
1. Sign up → Create personal account
2. Create organization OR get invited to one
3. Switch between personal and org workspaces
4. See only their org's data

### For Superusers (YOU):
1. Already exists in the platform
2. Run `MAKE_ME_SUPERUSER.sql`
3. Refresh app → You're now invisible in user lists
4. Access SuperAdminPanel → See ALL organizations
5. Can impersonate/manage any org

### Data Visibility:
- **Personal locations**: Only you see them (`user_id = auth.uid()`)
- **Org locations**: All members see them (`organization_id IN (your orgs)`)
- **Superuser**: Sees EVERYTHING (RLS policies allow superuser access)

---

## 🎯 Next Steps

1. ✅ **Run CREATE_ORGANIZATIONS.sql** in Supabase
2. ✅ **Run MAKE_ME_SUPERUSER.sql** with your email
3. 🔄 **Test**: Refresh app, check if you're invisible in Users tab
4. 🎨 **Build UI**:
   - Organization creation form
   - Member invitation system
   - Organization switcher
   - Superuser organization browser

---

## 🛡️ Security Features

- ✅ **RLS Policies**: Every table has proper Row Level Security
- ✅ **Superuser Bypass**: Superusers have policies to access all data
- ✅ **Cascade Deletes**: Deleting org removes all members/locations
- ✅ **Audit Trail**: Tracks who created what and when
- ✅ **Permission Checks**: Granular permissions per user
- ✅ **Isolated by Default**: Users only see their org's data

---

## 📊 Example Queries

### Get all organizations a user belongs to:
```sql
SELECT o.* 
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = auth.uid() AND om.is_active = true;
```

### Get all members of an organization:
```sql
SELECT u.email, om.role, om.joined_at
FROM organization_members om
JOIN auth.users u ON om.user_id = u.id
WHERE om.organization_id = 'org-id-here';
```

### Check if user is a superuser:
```sql
SELECT EXISTS(
    SELECT 1 FROM superusers 
    WHERE user_id = auth.uid() AND is_active = true
) as is_superuser;
```

---

## 🎉 Benefits

✅ **Multi-tenancy** - Multiple orgs in one database
✅ **Team collaboration** - Share locations, crops, reports
✅ **Granular permissions** - Control who can do what
✅ **Scalable** - Add unlimited orgs and members
✅ **Secure** - RLS ensures data isolation
✅ **Superuser access** - Platform admin can manage everything
✅ **Backwards compatible** - Existing personal accounts still work

Ready to build the future of agricultural management! 🌾
