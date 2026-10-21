import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "swat_tourism.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Find Sara user IDs
c.execute("SELECT id, email, full_name FROM users WHERE email LIKE '%sara%' OR full_name LIKE '%Sara%'")
sara_users = c.fetchall()
print("Found Sara users:", sara_users)

sara_ids = [u[0] for u in sara_users]

if not sara_ids:
    print("No Sara users found.")
    conn.close()
    exit(0)

# Find trips for Sara
placeholders = ",".join("?" for _ in sara_ids)
c.execute(f"SELECT id, title, status FROM trips WHERE tourist_id IN ({placeholders})", sara_ids)
sara_trips = c.fetchall()
trip_ids = [t[0] for t in sara_trips]
print(f"Found {len(sara_trips)} trips for Sara:")
for t in sara_trips:
    print(f" - [{t[0]}] {t[1]} ({t[2]})")

# Find trip stops
stop_count = 0
if trip_ids:
    trip_placeholders = ",".join("?" for _ in trip_ids)
    c.execute(f"SELECT count(*) FROM trip_stops WHERE trip_id IN ({trip_placeholders})", trip_ids)
    stop_count = c.fetchone()[0]
print(f"Associated trip stops to delete: {stop_count}")

# Find bookings for Sara or pointing to Sara's trips
c.execute(f"SELECT id, reference, total_amount, status FROM bookings WHERE tourist_id IN ({placeholders})", sara_ids)
sara_bookings = c.fetchall()
booking_ids = [b[0] for b in sara_bookings]
print(f"Found {len(sara_bookings)} bookings for Sara:")
for b in sara_bookings:
    print(f" - [{b[0]}] {b[1]} ({b[3]}, PKR {b[2]})")

b_item_count = 0
b_hist_count = 0
if booking_ids:
    b_placeholders = ",".join("?" for _ in booking_ids)
    c.execute(f"SELECT count(*) FROM booking_items WHERE booking_id IN ({b_placeholders})", booking_ids)
    b_item_count = c.fetchone()[0]
    c.execute(f"SELECT count(*) FROM booking_status_history WHERE booking_id IN ({b_placeholders})", booking_ids)
    b_hist_count = c.fetchone()[0]
print(f"Associated booking items to delete: {b_item_count}")
print(f"Associated booking status history to delete: {b_hist_count}")

# Find saved items
c.execute(f"SELECT count(*) FROM saved_items WHERE user_id IN ({placeholders})", sara_ids)
saved_count = c.fetchone()[0]
print(f"Found {saved_count} saved items for Sara.")

# Perform deletion
print("\n--- Deleting trips & associated data for Sara ---")
if booking_ids:
    c.execute(f"DELETE FROM booking_items WHERE booking_id IN ({b_placeholders})", booking_ids)
    c.execute(f"DELETE FROM booking_status_history WHERE booking_id IN ({b_placeholders})", booking_ids)
    c.execute(f"DELETE FROM bookings WHERE id IN ({b_placeholders})", booking_ids)
    print("Deleted booking items, status history, and bookings.")

if trip_ids:
    c.execute(f"DELETE FROM trip_stops WHERE trip_id IN ({trip_placeholders})", trip_ids)
    c.execute(f"DELETE FROM trips WHERE id IN ({trip_placeholders})", trip_ids)
    print("Deleted trip stops and trips.")

c.execute(f"DELETE FROM saved_items WHERE user_id IN ({placeholders})", sara_ids)
print("Deleted saved items.")

conn.commit()
print("Commit successful!")

# Verification
print("\n--- Post-cleanup verification ---")
for uid in sara_ids:
    c.execute("SELECT count(*) FROM trips WHERE tourist_id = ?", (uid,))
    t_rem = c.fetchone()[0]
    c.execute("SELECT count(*) FROM bookings WHERE tourist_id = ?", (uid,))
    b_rem = c.fetchone()[0]
    c.execute("SELECT count(*) FROM saved_items WHERE user_id = ?", (uid,))
    s_rem = c.fetchone()[0]
    print(f"User {uid}: Remaining trips={t_rem}, Remaining bookings={b_rem}, Remaining saved_items={s_rem}")

conn.close()
print("Finished!")
