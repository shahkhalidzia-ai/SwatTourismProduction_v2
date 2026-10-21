import sqlite3

conn = sqlite3.connect("backend/swat_tourism_prod.db")
cur = conn.cursor()

user_id = '4bb709a1d8494c4facfcd13929d02615'

print("=== Business Profile ===")
cur.execute("SELECT * FROM business_profiles WHERE owner_id=?", (user_id,))
bp_list = cur.fetchall()
print(bp_list)
bp_id = bp_list[0][12] if bp_list else None
print("Business ID (id):", bp_id)

print("\n=== Listings with this business_id ===")
if bp_id:
    cur.execute("SELECT * FROM listings WHERE business_id=?", (bp_id,))
    print(cur.fetchall())
cur.execute("SELECT * FROM listings WHERE business_id=?", (user_id,))
print("With user_id:", cur.fetchall())

print("\n=== Verification Documents ===")
if bp_id:
    cur.execute("SELECT * FROM verification_documents WHERE business_id=?", (bp_id,))
    print(cur.fetchall())

print("\n=== Total Listings in Database ===")
cur.execute("SELECT id, title, business_id, status, is_verified FROM listings")
for r in cur.fetchall():
    print(" ", r)

print("\n=== Total Verification Documents in Database ===")
cur.execute("SELECT id, business_id, doc_type, status, reviewed_by FROM verification_documents")
for r in cur.fetchall():
    print(" ", r)

conn.close()
