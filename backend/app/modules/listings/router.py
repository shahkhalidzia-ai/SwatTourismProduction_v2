import uuid
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_token_payload, require_roles
from app.modules.accounts.models import BusinessProfile
from app.modules.listings.schemas import (
    ListingCreate,
    ListingUpdate,
    ListingOut,
    ListingTypeOut,
    TagOut,
    PriceItemCreate,
    PriceItemUpdate,
    PriceItemOut,
    AvailabilityOut,
    SetAvailabilityRequest,
    MediaOut,
    HotelRoomOut,
    HotelRoomStatusUpdate,
    AssignRoomToBookingRequest,
    TransportVehicleCreate,
    TransportVehicleUpdate,
    TransportVehicleOut,
)
from app.modules.listings.service import ListingsService

router = APIRouter(prefix="/listings", tags=["listings"])


async def get_current_business_profile(
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> BusinessProfile:
    user_id = uuid.UUID(payload.get("sub"))
    res = await db.execute(select(BusinessProfile).where(BusinessProfile.owner_id == user_id))
    profile = res.scalars().first()
    if not profile and payload.get("role") in ("admin", "authority"):
        # For admin / authority demo, fallback to Swat Serena Hotel profile
        stmt = select(BusinessProfile).where(BusinessProfile.business_name == "Swat Serena Hotel")
        profile = (await db.execute(stmt)).scalars().first()
        if not profile:
            profile = (await db.execute(select(BusinessProfile))).scalars().first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found for this account.",
        )
    return profile


@router.get("/status")
async def listings_status():
    return {"module": "listings", "status": "active"}


@router.get("/types", response_model=List[ListingTypeOut])
async def list_listing_types(db: AsyncSession = Depends(get_db)):
    """Get all 6 listing types."""
    return await ListingsService.get_types(db)


@router.get("/tags", response_model=List[TagOut])
async def list_tags(
    group: Optional[str] = Query(None, description="facility, feature, language, safety, shop_category, activity_type"),
    db: AsyncSession = Depends(get_db),
):
    """Get tags optionally filtered by group."""
    return await ListingsService.get_tags(db, group)


@router.get("/explore", response_model=List[ListingOut])
async def explore_listings(
    type: Optional[str] = Query(None, description="Filter by type: hotel, restaurant, transport, guide, activity, shop"),
    area_id: Optional[uuid.UUID] = Query(None, description="Filter by area"),
    search: Optional[str] = Query(None, description="Search keyword"),
    tag_id: Optional[uuid.UUID] = Query(None, description="Filter by tag"),
    db: AsyncSession = Depends(get_db),
):
    """
    Public explore endpoint for tourists.
    Applies the Rule 2 visibility gate: only published listings from verified businesses.
    """
    return await ListingsService.get_explore_listings(
        db=db,
        type_code=type,
        area_id=area_id,
        search=search,
        tag_id=tag_id,
    )


