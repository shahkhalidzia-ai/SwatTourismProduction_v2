import os
import sys
import glob
import subprocess
import time
from pathlib import Path

FFMPEG_EXE = r"C:\Users\shahkhalid1\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
FFPROBE_EXE = r"C:\Users\shahkhalid1\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffprobe.exe"

WORK_DIR = Path(r"F:\Antigravity\SwatTourismProduction\videoscript\video_compilation")
SOURCE_DIR = Path(r"F:\Antigravity\SwatTourismProduction\videoscript\demo-videos-1")
FINAL_OUTPUT = Path(r"F:\Antigravity\SwatTourismProduction\videoscript\Swat_Tourism_Platform_Full_Walkthrough.mp4")

WIDTH = 1910
HEIGHT = 926
FPS = 30

SLIDE_SPECS = [
    ("slide_0_intro", 6.0),
    ("slide_1_tourist", 5.0),
    ("slide_2_business", 5.0),
    ("slide_3_community", 5.0),
    ("slide_4_authority", 5.0),
    ("slide_5_outro", 5.0),
]

VIDEO_SOURCES = [
    ("1-Tourist.mp4", "norm_1_tourist.mp4"),
    ("2-Business-hotel.mp4", "norm_2_business.mp4"),
    ("3-community.mp4", "norm_3_community.mp4"),
    ("4-admin_Authority.mp4", "norm_4_admin_authority.mp4"),
]

def make_slide_clip(slide_id, duration):
    png_path = WORK_DIR / f"{slide_id}.png"
    out_mp4 = WORK_DIR / f"clip_{slide_id}.mp4"
    if out_mp4.exists() and out_mp4.stat().st_size > 10000:
        print(f"[Slide] Using existing clip: {out_mp4.name}")
        return out_mp4

    print(f"[Slide] Generating video clip for {slide_id} ({duration}s)...")
    fade_out_start = max(0.5, duration - 0.5)
    vf = f"scale={WIDTH}:{HEIGHT},fps={FPS},fade=t=in:st=0:d=0.5,fade=t=out:st={fade_out_start:.2f}:d=0.5"

    cmd = [
        FFMPEG_EXE, "-y",
        "-loop", "1",
        "-framerate", str(FPS),
        "-t", str(duration),
        "-i", str(png_path),
        "-f", "lavfi",
        "-t", str(duration),
        "-i", "anullsrc=channel_layout=mono:sample_rate=44100",
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-r", str(FPS),
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-ac", "1",
        str(out_mp4)
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Error creating slide clip {slide_id}:\n{res.stderr}")
        sys.exit(1)
    print(f"[Slide] Successfully created: {out_mp4.name}")
    return out_mp4

def normalize_source_video(source_name, out_name):
    src_path = SOURCE_DIR / source_name
    out_path = WORK_DIR / out_name
    if out_path.exists() and out_path.stat().st_size > 1000000:
        print(f"[Video] Using existing normalized video: {out_name}")
        return out_path

    print(f"[Video] Normalizing {source_name} -> {out_name} (30fps, 44.1kHz mono, CRF 20)...")
    t0 = time.time()
    cmd = [
        FFMPEG_EXE, "-y",
        "-i", str(src_path),
        "-vf", f"scale={WIDTH}:{HEIGHT},fps={FPS},format=yuv420p",
        "-c:v", "libx264",
        "-preset", "faster",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-r", str(FPS),
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "44100",
        "-ac", "1",
        str(out_path)
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Error normalizing video {source_name}:\n{res.stderr}")
        sys.exit(1)
    dur = time.time() - t0
    print(f"[Video] Normalized {source_name} in {dur:.1f}s: {out_path.stat().st_size / (1024*1024):.1f} MB")
    return out_path

def main():
    print("=== Starting Swat Tourism Video Compilation Pipeline ===")
    
    # 1. Build all slide clips
    slide_clips = {}
    for slide_id, duration in SLIDE_SPECS:
        slide_clips[slide_id] = make_slide_clip(slide_id, duration)

    # 2. Normalize all 4 screen recordings
    video_clips = {}
    for src_name, norm_name in VIDEO_SOURCES:
        video_clips[src_name] = normalize_source_video(src_name, norm_name)

    # 3. Assemble sequence
    sequence = [
        ("Intro Slide", slide_clips["slide_0_intro"]),
        ("Tourist Portal Intro Slide", slide_clips["slide_1_tourist"]),
        ("Tourist Portal Recording", video_clips["1-Tourist.mp4"]),
        ("Business Portal Intro Slide", slide_clips["slide_2_business"]),
        ("Business Portal Recording", video_clips["2-Business-hotel.mp4"]),
        ("Community Portal Intro Slide", slide_clips["slide_3_community"]),
        ("Community Portal Recording", video_clips["3-community.mp4"]),
        ("Authority Portal Intro Slide", slide_clips["slide_4_authority"]),
        ("Authority Portal Recording", video_clips["4-admin_Authority.mp4"]),
        ("Outro Concluding Slide", slide_clips["slide_5_outro"]),
    ]

    concat_file = WORK_DIR / "concat_playlist.txt"
    lines = []
    print("\n=== Concatenation Sequence ===")
    for title, clip_path in sequence:
        print(f"  • {title}: {clip_path.name}")
        # Concat demuxer needs forward slashes or escaped backslashes
        path_str = str(clip_path.resolve()).replace("\\", "/")
        lines.append(f"file '{path_str}'\n")

    concat_file.write_text("".join(lines), encoding="utf-8")
    print(f"\nWritten concat playlist: {concat_file.name}")

    # 4. Join all clips with stream copy
    print(f"\nJoining all 10 clips into final video: {FINAL_OUTPUT.name}...")
    t0 = time.time()
    join_cmd = [
        FFMPEG_EXE, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(FINAL_OUTPUT)
    ]
    res = subprocess.run(join_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Error joining clips:\n{res.stderr}")
        sys.exit(1)

    dur = time.time() - t0
    final_size_mb = FINAL_OUTPUT.stat().st_size / (1024 * 1024)
    print(f"\n[DONE] Final video created in {dur:.1f}s!")
    print(f"  File: {FINAL_OUTPUT}")
    print(f"  Size: {final_size_mb:.2f} MB")

    # 5. Probe final video
    probe_cmd = [
        FFPROBE_EXE,
        "-v", "error",
        "-show_entries", "format=duration,size,bit_rate",
        "-show_entries", "stream=width,height,codec_name,r_frame_rate,duration",
        "-of", "default=noprint_wrappers=1",
        str(FINAL_OUTPUT)
    ]
    probe_res = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    print("\n=== Final Video Probe ===")
    print(probe_res.stdout)

if __name__ == "__main__":
    main()
