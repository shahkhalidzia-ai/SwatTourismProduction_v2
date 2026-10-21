"""
Records a captioned demo video of the Swat Tourism app, one clip per portal,
then joins the clips into one MP4 if ffmpeg is installed.

Easiest way: double-click record_demo.bat (Windows). It installs what is needed,
reads the settings at the top of the .bat file and runs this script.

Manual setup (once):
    pip install playwright
    playwright install chromium

Before you run it:
    1. Load good demo data (listings, a trip, bookings) so the screens look full.
    2. Create one login per portal and put the emails and passwords in USERS below.
    3. Make sure the app is running at BASE_URL.

Run:
    python record_demo.py

Output: ./demo_videos/1_tourist.webm ... and swat_demo.mp4
Tip: set HEADED = True to watch it while it records, and fix the tab names in
PORTALS if your menu labels are different.
"""
import glob
import os
import re
import shutil
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("DEMO_BASE_URL", "http://localhost:5180/")
OUT = Path("demo_videos")
SIZE = (
    {"width": 390, "height": 844}
    if os.environ.get("DEMO_PHONE") == "1"
    else {"width": 1440, "height": 810}
)
PAUSE_MS = 3200                          # time spent on each tab
HEADED = os.environ.get("DEMO_HEADED", "0") == "1"

def _user(role, default_email):
    key = role.upper()
    return (
        os.environ.get(f"DEMO_{key}_EMAIL", default_email),
        os.environ.get(f"DEMO_{key}_PASSWORD", "CHANGE_ME"),
    )


USERS = {
    "tourist": _user("tourist", "tourist@test.local"),
    "business": _user("business", "hotel.mingora@test.local"),
    "community": _user("community", "community@test.local"),
    "authority": _user("authority", "admin@test.local"),
}

# (role, title, subtitle, [(tab label, caption), ...])
PORTALS = [
    ("tourist", "Tourist portal", "Discover, plan, book and travel safely", [
        ("Home", "Discover destinations, weather and live alerts"),
        ("Explore", "Find hotels, restaurants, transport, guides, activities and shops"),
        ("Trips", "Plan a trip day by day and track every booking"),
        ("Safety", "Advisories, road status, emergency contacts and SOS"),
        ("Profile", "Language, emergency contact and travel preferences"),
    ]),
    ("business", "Business portal", "Hotels, restaurants, transport, guides, activities and shops", [
        ("Today", "See today's bookings and new requests"),
        ("Bookings", "Accept, decline or complete every booking request"),
        ("Listings", "Describe rooms, facilities, menus, services and prices"),
        ("Availability", "Set what is available each day"),
        ("Reviews", "Read and answer guest reviews"),
    ]),
    ("community", "Community portal", "Local voices, crafts and hosts", [
        ("Stories", "Local stories, events and hidden spots"),
        ("Crafts", "Homestays and local handicrafts"),
        ("Report", "Report problems straight to the authority"),
        ("Hosts", "Apply to become a local host or guide"),
    ]),
    ("authority", "Authority portal", "Keep visitors safe and informed", [
        ("Overview", "Visitors, alerts and open cases at a glance"),
        ("Advisories", "Publish weather, road and safety notices"),
        ("Approvals", "Verify businesses and approve destinations"),
        ("Cases", "Resolve reports and respond to SOS events"),
    ]),
]

OVERLAY_JS = """
(() => {
  if (window.__demoReady) return; window.__demoReady = true;
  const add = () => {
    const css = document.createElement('style');
    css.textContent = `
      #dm-cur{position:fixed;left:0;top:0;width:24px;height:24px;border-radius:50%;
        background:rgba(47,127,193,.35);border:2px solid #2F7FC1;z-index:2147483647;
        pointer-events:none;transition:transform .05s linear}
      #dm-cap{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);max-width:80%;
        background:rgba(18,50,74,.92);color:#fff;font:600 20px system-ui,sans-serif;
        padding:14px 26px;border-radius:14px;z-index:2147483646;opacity:0;
        transition:opacity .4s;text-align:center;pointer-events:none}
      #dm-card{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;background:linear-gradient(135deg,#12324A,#2F7FC1);color:#fff;
        font-family:system-ui,sans-serif;z-index:2147483647;opacity:0;transition:opacity .6s;
        pointer-events:none;text-align:center;padding:40px}
      #dm-card h1{font-size:54px;margin:0 0 12px}#dm-card p{font-size:24px;margin:0;opacity:.9}`;
    document.head.appendChild(css);
    for (const id of ['dm-cur','dm-cap','dm-card']) {
      const d = document.createElement('div'); d.id = id; document.body.appendChild(d);
    }
    addEventListener('mousemove', e => {
      document.getElementById('dm-cur').style.transform =
        `translate(${e.clientX - 12}px,${e.clientY - 12}px)`;
    }, true);
  };
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
})();
"""


