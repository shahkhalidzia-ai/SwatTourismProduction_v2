import sqlite3

conn = sqlite3.connect("backend/swat_tourism_prod.db")
cur = conn.cursor()

print("=== User Record ===")
cur.execute("SELECT * FROM users WHERE id='0c4af132d69c40fa9cb9c7007bfa1d01'")
print(cur.fetchall())

print("\n=== Business Profile Record ===")
cur.execute("SELECT * FROM business_profiles WHERE business_name LIKE '%Hujra%'")
bp = cur.fetchall()
print(bp)

print("\n=== Listings for this business/user ===")
cur.execute("SELECT * FROM listings WHERE business_profile_id='4bb709a1d8494c4facfcd13929d02615'")
print("By business_profile_id:", cur.fetchall())

cur.execute("SELECT * FROM listings WHERE title LIKE '%Hujra%'")
print("By title:", cur.fetchall())

print("\n=== Verification Documents for this business ===")
cur.execute("SELECT * FROM verification_documents WHERE business_profile_id='4bb709a1d8494c4facfcd13929d02615'")
print(cur.fetchall())

print("\n=== All unverified business profiles ===")
cur.execute("SELECT id, business_name, category, verification_status FROM business_profiles")
for row in cur.fetchall():
    print(" ", row)

print("\n=== Total Listings in DB ===")
cur.execute("SELECT id, title, business_profile_id, is_active, is_verified, verification_status FROM listings")
for row in cur.fetchall():
    print(" ", row)

conn.close()
