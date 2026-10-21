import sqlite3

conn = sqlite3.connect("backend/swat_tourism_prod.db")
cur = conn.cursor()

def dump_schema(tbl):
    cur.execute(f"PRAGMA table_info({tbl})")
    cols = [f"{c[1]} ({c[2]})" for c in cur.fetchall()]
    print(f"\nColumns for {tbl}: {', '.join(cols)}")

dump_schema("users")
dump_schema("business_profiles")
dump_schema("listings")
dump_schema("verification_documents")

print("\n=== Recent Users ===")
cur.execute("SELECT id, email, phone, role, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 10")
for r in cur.fetchall():
    print(" ", r)

print("\n=== All Listings ===")
cur.execute("SELECT id, title, type, is_active, is_verified, verification_status, owner_id FROM listings")
for r in cur.fetchall():
    print(" ", r)

conn.close()
