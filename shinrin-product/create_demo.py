import os
import json
import subprocess
import re

# Workspace directory
workspace_dir = "/home/sucharithpop/Desktop/test 2 for cosmic cutomization/shinrin-ai"
os.makedirs(os.path.join(workspace_dir, "videos"), exist_ok=True)
os.makedirs(os.path.join(workspace_dir, "audio"), exist_ok=True)

# User's uploaded audio file
user_audio_src = "/home/sucharithpop/.gemini/antigravity-ide/brain/5783eef8-0333-4a3f-b14a-af30f06d090b/uploaded_media_1780716099334.img"

# Output files
user_intro_mp3 = os.path.join(workspace_dir, "audio", "user_intro.mp3")

# Narrations to generate (en-US-AndrewNeural)
narrations = {
    "intro_part2": (
        "Welcome to the product demonstration of Shinrin AI, a premium, Sino-Japanese Wabi-Sabi styled clinical decision support suite. "
        "Shinrin AI operates entirely client-side, bringing high-fidelity, secure, and private clinical reasoning directly to the clinician's browser. "
        "Let's explore the platform's core features."
    ),
    "workspace": (
        "First, the Clinical Workspace. Clinicians can type or dictate patient narratives using browser-native Whisper AI transcription. "
        "By selecting a clinical model and clicking Structure Note, our multi-stage pipeline normalizes notes, extracts biomedical entities like symptoms and medications, "
        "and generates a structured SOAP note. It also displays real-time vitals trends and an interactive cardiac waveform."
    ),
    "calculators": (
        "Under Risk Calculators, we provide interactive clinical decision scoring tools, such as the Wells' Score for pulmonary embolism. "
        "Toggling patient risk factors dynamically computes the risk level and allows clinicians to instantly insert the formatted score directly into the patient's narrative."
    ),
    "atlas": (
        "The Anatomical Atlas is a highly interactive, multi-layer SVG visualization mapping skeletal structure, organs, cardio-pulmonary, and nervous systems. "
        "Tapping on any anatomical node correlates the structure with active patient charts to suggest next-step diagnostic tests."
    ),
    "simulator": (
        "The Patient Simulator helps train clinicians using browser-native Speech Synthesis. "
        "Clinicians can select simulated patient cases, examine diagnostic scans, ask interview questions, and synchronize the transcript back to the patient chart."
    ),
    "workbench": (
        "In the AI Workbench, users can simulate low-rank adaptation fine-tuning of open-source medical models. "
        "The interface displays training progress curves and auto-deploys custom fine-tuned LoRA adapters to adapt clinical assessment recommendations."
    ),
    "diagnostics": (
        "For system health, the Self-Diagnostics suite runs live test assertions and browser latency benchmarks, "
        "while the macOS-inspired Developer Telemetry drawer logs real-time API routing and security safeguards."
    ),
    "conclusion": (
        "Finally, the application supports a gorgeous, premium Dark Mode, preserving the calming, minimal Japanese aesthetic. "
        "Thank you for watching the demo of Shinrin AI, where data privacy meets clinical excellence."
    )
}

def get_duration(file_path):
    cmd = ["ffprobe", "-i", file_path, "-show_entries", "format=duration", "-v", "quiet", "-of", "csv=p=0"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return float(result.stdout.strip())

def main():
    print("--- STEP 1: Converting User Audio ---")
    if os.path.exists(user_audio_src):
        # Convert user's WebM audio to MP3
        subprocess.run(["ffmpeg", "-y", "-i", user_audio_src, "-ar", "44100", "-ac", "2", "-ab", "192k", user_intro_mp3], check=True)
        user_duration = get_duration(user_intro_mp3)
        print(f"Converted user intro. Duration: {user_duration:.2f}s")
    else:
        print("Warning: User audio file not found. A fallback voice intro will be used.")
        user_duration = 0.0

    print("--- STEP 2: Generating Narration Audios via edge-tts ---")
    durations = {"user_intro": user_duration}
    
    for key, text in narrations.items():
        audio_path = os.path.join(workspace_dir, "audio", f"{key}.mp3")
        print(f"Generating voice for '{key}'...")
        subprocess.run(["edge-tts", "--voice", "en-US-AndrewNeural", "--text", text, "--write-media", audio_path], check=True)
        durations[key] = get_duration(audio_path)
        print(f"Generated. Duration: {durations[key]:.2f}s")

    # Save the durations so record_demo.js can load them
    config_path = os.path.join(workspace_dir, "pause_durations.json")
    with open(config_path, "w") as f:
        json.dump(durations, f, indent=4)
    print(f"Saved durations to {config_path}")

if __name__ == "__main__":
    main()
