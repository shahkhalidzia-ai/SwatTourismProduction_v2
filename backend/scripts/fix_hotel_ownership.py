import sqlite3

def run():
    con = sqlite3.connect('backend/swat_tourism.db')
    cur = con.cursor()
    # Find hotel@swattourism.pk user id
    cur.execute("SELECT id FROM users WHERE email = 'hotel@swattourism.pk'")
    row = cur.fetchone()
    if not row:
        print("User hotel@swattourism.pk not found!")
        return
    hotel_user_id = row[0]
    print(f"hotel@swattourism.pk id: {hotel_user_id}")

    # Update Swat Serena Hotel business profile to have owner_id = hotel_user_id
    cur.execute(
        "UPDATE business_profiles SET owner_id = ? WHERE business_name LIKE '%Serena%'",
        (hotel_user_id,)
    )
    print(f"Updated {cur.rowcount} business profile(s) for Swat Serena Hotel to owner {hotel_user_id}")
    con.commit()

    # Verify
    cur.execute("SELECT id, business_name, owner_id FROM business_profiles WHERE owner_id = ?", (hotel_user_id,))
    for bp in cur.fetchall():
        print("Verified BP:", bp)

    # Check bookings for this business
    cur.execute(
        "SELECT b.id, b.reference, b.status, bp.business_name FROM bookings b JOIN business_profiles bp ON b.business_id = bp.id WHERE bp.owner_id = ?",
        (hotel_user_id,)
    )
    for b in cur.fetchall():
        print("Booking for hotel:", b)

    con.close()

if __name__ == '__main__':
    run()
