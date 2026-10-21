import sqlite3
import os
import sys

def clear_all_trips():
    # Locate swat_tourism.db
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "swat_tourism.db"),
        os.path.join(os.path.dirname(__file__), "..", "..", "backend", "swat_tourism.db"),
        os.path.join(os.path.dirname(__file__), "..", "..", "swat_tourism.db"),
        "backend/swat_tourism.db",
        "swat_tourism.db",
    ]
    db_path = None
    for p in possible_paths:
        if os.path.exists(p):
            db_path = os.path.abspath(p)
            break

    if not db_path:
        print("[ERROR] Could not locate backend/swat_tourism.db database file.")
        sys.exit(1)

    print(f"Connected to database: {db_path}\n")
    conn = sqlite3.connect(db_path, timeout=10.0)
    c = conn.cursor()
    c.execute("PRAGMA busy_timeout = 5000;")

    # Pre-check counts
    c.execute("SELECT count(*) FROM trips")
    trips_count = c.fetchone()[0]

    c.execute("SELECT count(*) FROM trip_stops")
    stops_count = c.fetchone()[0]

    c.execute("SELECT count(*) FROM bookings")
    bookings_count = c.fetchone()[0]

    c.execute("SELECT count(*) FROM booking_items")
    items_count = c.fetchone()[0]

    c.execute("SELECT count(*) FROM booking_status_history")
    history_count = c.fetchone()[0]

    try:
        c.execute("SELECT count(*) FROM saved_items")
        saved_count = c.fetchone()[0]
    except Exception:
        saved_count = 0

    try:
        c.execute("SELECT count(*) FROM notifications WHERE related_type IN ('trip', 'booking')")
        notif_count = c.fetchone()[0]
    except Exception:
        notif_count = 0

    print("Current Database Status:")
    print(f" - Trips:                   {trips_count}")
    print(f" - Trip Stops:              {stops_count}")
    print(f" - Bookings:                {bookings_count}")
    print(f" - Booking Items:           {items_count}")
    print(f" - Booking Status History:  {history_count}")
    print(f" - Saved Wishlist Items:    {saved_count}")
    print(f" - Trip/Booking Alerts:     {notif_count}")
    print("-" * 50)

    if trips_count == 0 and stops_count == 0 and bookings_count == 0 and saved_count == 0 and notif_count == 0:
        print("\nAll trips and related data are already clear (0 records found).")
        conn.close()
        return

    print("\nClearing all Trips data and associated bookings...")

    # 1. Delete booking history and items
    c.execute("DELETE FROM booking_status_history")
    c.execute("DELETE FROM booking_items")

    # 2. Delete bookings
    c.execute("DELETE FROM bookings")

    # 3. Delete trip stops
    c.execute("DELETE FROM trip_stops")

    # 4. Delete trips
    c.execute("DELETE FROM trips")

    # 5. Delete saved items
    try:
        c.execute("DELETE FROM saved_items")
    except Exception:
        pass

    # 6. Delete notifications tied to trips and bookings
    try:
        c.execute("DELETE FROM notifications WHERE related_type IN ('trip', 'booking')")
    except Exception:
        pass

    # 7. Delete audit logs tied to trips or bookings
    try:
        c.execute("DELETE FROM audit_logs WHERE entity_type IN ('trip', 'trip_stop', 'booking')")
    except Exception:
        pass

    conn.commit()
    print("[SUCCESS] Deletion committed to database.")

    # Post-check verification
    c.execute("SELECT count(*) FROM trips")
    t_after = c.fetchone()[0]

    c.execute("SELECT count(*) FROM trip_stops")
    s_after = c.fetchone()[0]

    c.execute("SELECT count(*) FROM bookings")
    b_after = c.fetchone()[0]

    print("\nVerified Database Status After Cleanup:")
    print(f" - Remaining Trips:      {t_after}")
    print(f" - Remaining Trip Stops: {s_after}")
    print(f" - Remaining Bookings:   {b_after}")
    print("=" * 50)
    print("All Trips data has been completely and cleanly cleared!\n")

    conn.close()

if __name__ == "__main__":
    clear_all_trips()
