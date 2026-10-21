# Implementation Prompt: Gap Fixes for Business Profile Edit Form, Community Member Profile Tab & Individual Room Photo Upload

## 1. Objective & Background

This implementation prompt directly resolves the three remaining UI/feature gaps identified in the [Swat Tourism Platform Gap Analysis Report](file:///f:/Antigravity/SwatTourismPlateform1/Docs/swat-tourism-gap-analysis.md):

1. **Gap 1.1: Business Profile In-App Edit Form** ([`BusinessShell.tsx`](file:///f:/Antigravity/SwatTourismPlateform1/frontend/src/modules/business/BusinessShell.tsx))
2. **Gap 1.2: Community Member Profile Tab** ([`navItems.ts`](file:///f:/Antigravity/SwatTourismPlateform1/frontend/src/layouts/navItems.ts) & [`CommunityShell.tsx`](file:///f:/Antigravity/SwatTourismPlateform1/frontend/src/modules/community/CommunityShell.tsx))
3. **Gap 1.3: Individual Room Photo Upload in Listing Builder** ([`ListingBuilderModal.tsx`](file:///f:/Antigravity/SwatTourismPlateform1/frontend/src/modules/business/ListingBuilderModal.tsx))

---

## 2. Technical Specifications & File Changes

### Task 1: Business Profile In-App Edit Form (`frontend/src/modules/business/BusinessShell.tsx`)

#### 1.1 Current Limitation
On the **Profile** tab (`activeTab === 'profile'`), business owners can inspect verification status and upload compliance documents, but cannot edit basic business identity information (`business_name`, `registration_no`, `contact_phone`, `whatsapp_number`, `address_text`, and `area_id`), even though the backend endpoint (`PUT /api/v1/auth/profile`) fully accepts these fields.

#### 1.2 Required Implementation
1. **Add Form State in `BusinessShell.tsx`**:
   ```ts
   const [editBizName, setEditBizName] = useState(user?.business_profile?.business_name || 'Swat Serena Hotel');
   const [editRegNo, setEditRegNo] = useState(user?.business_profile?.registration_no || 'KP-HOTEL-SERENA-001');
   const [editPhone, setEditPhone] = useState(user?.business_profile?.contact_phone || user?.phone || '+92 946 711640');
   const [editWhatsapp, setEditWhatsapp] = useState(user?.business_profile?.whatsapp_number || '+92 300 1234567');
   const [editAddress, setEditAddress] = useState(user?.business_profile?.address_text || 'Saidu Sharif, Swat Valley');
   const [editAreaId, setEditAreaId] = useState<string>('kalam');
   const [isSavingProfile, setIsSavingProfile] = useState(false);
   ```
2. **API Submission Handler**:
   Create `handleSaveBusinessProfile`:
   - Send `PUT /auth/profile` with payload:
     ```json
     {
       "business_name": editBizName,
       "registration_no": editRegNo,
       "contact_phone": editPhone,
       "whatsapp_number": editWhatsapp,
       "address_text": editAddress
     }
     ```
   - On success: call `refreshUser()`, update local state, and display toast feedback (`Business profile updated successfully!`).
3. **UI Layout**:
   Add a responsive, high-contrast **"Edit Business Profile & Contact Information"** Card above the Document Uploads section:
   - Form grid with inputs for Business Title, Registration ID, Contact Phone, WhatsApp Support Number, Valley Location / Area, and Physical Address.
   - Action button: `[Save Changes]` with loading state.

---

### Task 2: Community Member Profile Tab (`navItems.ts` & `CommunityShell.tsx`)

#### 2.1 Current Limitation
Unlike the Tourist, Business, and Authority roles, Community members do not have a dedicated **Profile** tab in the bottom bar navigation to review or update their bio, location, resident type, or log out.

#### 2.2 Required Implementation
1. **Update Navigation Config (`frontend/src/layouts/navItems.ts`)**:
   Add the 5th item to `ROLE_NAV_ITEMS.community`:
   ```ts
   community: [
     { id: 'stories', label: 'Stories', icon: React.createElement(BookOpen, { size: 20 }) },
     { id: 'crafts', label: 'Crafts', icon: React.createElement(ShoppingBag, { size: 20 }) },
     { id: 'report', label: 'Report', icon: React.createElement(FileWarning, { size: 20 }) },
     { id: 'hosts', label: 'Hosts', icon: React.createElement(Users, { size: 20 }) },
     { id: 'profile', label: 'Profile', icon: React.createElement(User, { size: 20 }) },
   ],
   ```
2. **Render Profile Tab in `frontend/src/modules/community/CommunityShell.tsx`**:
   Add `{activeTab === 'profile' && (...)}`:
   - **Community Identity Hero Card**:
     - Avatar / User icon.
     - Full name, Email, Phone number, and Member Role badge (`Local Resident`, `Verified Artisan`, or `Community Host`).
     - Verification status pill (`Active Community Contributor`).
   - **Editable Profile Information Form**:
     - Full Name.
     - Resident / Member Type selector (`resident`, `host`, `artisan`).
     - Valley Area / Village.
     - Personal Bio / Artisan specialty description.
     - `[Save Profile]` button connecting to `PUT /auth/profile`.
   - **Host Program Status**:
     - Displays current host application status (`Approved Host`, `Pending Review`, or `Apply to Host Visitors`).
   - **Account Actions**:
     - Prominent `[Sign Out]` button triggering `logout()`.

---

### Task 3: Individual Room Photo Upload in Listing Builder (`ListingBuilderModal.tsx`)

#### 3.1 Current Limitation
In [`ListingBuilderModal.tsx`](file:///f:/Antigravity/SwatTourismPlateform1/frontend/src/modules/business/ListingBuilderModal.tsx), hotels can define multiple rooms (`sleeps`, `bedType`, `size`, `view`, `amenities`), but there is only one photo upload input for the overall listing. Section 8 of the platform specification requires room photos attached per room entity.

#### 3.2 Required Implementation
1. **Extend `PriceItemForm` Interface**:
   ```ts
   interface PriceItemForm {
     name: string;
     price: string;
     unit: PriceUnitCode;
     capacity?: string;
     category?: string;
     sleeps?: string;
     bedType?: string;
     size?: string;
     view?: string;
     amenities?: string;
     photoFile?: File;
     photoPreviewUrl?: string;
   }
   ```
2. **Room Photo Upload UI per Room Card**:
   - Inside each room item accordion/card in `ListingBuilderModal.tsx`, add a room photo upload control:
     - Hidden file `<input type="file" accept="image/*" />` with an accessible button `[📷 Upload Room Photo]`.
     - Image preview thumbnail (`80x80px` rounded, cover) with a remove `[x]` button.
     - Default high-quality fallback preview image based on room type if no custom image is selected (e.g. Deluxe Room vs Presidential Suite vs Twin Room).
3. **Multi-Media Submission Flow**:
   - In `onSubmit` handler:
     - Pass the room items with their attached `photoFile` objects.
     - In `BusinessShell.tsx` `handleCreateListingSubmit`, after creating the listing, upload room-level photos using `uploadListingMedia(createdListing.id, room.photoFile, room.name)`.

---

## 3. Verification & Acceptance Criteria

1. **Business Profile Edit Verification**:
   - Login as hotel manager (`hotel@swat.pk`) -> Navigate to `http://localhost:5180/?role=business&tab=profile`.
   - Edit hotel name, phone, and address -> Click `[Save Changes]`.
   - Confirmation toast appears and updated details persist.

2. **Community Profile Tab Verification**:
   - Login / switch to Community role -> Navigate to `http://localhost:5180/?role=community`.
   - Bottom navigation bar displays 5 tabs: `Stories`, `Crafts`, `Report`, `Hosts`, and `Profile`.
   - Clicking `Profile` displays the member profile card, editable bio/area fields, and logout button.

3. **Room Photo Upload Verification**:
   - In Business Portal -> Click `[+ Add Listing]` -> Select `Hotel & Stays`.
   - Add multiple room types (e.g. "Executive Deluxe" and "Mountain Suite").
   - Attach a distinct photo to each room card -> Thumbnails render correctly before submission.

4. **Production Build Integrity**:
   - `npm run build` (`tsc -b && vite build`) compiles with zero TypeScript errors (Exit Code 0).
