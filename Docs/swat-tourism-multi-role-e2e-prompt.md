# Execution Prompt: End-to-End Multi-Role Implementation & Unified Demo Flow

## Overview
Implement the complete end-to-end workflow connecting Tourist, Hotel/Business, Community, Authority, and Super Admin personas in the Swat Tourism Platform, ensuring all role-specific capabilities and cross-role interactions function seamlessly.

---

## 1. Dedicated Standard Accounts & Admin Role
1. **Database Seeding (`backend/scripts/seed_demo_data.py`)**:
   - Seed 5 clean accounts with standard password `password123`:
     - **Tourist**: `tourist@swattourism.pk` (Sara Ahmed, active tourist profile)
     - **Hotel Manager**: `hotel@swattourism.pk` (Swat Serena Hotel Manager, linked to verified hotel profile & room listings)
     - **Community Member**: `community@swattourism.pk` (Gul Zaman, homestay host & artisan)
     - **Authority Officer**: `authority@swattourism.pk` (District Tourism Officer)
     - **Admin Demo Master**: `admin@swattourism.pk` (Super Admin with universal role bypass)
2. **Frontend Role Access Control (`frontend/src/layouts/navItems.ts`, `frontend/src/App.tsx`)**:
   - Extend `UserRole` type to include `'admin'`.
   - Update `canAccessRole` guard so `'admin'` has unrestricted access to all four portals (Tourist, Business, Community, Authority) without "Access Denied" screens.
   - Provide an Admin Role Switcher dropdown/toggle in the header so the Admin can demo any persona in 1 click.

---

## 2. Booking Stay & Completion Lifecycle
1. **Backend Endpoint (`backend/app/modules/bookings/service.py`, `router.py`)**:
   - Add endpoint `POST /api/v1/bookings/{id}/complete` accessible by business or tourist.
   - Transition booking status from `confirmed` to `completed`.
   - Record transition in `BookingStatusHistory`.
2. **Frontend UI Integration (`frontend/src/api/bookings.ts`, `BusinessShell.tsx`)**:
   - Add `completeBooking(bookingId)` in API client.
   - Add a "Mark Stay Completed / Checked Out" action button on confirmed bookings in the Business **Today** / **Bookings** queue.

---

## 3. Reviews & Ratings Engine (Entities 23 & 24)
1. **Backend Models & Migration**:
   - Create `Review` model (`id`, `booking_id`, `tourist_id`, `listing_id`, `rating` (1–5), `title`, `comment`, `status`, `created_at`, `updated_at`).
   - Create `ReviewReply` model (`id`, `review_id`, `author_id`, `reply_text`, `created_at`).
   - Establish ORM relationships to `Listing`, `Booking`, and `User`.
   - Generate and apply Alembic database migration.
2. **Backend API Endpoints (`/api/v1/reviews`)**:
   - `POST /api/v1/reviews`: Tourist submits review for a `completed` booking (enforces 1 review per booking).
   - `GET /api/v1/reviews/listing/{listing_id}`: Fetch public listing reviews and computed average score.
   - `GET /api/v1/reviews/business-reviews`: Hotel manager views all reviews for their listings.
   - `POST /api/v1/reviews/{review_id}/reply`: Business manager submits reply to tourist review.
3. **Frontend Integration**:
   - **Tourist Portal**: After stay completion, render "Write Review" button/modal on completed trip bookings.
   - **Business Portal**: Connect the **Reviews** tab to real reviews with rating breakdown, tourist comments, and an "Add Reply" form.
   - **Explore / Listing View**: Display verified average star rating and review list.

---

## 4. Business Registration & Licensing -> Authority Approval Pipeline
1. When a new business registers and submits documents:
   - It appears immediately in the Authority **Approvals** queue.
   - Authority clicking "Approve" sets `verification_status = 'verified'` and marks documents as approved.
   - Business portal immediately updates from "Pending Verification" to the green "Verified" badge.

---

## 5. Complete End-to-End Walkthrough Verification
Verify the entire chain without breaks:
1. **Tourist**: Creates Trip and submits Booking Request for Swat Serena Hotel.
2. **Hotel Manager**: Logs in (`hotel@swattourism.pk`), sees incoming booking under **Today**, and clicks "Accept".
3. **Tourist**: Sees booking accepted and clicks "Mock Pay" -> status changes to "Confirmed".
4. **Hotel**: Marks booking "Completed / Stay Concluded".
5. **Tourist**: Receives review prompt, rates 5 stars with feedback.
6. **Hotel**: Views review in their Reviews tab and posts a thank-you reply.
7. **Authority**: Reviews newly submitted business licenses and grants verified badges.
8. **Admin**: Logs in (`admin@swattourism.pk`) and demonstrates the entire flow seamlessly across all portals.
