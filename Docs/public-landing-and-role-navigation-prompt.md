# Specification & Implementation Prompt: Public Landing Page and Role-Specific Sidebar Navigation

## 1. Goal & Requirements Overview

Implement a streamlined public landing and role-based navigation architecture for the Swat Tourism platform:

1. **Unauthenticated Visitor (No User Logged In)**:
   - When the application URL is opened with no active user session (`user === null`):
     - The **Public Page** (Tourist Home Screen / Discovery Portal) must be loaded by default.
     - The **Left Menu / Sidebar** must be **completely hidden / not visible**.
     - The layout must expand to a clean, full-width travel discovery view (similar to Booking.com / Airbnb) featuring the Swat Tourism official header, "List Your Property", "Register", and "Sign In" actions.
     - Guests can freely browse all valleys, hotels, 4x4 jeep transport, dining, guides, and activities without obstruction.

2. **Authenticated User (Any Type of User Logged In)**:
   - When any user logs in (Tourist, Hotel Owner, Transport Provider, Restaurant Owner, Community Member, or Tourism Authority / Admin):
     - The user is initially routed to the **Public Page** (Explore & Valley Discovery) so they immediately see the live destination portal.
     - The **Left Menu / Sidebar** becomes **visible** for that user.
     - The left menu loads that **specific user's role-related navigation items**:
       - **Tourist**: Explore / Home, My Trips & Itinerary, Safety & Live SOS, Traveler Profile & Pass.
       - **Business (Hotel Owner)**: Explore / Home, Today's Bookings & Arrivals, Room Catalog & Units, Calendar & Availability, Guest Reviews.
       - **Business (Transport Owner)**: Explore / Home, Fleet & Rides, Ride Requests & Dispatches, Availability.
       - **Business (Restaurant / Guide / Activity)**: Explore / Home, Menus & Services, Active Bookings.
       - **Community Member**: Explore / Home, Local Stories & Folklore, Artisans & Crafts, Community Voice Alerts.
       - **Admin / Authority**: Explore / Home, KP Tourism Oversight, Operator Directory, Weather & Road Advisories, Approvals & Verification, Cases & SOS.
     - Each logged-in user can seamlessly toggle between the Public Explorer and their dedicated management portal screens directly from their left sidebar.

---

## 2. Technical Implementation Architecture

### A. Layout Component Updates (`frontend/src/layouts/`)

1. **`WebLayout.tsx`**:
   - Accept a new boolean prop: `showSidebar?: boolean` (defaults to `true`).
   - When `showSidebar === false`:
     - Omit/hide the `<aside>` sidebar element entirely.
     - Adjust the main container styling (`width: 100%`, remove sidebar margin/offset) to ensure full-width responsive display.
   - When `showSidebar === true`:
     - Render the role-specific `<aside>` sidebar with brand header, navigation item list, active indicators, and quick links.

2. **`ResponsiveLayout.tsx`**:
   - Accept `showSidebar?: boolean` and forward it to `WebLayout`.
   - On mobile/phone view (`PhoneLayout`), ensure the bottom navigation bar is also conditionally hidden or rendered only when `showSidebar === true` (or when user is logged in).

---

### B. Navigation & Role Items (`frontend/src/layouts/navItems.ts`)

1. Ensure every role has access to a **Home / Public Explorer** tab in their navigation configuration:
   - `id: 'home'`, `label: 'Explore Swat'`, `icon: Compass | Mountain`.
   - This allows hotel owners, transport operators, and administrators to view the public traveler page while logged in, and easily switch back to their portal tools (`today`, `listings`, `overview`, etc.).

---

### C. State Management & Routing in `App.tsx`

1. **Sidebar Visibility Computation**:
   ```tsx
   const showSidebar = Boolean(user);
   ```
   - When `!user`, `showSidebar` evaluates to `false`, hiding the left menu.
   - When `user` is present, `showSidebar` is `true`, displaying their role menu.

2. **Initial Landing Page for All Logged-In Users**:
   - In `handleAuthSuccess(authUser)`:
     ```tsx
     const handleAuthSuccess = (authUser: UserProfile) => {
       const targetRole = (authUser.role === 'authority' ? 'admin' : authUser.role) as UserRole;
       setRole(targetRole);
       // Every user initially lands on the public home page with their sidebar ready
       setActiveTab('home');
     };
     ```
   - In `useEffect` syncing auth state (`[user]`):
     - When a user logs in, ensure their active role matches their profile, while defaulting `activeTab` to `'home'`.

3. **Active Shell Rendering**:
   - When `activeTab === 'home'` for ANY logged-in user:
     - Render the `TouristShell` (Public Home & Discovery Screen) so they can explore listings, valleys, and public offerings.
   - When `activeTab !== 'home'` and the user is on their portal tabs (e.g. `today`, `listings`, `availability` for business; `overview`, `directory` for admin):
     - Render their role's respective shell (`BusinessShell`, `AuthorityShell`, `CommunityShell`).

---

## 3. Step-by-Step Execution Plan

1. **Update `frontend/src/layouts/WebLayout.tsx` and `ResponsiveLayout.tsx`**:
   - Add `showSidebar` prop.
   - Wrap the `<aside>` element with `{showSidebar && <aside ...>...</aside>}`.
   - Set content wrapper width to `100%` when `showSidebar === false`.

2. **Update `frontend/src/layouts/navItems.ts`**:
   - Add `'home'` ("Explore Swat" or "Public Portal") to business, community, and authority role item lists if not already present.

3. **Update `frontend/src/App.tsx`**:
   - Pass `showSidebar={Boolean(user)}` to `ResponsiveLayout`.
   - Update `handleAuthSuccess` and auth synchronization so that upon login, `activeTab` defaults to `'home'`.
   - In `renderActiveShell`, if `activeTab === 'home'`, render `TouristShell` for public viewing regardless of role. When a user clicks their role-specific tabs in the sidebar, render their corresponding portal shell.

4. **Automated Vitest Verification**:
   - Create/update unit tests in `frontend/src/test/public_landing_and_registration.test.tsx` and `frontend/src/test/login_and_role_isolation.test.tsx`:
     1. Unauthenticated state: left menu `<aside>` or navigation items are NOT present in the DOM; public home screen is displayed.
     2. Tourist login: left menu appears with Tourist items; public page is displayed.
     3. Business/Hotel login: left menu appears with Hotel Owner items; public page is initially displayed; clicking "Today" loads the Hotel Today dashboard.
     4. Admin login: left menu appears with Admin items; public page is initially displayed; clicking "Overview" loads the Admin overview.

5. **Build & Regression Verification**:
   - Run `npm run build` to confirm zero TypeScript compilation errors.
   - Run targeted Vitest test suites.