@router.get("/all", response_model=List[ListingOut])
async def list_all_listings_for_authority(
    type: Optional[str] = Query(None, description="hotel, restaurant, transport, guide, activity, shop"),
    area_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    _: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority dashboard: View all registered businesses and listings across all types."""
    return await ListingsService.get_all_authority_listings(
        db=db,
        type_code=type,
        area_id=area_id,
        status_filter=status,
        search=search,
    )


@router.get("/my-listings", response_model=List[ListingOut])
async def get_my_listings(
    profile: BusinessProfile = Depends(get_current_business_profile),
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all listings owned by the logged-in business (or platform listings for admin)."""
    listings = await ListingsService.get_business_listings(db, profile.id)
    if not listings and payload.get("role") in ("admin", "authority"):
        return await ListingsService.get_all_authority_listings(db)
    return listings


@router.post("/", response_model=ListingOut, status_code=status.HTTP_201_CREATED)
async def create_listing(
    data: ListingCreate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Create a new listing with type-specific details, tags, and price items."""
    return await ListingsService.create_listing(db, profile.id, data)


@router.get("/{listing_id}", response_model=ListingOut)
async def get_listing(listing_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieve full details of a listing."""
    listing = await ListingsService.get_listing_by_id(db, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    return listing


@router.put("/{listing_id}", response_model=ListingOut)
async def update_listing(
    listing_id: uuid.UUID,
    data: ListingUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Update listing details, fields, and tags."""
    return await ListingsService.update_listing(db, listing_id, profile.id, data)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: uuid.UUID,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Delete a listing owned by the business."""
    await ListingsService.delete_listing(db, listing_id, profile.id)
    return None


@router.post("/{listing_id}/publish", response_model=ListingOut)
async def publish_listing(
    listing_id: uuid.UUID,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """
    Publish listing. If business is verified, status becomes 'published'.
    If business is unverified, status becomes 'pending' awaiting authority verification.
    """
    is_verified = (profile.verification_status == "verified")
    return await ListingsService.publish_listing(db, listing_id, profile.id, is_verified)


@router.post("/{listing_id}/media", response_model=MediaOut)
async def upload_listing_media(
    listing_id: uuid.UUID,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    owner_type: Optional[str] = Form("listing"),
    owner_id: Optional[uuid.UUID] = Form(None),
    profile: BusinessProfile = Depends(get_current_business_profile),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Upload photo for a listing or price item (room)."""
    user_id = uuid.UUID(payload.get("sub"))
    content = await file.read()
    return await ListingsService.add_media_file(
        db=db,
        listing_id=listing_id,
        business_id=profile.id,
        filename=file.filename or "photo.jpg",
        content=content,
        caption=caption,
        uploaded_by=user_id,
        owner_type=owner_type or "listing",
        owner_id=owner_id,
    )


@router.post("/{listing_id}/price-items", response_model=PriceItemOut)
async def add_price_item(
    listing_id: uuid.UUID,
    item: PriceItemCreate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Add a new price item to a listing."""
    return await ListingsService.add_price_item(db, listing_id, profile.id, item)


@router.put("/price-items/{item_id}", response_model=PriceItemOut)
async def update_price_item(
    item_id: uuid.UUID,
    data: PriceItemUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Business updates an existing service/room/product/price item."""
    return await ListingsService.update_price_item(db, item_id, profile.id, data)


@router.delete("/price-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_price_item(
    item_id: uuid.UUID,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Business deletes an existing service/price item."""
    await ListingsService.delete_price_item(db, item_id, profile.id)
    return None


@router.get("/{listing_id}/availability", response_model=List[AvailabilityOut])
async def get_availability(
    listing_id: uuid.UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get availability records for price items of a listing."""
    return await ListingsService.get_availability(db, listing_id, start_date, end_date)


@router.post("/{listing_id}/availability", response_model=List[AvailabilityOut])
async def set_availability(
    listing_id: uuid.UUID,
    req: SetAvailabilityRequest,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Set or update daily units availability for price items."""
    return await ListingsService.set_availability(db, listing_id, profile.id, req.items)


# =========================================================================
# PHYSICAL HOTEL ROOMS REST ENDPOINTS (Component 6)
# =========================================================================

@router.get("/{listing_id}/rooms", response_model=List[HotelRoomOut])
async def get_hotel_rooms(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all physical rooms with live occupancy status for a hotel listing."""
    return await ListingsService.get_rooms_for_listing(db, listing_id, auto_seed=True)


@router.post("/{listing_id}/rooms/seed", response_model=List[HotelRoomOut])
async def seed_hotel_rooms(
    listing_id: uuid.UUID,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Force re-seed or initialize default physical rooms for a hotel."""
    return await ListingsService.seed_default_rooms(db, listing_id)


@router.patch("/rooms/{room_id}/status", response_model=HotelRoomOut)
async def update_hotel_room_status(
    room_id: uuid.UUID,
    data: HotelRoomStatusUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    return await ListingsService.update_room_status(
        db,
        room_id,
        data.status,
        data.notes,
        cleaning_status=data.cleaning_status,
        stay_state=data.stay_state,
    )


@router.post("/{listing_id}/assign-rooms", response_model=List[HotelRoomOut])
async def assign_rooms_to_booking_endpoint(
    listing_id: uuid.UUID,
    data: AssignRoomToBookingRequest,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Assign physical room(s) to a booking, setting status to 'reserved' and updating booking record."""
    return await ListingsService.assign_rooms_to_booking(
        db,
        listing_id,
        data.room_ids,
        data.booking_id,
        data.guest_name,
        data.stay_dates,
    )


@router.post("/rooms/{room_id}/release", response_model=HotelRoomOut)
async def release_hotel_room_endpoint(
    room_id: uuid.UUID,
    to_status: str = Query("cleaning", pattern="^(available|cleaning|maintenance)$"),
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Release a physical room from its active booking back to cleaning or available."""
    return await ListingsService.release_room_from_booking(db, room_id, to_status)


# --- Transport Fleet Vehicles Endpoints ---
@router.get("/transport/fleet", response_model=List[TransportVehicleOut])
async def list_fleet_vehicles_endpoint(
    listing_id: Optional[uuid.UUID] = None,
    business_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve transport fleet vehicles for a business or listing."""
    return await ListingsService.get_fleet_vehicles(
        db,
        business_id=business_id,
        listing_id=listing_id,
        auto_seed=True if business_id else False,
    )


@router.post("/transport/fleet", response_model=TransportVehicleOut)
async def create_fleet_vehicle_endpoint(
    data: TransportVehicleCreate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Register a new vehicle in the operator's transport fleet."""
    target_biz_id = data.business_id or profile.id
    return await ListingsService.create_fleet_vehicle(db, target_biz_id, data)


@router.patch("/transport/fleet/{vehicle_id}", response_model=TransportVehicleOut)
async def update_fleet_vehicle_endpoint(
    vehicle_id: uuid.UUID,
    data: TransportVehicleUpdate,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Update vehicle specifications, driver assignment, or service status."""
    return await ListingsService.update_fleet_vehicle(db, vehicle_id, profile.id, data)


@router.delete("/transport/fleet/{vehicle_id}")
async def delete_fleet_vehicle_endpoint(
    vehicle_id: uuid.UUID,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Remove a vehicle from the operator's transport fleet."""
    return await ListingsService.delete_fleet_vehicle(db, vehicle_id, profile.id)


@router.post("/transport/fleet/seed", response_model=List[TransportVehicleOut])
async def seed_fleet_vehicles_endpoint(
    listing_id: Optional[uuid.UUID] = None,
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Initialize or reset default fleet vehicles for the business profile."""
    return await ListingsService.seed_default_fleet(db, profile.id, listing_id)


