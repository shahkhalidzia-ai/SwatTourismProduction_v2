"""
Script to clear all transport-related bookings and booking requests data from Swat Tourism platform database.
"""
import os
import sys
import sqlite3

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_FILE = os.path.join(BACKEND_DIR, "swat_tourism_prod.db")

def clear_transport_bookings():
    if not os.path.exists(DB_FILE):
        print(f"Database not found at {DB_FILE}")
        return

    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    # Find transport-related booking IDs:
    # 1. Associated with a business profile having primary_type = 'transport'
    # 2. Associated with a listing of type 'transport'
    # 3. Titles or items containing vehicle/transport terms
    # 4. Special requests containing transport pickup or vehicles
    cur.execute("""
        SELECT b.id, b.reference, bp.business_name, l.title
        FROM bookings b
        LEFT JOIN business_profiles bp ON b.business_id = bp.id
        LEFT JOIN listings l ON b.listing_id = l.id
        LEFT JOIN listing_types lt ON l.type_id = lt.id
        WHERE bp.primary_type = 'transport'
           OR lt.code = 'transport'
           OR l.title LIKE '%4x4%'
           OR l.title LIKE '%Jeep%'
           OR l.title LIKE '%Passo%'
           OR l.title LIKE '%Transport%'
           OR l.title LIKE '%Car%'
           OR l.title LIKE '%Prado%'
           OR l.title LIKE '%Hiace%'
           OR l.title LIKE '%Coaster%'
           OR b.special_requests LIKE '%Pickup%'
           OR b.special_requests LIKE '%Passo%'
           OR b.driver_vehicle IS NOT NULL
    """)
    transport_bookings = cur.fetchall()

    if not transport_bookings:
        print("[INFO] No transport bookings found in database.")
        conn.close()
        return

    transport_ids = [b[0] for b in transport_bookings]
    placeholders = ",".join("?" for _ in transport_ids)

    print(f"[INFO] Found {len(transport_bookings)} transport bookings to clear:")
    for b in transport_bookings:
        print(f"  - {b[1]} ({b[2]} | {b[3]} - ID: {b[0]})")

    # 1. Delete booking_items
    cur.execute(f"DELETE FROM booking_items WHERE booking_id IN ({placeholders})", transport_ids)
    items_deleted = cur.rowcount
    print(f"[OK] Deleted {items_deleted} rows from booking_items.")

    # 2. Delete booking_status_history
    cur.execute(f"DELETE FROM booking_status_history WHERE booking_id IN ({placeholders})", transport_ids)
    history_deleted = cur.rowcount
    print(f"[OK] Deleted {history_deleted} rows from booking_status_history.")

    # 3. Unlink from trip_stops
    cur.execute(f"UPDATE trip_stops SET booking_id = NULL WHERE booking_id IN ({placeholders})", transport_ids)
    stops_unlinked = cur.rowcount
    print(f"[OK] Unlinked {stops_unlinked} trip stops.")

    # 4. Remove notifications referencing these bookings
    cur.execute(f"DELETE FROM notifications WHERE related_id IN ({placeholders})", transport_ids)
    notifs_deleted = cur.rowcount
    print(f"[OK] Deleted {notifs_deleted} notifications.")

    # 5. Delete bookings
    cur.execute(f"DELETE FROM bookings WHERE id IN ({placeholders})", transport_ids)
    bookings_deleted = cur.rowcount
    print(f"[OK] Deleted {bookings_deleted} transport bookings from bookings table.")

    # 6. Checkpoint SQLite WAL
    cur.execute("PRAGMA wal_checkpoint(TRUNCATE);")

    conn.commit()
    conn.close()
    print("[SUCCESS] All transport bookings and requests data successfully cleared from SQLite database!")

if __name__ == "__main__":
    clear_transport_bookings()