def caption(page, text):
    page.evaluate(
        "t=>{const c=document.getElementById('dm-cap');if(c){c.textContent=t;c.style.opacity=t?1:0}}",
        text,
    )


def title_card(page, title, subtitle, ms=3000):
    page.evaluate(
        "([t,s])=>{const c=document.getElementById('dm-card');"
        "c.innerHTML='<h1>'+t+'</h1><p>'+s+'</p>';c.style.opacity=1}",
        [title, subtitle],
    )
    page.wait_for_timeout(ms)
    page.evaluate("()=>{document.getElementById('dm-card').style.opacity=0}")
    page.wait_for_timeout(700)


def find(page, label):
    rx = re.compile(rf"^\s*{re.escape(label)}\s*$", re.I)
    for role in ("tab", "button", "link"):
        loc = page.get_by_role(role, name=rx)
        if loc.count() and loc.first.is_visible():
            return loc.first
    loc = page.get_by_text(rx)
    if loc.count() and loc.first.is_visible():
        return loc.first
    return None


def smooth_click(page, loc):
    box = loc.bounding_box()
    if box:
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=35)
        page.wait_for_timeout(350)
    loc.click()


def login(page, email, password):
    opener = page.get_by_role("button", name=re.compile(r"log ?in|sign ?in", re.I))
    if opener.count() and opener.first.is_visible():
        opener.first.click()
        page.wait_for_timeout(500)
    page.get_by_label(re.compile("email", re.I)).first.fill(email)
    page.get_by_label(re.compile("password", re.I)).first.fill(password)
    page.get_by_role("button", name=re.compile(r"^(log ?in|sign ?in)$", re.I)).last.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1200)


def record_portal(pw, index, role, title, subtitle, tabs):
    browser = pw.chromium.launch(headless=not HEADED)
    context = browser.new_context(
        viewport=SIZE, record_video_dir=str(OUT / "_tmp"), record_video_size=SIZE
    )
    context.add_init_script(OVERLAY_JS)
    page = context.new_page()
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    try:
        login(page, *USERS[role])
    except Exception as e:
        print(f"[{role}] login step failed: {e}")
    if index == 0:
        title_card(page, "Swat Tourism Platform", "One platform for tourists, businesses, communities and authorities", 3500)
    title_card(page, title, subtitle)
    for label, text in tabs:
        loc = find(page, label)
        if loc is None:
            print(f"[{role}] tab not found, skipped: {label}")
            continue
        caption(page, text)
        smooth_click(page, loc)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(PAUSE_MS // 2)
        page.mouse.wheel(0, 450)
        page.wait_for_timeout(PAUSE_MS // 2)
        page.mouse.wheel(0, -450)
        page.wait_for_timeout(600)
    caption(page, "")
    page.wait_for_timeout(800)
    video = page.video
    context.close()
    browser.close()
    target = OUT / f"{index + 1}_{role}.webm"
    shutil.move(video.path(), target)
    print("saved", target)
    return target


def find_ffmpeg():
    """Returns (path, is_full_build). The Playwright copy can only join WebM clips."""
    found = shutil.which("ffmpeg")
    if found:
        return found, True
    local = os.environ.get("LOCALAPPDATA", "")
    for pat in (
        os.path.join(local, "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
        os.path.join(local, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg*", "ffmpeg-*", "bin", "ffmpeg.exe"),
    ):
        hits = glob.glob(pat)
        if hits:
            return hits[0], True
    for pat in (
        os.path.join(local, "ms-playwright", "ffmpeg-*", "ffmpeg-win64.exe"),
        os.path.expanduser("~/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux"),
        os.path.expanduser("~/Library/Caches/ms-playwright/ffmpeg-*/ffmpeg-mac"),
    ):
        hits = glob.glob(pat)
        if hits:
            return hits[0], False
    return None, False


def join_clips(clips):
    exe, full = find_ffmpeg()
    if not exe:
        print("No ffmpeg found. The separate clips are in", OUT.resolve())
        return
    lst = OUT / "list.txt"
    lst.write_text("".join(f"file '{c.name}'\n" for c in clips))
    if full:
        target = OUT / "swat_demo.mp4"
        cmd = [exe, "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", str(target)]
    else:
        target = OUT / "swat_demo.webm"
        cmd = [exe, "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(target)]
    result = subprocess.run(cmd, check=False)
    if result.returncode == 0 and target.exists():
        print("created", target.resolve())
    else:
        print("Joining failed. The separate clips are in", OUT.resolve())


def main():
    OUT.mkdir(exist_ok=True)
    clips = []
    with sync_playwright() as pw:
        for i, (role, title, subtitle, tabs) in enumerate(PORTALS):
            clips.append(record_portal(pw, i, role, title, subtitle, tabs))
    shutil.rmtree(OUT / "_tmp", ignore_errors=True)
    join_clips(clips)


if __name__ == "__main__":
    main()
