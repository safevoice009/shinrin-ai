import os
import subprocess
import glob

workspace_dir = "/home/sucharithpop/Desktop/test 2 for cosmic cutomization/shinrin-ai"
audio_dir = os.path.join(workspace_dir, "audio")
videos_dir = os.path.join(workspace_dir, "videos")

# Audio segments in order
audio_files = [
    os.path.join(audio_dir, "user_intro.mp3"),
    os.path.join(audio_dir, "intro_part2.mp3"),
    os.path.join(audio_dir, "workspace.mp3"),
    os.path.join(audio_dir, "calculators.mp3"),
    os.path.join(audio_dir, "atlas.mp3"),
    os.path.join(audio_dir, "simulator.mp3"),
    os.path.join(audio_dir, "workbench.mp3"),
    os.path.join(audio_dir, "diagnostics.mp3"),
    os.path.join(audio_dir, "conclusion.mp3")
]

combined_audio = os.path.join(workspace_dir, "combined_audio.mp3")
output_video = os.path.join(workspace_dir, "product_demo_video.mp4")

def main():
    print("--- STEP 1: Concatenating Audio Narration Files ---")
    # Verify all audio files exist
    valid_files = []
    for f in audio_files:
        if os.path.exists(f):
            valid_files.append(f)
        else:
            print(f"Warning: Audio file {f} missing!")

    # Combine them using ffmpeg concat filter (re-encoding to ensure stable packet sync and rate matching)
    filter_complex = "".join([f"[{i}:a]" for i in range(len(valid_files))])
    filter_complex += f"concat=n={len(valid_files)}:v=0:a=1[outa]"
    
    cmd = ["ffmpeg", "-y"]
    for f in valid_files:
        cmd.extend(["-i", f])
    cmd.extend(["-filter_complex", filter_complex, "-map", "[outa]", "-ac", "2", "-ar", "44100", "-ab", "192k", combined_audio])
    
    print("Running ffmpeg concat...")
    subprocess.run(cmd, check=True)
    print("Concatenated audio saved to:", combined_audio)

    print("--- STEP 2: Locating Playwright Video Recording ---")
    webm_files = glob.glob(os.path.join(videos_dir, "*.webm"))
    if not webm_files:
        print("Error: No recorded webm video found in", videos_dir)
        return

    # Find the newest webm file
    newest_video = max(webm_files, key=os.path.getmtime)
    print("Found recorded video:", newest_video)

    print("--- STEP 3: Merging Audio and Video into Final MP4 ---")
    # Merge video and audio. Let ffmpeg encode video to mp4 (H.264) for wide compatibility on web/Devpost.
    merge_cmd = [
        "ffmpeg", "-y",
        "-i", newest_video,
        "-i", combined_audio,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest", # terminates when shortest input ends to avoid hanging frame at end
        output_video
    ]
    
    print("Running ffmpeg merge...")
    subprocess.run(merge_cmd, check=True)
    print("SUCCEEDED! Final product demo video saved to:", output_video)

if __name__ == "__main__":
    main()
