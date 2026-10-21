import sqlite3

conn = sqlite3.connect('swat_tourism.db')
c = conn.cursor()

# Find Sara
c.execute("SELECT id, email, full_name, role FROM users WHERE email LIKE ? OR full_name LIKE ?", ("%sara%", "%Sara%"))
users = c.fetchall()
print("Users matching Sara:", users)

for u in users:
    uid = u[0]
    c.execute("SELECT id, title FROM trips WHERE tourist_id = ?", (uid,))
    trips = c.fetchall()
    print(f"Trips for user {u[1]} ({uid}): {len(trips)}")
    for t in trips:
        print(" - Trip:", t[0], t[1])
        c.execute("SELECT id, stop_type, custom_title FROM trip_stops WHERE trip_id = ?", (t[0],))
        stops = c.fetchall()
        print(f"   Stops: {len(stops)}")

    c.execute("SELECT id, reference, total_amount, status, trip_id FROM bookings WHERE tourist_id = ?", (uid,))
    bks = c.fetchall()
    print(f"Bookings for user {u[1]}: {len(bks)}")
    for b in bks:
        print(" - Booking:", b)

    c.execute("SELECT count(*) FROM saved_items WHERE user_id = ?", (uid,))
    print(f"Saved items: {c.fetchone()[0]}")

c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
sara_id = 'fcbe57a033a8411887c4c25863284e2f'
print("Checking occurrences of Sara ID across all tables:")
for t in tables:
    c.execute(f"PRAGMA table_info({t})")
    cols = [col[1] for col in c.fetchall()]
    for col in cols:
        try:
            c.execute(f"SELECT count(*) FROM {t} WHERE {col} = ?", (sara_id,))
            cnt = c.fetchone()[0]
            if cnt > 0:
                print(f"  {t}.{col}: {cnt} rows")
        except Exception:
            pass

conn.close()
