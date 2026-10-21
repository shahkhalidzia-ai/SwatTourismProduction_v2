import sqlite3
conn = sqlite3.connect('backend/swat_tourism_prod.db')
cur = conn.cursor()
cur.execute("SELECT id, email, role, full_name, phone, status, created_at FROM users WHERE email='hassan@swat.pk'")
print("User row:", cur.fetchone())

cur.execute("SELECT * FROM business_profiles WHERE business_name LIKE '%Hujra%'")
print("Business row:", cur.fetchone())
