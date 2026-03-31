# Onsprint Super Admin

Platform-level admin panel for Onsprint multi-tenant SaaS.

## Structure

```
src/
  app/
    superadmin/          # 20 pages (dashboard, shops, orders, users, etc.)
    api/superadmin/      # 33 API routes
  components/superadmin/ # Shell, Sidebar, Topbar, Search
  lib/
    superadmin.ts        # Auth helper (verifySuperAdmin)
    audit.ts             # Audit logging helper
```

## Pages

Dashboard, Analytics, Onboarding, Shops, Orders, Users, Support,
Subscriptions, Billing, Revenue Share, Announcements, Email Templates,
Catalog, Feature Flags, Whitelabel, Audit Log, Health, Maintenance,
Exports, Settings

## Auth

- `platform_admins` table checked via `verifySuperAdmin()`
- First admin seeded via SQL
- Additional admins added through Settings UI
- Separate login at `/superadmin/login`

## Note

These files are part of the main Onsprint app. This repo is for
reference/backup only. The super admin runs within the main Next.js app.
