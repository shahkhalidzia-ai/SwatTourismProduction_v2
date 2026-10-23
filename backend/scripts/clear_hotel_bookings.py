"""
Script to clear all bookings and booking requests data for all hotels in Swat Tourism platform.
"""
import os
import sys
import sqlite3

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_FILE = os.path.join(BACKEND_DIR, "swat_tourism_prod.db")

def clear_hotel_bookings():
    if not os.path.exists(DB_FILE):
        print(f"Database not found at {DB_FILE}")
        return

    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    # Find hotel booking IDs
    cur.execute("""
        SELECT b.id, b.reference, bp.business_name 
        FROM bookings b 
        JOIN business_profiles bp ON b.business_id = bp.id 
        WHERE bp.primary_type = 'hotel'
    """)
    hotel_bookings = cur.fetchall()
    
    if not hotel_bookings:
        print("[INFO] No hotel bookings found in database.")
        conn.close()
        return

    hotel_ids = [b[0] for b in hotel_bookings]
    placeholders = ",".join("?" for _ in hotel_ids)

    print(f"[INFO] Found {len(hotel_bookings)} hotel bookings to clear:")
    for b in hotel_bookings:
        print(f"  - {b[1]} ({b[2]} - ID: {b[0]})")

    # 1. Delete booking_items
    cur.execute(f"DELETE FROM booking_items WHERE booking_id IN ({placeholders})", hotel_ids)
    items_deleted = cur.rowcount
    print(f"[OK] Deleted {items_deleted} rows from booking_items.")

    # 2. Delete booking_status_history
    cur.execute(f"DELETE FROM booking_status_history WHERE booking_id IN ({placeholders})", hotel_ids)
    history_deleted = cur.rowcount
    print(f"[OK] Deleted {history_deleted} rows from booking_status_history.")

    # 3. Unlink from trip_stops (preserve itinerary stop, clear booking reference)
    cur.execute(f"UPDATE trip_stops SET booking_id = NULL WHERE booking_id IN ({placeholders})", hotel_ids)
    stops_unlinked = cur.rowcount
    print(f"[OK] Unlinked {stops_unlinked} trip stops.")

    # 4. Remove notifications referencing these bookings
    cur.execute(f"DELETE FROM notifications WHERE related_id IN ({placeholders})", hotel_ids)
    notifs_deleted = cur.rowcount
    print(f"[OK] Deleted {notifs_deleted} notifications.")

    # 5. Delete bookings
    cur.execute(f"DELETE FROM bookings WHERE id IN ({placeholders})", hotel_ids)
    bookings_deleted = cur.rowcount
    print(f"[OK] Deleted {bookings_deleted} hotel bookings from bookings table.")

    conn.commit()
    conn.close()
    print("[SUCCESS] All hotel bookings and booking requests data successfully cleared from SQLite database!")

if __name__ == "__main__":
    clear_hotel_bookings()
