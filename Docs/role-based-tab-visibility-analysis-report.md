# Architecture & Role-Based Tab Visibility Analysis Report

**Project:** Swat Tourism Platform (Production)  
**Date:** October 9, 2026  
**Document:** Role-Based Tab Visibility & Portal Isolation Analysis  
**Location:** `docs/role-based-tab-visibility-analysis-report.md`

---

## 1. Executive Summary

This report provides a formal architectural analysis of role-based navigation and tab isolation across the Swat Tourism Platform:

- **Demo User / Evaluator**: Full system evaluation mode with access to all 5 roles and portals (`Tourist`, `Business`, `Community`, `Authority`, `Admin`), role switching via the top demo bar, and the interactive demo walkthrough stepper.
- **Tourist Account**: Strict, single-portal access to **only** the Tourist navigation tabs (`Home`, `Explore`, `Trips`, `Safety`, `Profile`). Business and Authority portals and switchers are completely hidden.
- **Hotel Manager / Business Account**: Dedicated Business Portal with **only** the Business tabs (`Today`, `Listings`, `Availability`, `Reviews`, `Profile`). Tourist trip planning and Authority inspection tools are hidden.
- **Community Member Account**: Dedicated Community Portal with **only** Community tabs (`Stories`, `Crafts`, `Report`, `Hosts`, `Profile`).
- **Authority / Admin Account**: Dedicated Governance Dashboard with **only** Authority tabs (`Overview`, `Directory`, `Advisories`, `Approvals`, `Cases`).

---

## 2. Current Architecture & Role Tab Specifications

The platform defines tabs on a per-role basis in `frontend/src/layouts/navItems.ts` via `ROLE_NAV_ITEMS`:

| Role | Available Tabs in Sidebar / Navigation | Role Purpose |
| :--- | :--- | :--- |
| **Tourist** | `Home` • `Explore` • `Trips` • `Safety` • `Profile` | Valley discovery, trip & stop planning, hotel booking, safety advisory & SOS, hotel reviews |
| **Business** *(Hotel / Restaurant)* | `Today` • `Listings` • `Availability` • `Reviews` • `Profile` | Daily arrivals KPI, room & listing manager, inventory calendar, guest reviews and replies |
| **Community** | `Stories` • `Crafts` • `Report` • `Hosts` • `Profile` | Cultural heritage stories, local handicraft marketplace, civic reports, local host onboarding |
| **Authority** | `Overview` • `Directory` • `Advisories` • `Approvals` • `Cases` | Business license verification, road/weather advisory publishing, emergency dispatch |
| **Admin** | `Overview` • `Directory` • `Approvals` • `Cases & SOS` • `Advisories` | Super admin master oversight |

---

## 3. Gap Analysis: Why All Roles / Tabs Are Currently Visible

Currently, a user logging in as a Tourist or Business owner may still observe tabs or switchers from other roles due to the following architectural configurations:

### 1. Global Demo Bar (`RoleSwitcherBar`) is Always Mounted
In `frontend/src/App.tsx`:
```tsx
const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

{isDemoMode && (
  <RoleSwitcherBar
    currentRole={role}
    onRoleChange={handleRoleChange}
    ...
  />
)}
```
Because `VITE_DEMO_MODE` is not explicitly set to `false`, the top black bar (`DEMO LOGINS: Tourist | Business | Community | Authority | Admin`) is rendered globally on all viewports, allowing any logged-in user to see and click other roles.

### 2. Automatic Demo Tourist Token on Boot
In `frontend/src/context/AuthContext.tsx`:
When an unauthenticated guest visits the platform, `AuthContext` auto-authenticates as demo tourist (`tourist@swattourism.pk`, Sara Ahmed) for friction-free prototyping. The context does not currently differentiate between a **Demo Guest Session** and an **Authenticated Account Session**.

### 3. Permissive Role-Access Guard (`canAccessRole`)
In `frontend/src/App.tsx`:
The access checker allows cross-viewing (e.g., Business can inspect Tourist & Community tabs; Tourist can inspect Community). While beneficial during UI prototyping, it does not provide production-grade role isolation.

---

## 4. Target Architecture & Role-by-Role Isolation Blueprint

```
                                  USER ARRIVES
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
        [ DEMO / EVALUATOR ]                        [ LOGGED-IN ACCOUNT ]
  (Guest or clicks Demo Persona)                     (Logged in via Auth)
                │                                             │
   • Full Top Switcher Bar visible              • Top Switcher Bar HIDDEN
   • Demo Tour Stepper visible                  • Demo Tour Stepper HIDDEN
   • Switch between any role (Tourist,          • STRICT ROLE ENFORCEMENT:
     Business, Community, Authority)                  │
                                                      ├── Role = tourist:
                                                      │     ONLY Tourist tabs
                                                      │     (Home, Explore, Trips, Safety, Profile)
                                                      │
                                                      ├── Role = business:
                                                      │     ONLY Business tabs
                                                      │     (Today, Listings, Availability, Reviews, Profile)
                                                      │
                                                      ├── Role = community:
                                                      │     ONLY Community tabs
                                                      │     (Stories, Crafts, Report, Hosts, Profile)
                                                      │
                                                      └── Role = authority / admin:
                                                            ONLY Authority tabs
                                                            (Overview, Directory, Advisories, Approvals, Cases)
```

---

## 5. Technical Implementation Roadmap

When authorized to implement, the following minimal, clean steps will be taken:

1. **Add `isDemoSession` Flag in `AuthContext`**:
   - Track whether the active token was generated via `demoLogin` or through genuine `login()` / `register()`.
   - Store session mode (`swat_auth_mode: 'demo' | 'user'`) in `localStorage`.

2. **Conditionally Mount `RoleSwitcherBar` & `DemoTourGuide` in `App.tsx`**:
   - Render the top switcher bar and floating walkthrough guide **only** when in demo mode or when unauthenticated.
   - For authenticated users, completely unmount the demo bar and demo drawer.

3. **Enforce Strict Shell Routing by `user.role`**:
   - For real users, enforce `currentRole = user.role`.
   - Disallow URL query overrides (`?role=...`) for non-admin accounts.

4. **Sign Out Workflow**:
   - Clicking "Sign Out" clears user credentials and returns the platform to the demo exploration mode or login view.

---

## 6. Role Visibility Matrix

| User Type | Top Demo Switcher Bar | Demo Stepper Drawer | Visible Navigation Tabs |
| :--- | :---: | :---: | :--- |
| **Demo Evaluator** | ✅ Visible (All 5 roles) | ✅ Visible | Switchable across all 5 role suites |
| **Logged-In Tourist** | ❌ Hidden | ❌ Hidden | **Only**: Home, Explore, Trips, Safety, Profile |
| **Logged-In Hotel / Business** | ❌ Hidden | ❌ Hidden | **Only**: Today, Listings, Availability, Reviews, Profile |
| **Logged-In Community Member** | ❌ Hidden | ❌ Hidden | **Only**: Stories, Crafts, Report, Hosts, Profile |
| **Logged-In Authority / Admin** | ❌ Hidden | ❌ Hidden | **Only**: Overview, Directory, Advisories, Approvals, Cases |
