import os
import glob
from PIL import Image

frames_dir = os.path.join(os.path.dirname(__file__), "..", "docs", "tourist_tour_frames")
output_gif = os.path.join(os.path.dirname(__file__), "..", "docs", "swat-tourism-tourist-complete-walkthrough.gif")

frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame_*.png")))
print(f"Found {len(frame_files)} frames to assemble into GIF...")

images = []
target_size = (1024, 640)  # High resolution yet optimized for sharing

for idx, f in enumerate(frame_files):
    im = Image.open(f).convert("RGB")
    im_resized = im.resize(target_size, Image.Resampling.LANCZOS)
    images.append(im_resized)
    print(f"Processed frame {idx+1}/{len(frame_files)}")

if images:
    # 2000ms (2 seconds) per frame so the user's boss can clearly read every section
    images[0].save(
        output_gif,
        save_all=True,
        append_images=images[1:],
        duration=2200,
        loop=0,
        optimize=True
    )
    print(f"Successfully generated animated GIF: {output_gif} ({os.path.getsize(output_gif)} bytes)")
else:
    print("No frames found!")
