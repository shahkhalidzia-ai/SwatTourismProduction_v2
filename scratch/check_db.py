import sqlite3
import glob

print("Checking SQLite databases for 'hujra' or 'cafe'...")
for db_path in glob.glob("**/*.db", recursive=True):
    print(f"\n=== Database: {db_path} ===")
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cur.fetchall()]
        print("Tables:", tables)
        for tbl in tables:
            try:
                cur.execute(f"SELECT * FROM [{tbl}]")
                rows = cur.fetchall()
                for r in rows:
                    r_str = str(r).lower()
                    if "hujra" in r_str:
                        print(f"  >>> MATCH IN [{tbl}]: {r}")
                    elif "cafe" in r_str:
                        print(f"  [cafe match in {tbl}]: {r}")
            except Exception as e:
                pass
        conn.close()
    except Exception as e:
        print("DB error:", e)
