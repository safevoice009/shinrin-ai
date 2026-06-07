# Beyond Tomorrow Summit 2026 Submission Kit

This file contains copy-paste ready documentation and pitch materials for your Devpost project profile, presentation slides, and GitHub repository description.

---

## 1. Devpost Submission Outline

### Project Title: Shinrin AI (森林)

### What it does
Shinrin AI is a premium, open-source clinical dashboard designed to streamline clinical workflows, visualize patient histories, and highlight medical narratives with zero server hosting costs. It runs 100% locally in the browser to maintain strict HIPAA compliance. Key features include:
1. **Interactive Patient Simulator**: Allows clinicians to interview virtual patients (Kenji, Ami, Hiroshi) using browser-native Text-to-Speech (TTS).
2. **Real-time Voice-to-Text Clinical Dictation**: Powered by an in-browser Whisper AI model (via Transformers.js) or Web Speech API.
3. **Local Biomedical Named Entity Recognition (NER)**: Highlights medications, symptoms, and risks instantly using ONNX Runtime Web.
4. **Interactive SVG Patient Anatomical Atlas**: A multi-layered model (Organs, Skeletal, Cardio, Nervous) that correlates findings with clinical notes.
5. **Interactive Decision Flowcharts & Prescriptions**: Suggests guidelines (GDMT, SLE ACR, TB protocols) and generates print-ready Shohousen (prescription slips).

### How we built it
- **Frontend**: Vanilla HTML5, TailwindCSS, and custom Sino-Japanese Wabi-Sabi CSS styling (Washi paper, Matcha Green, Sakura Peach).
- **AI Core**: Transformers.js, ONNX Runtime Web, and WebLLM for client-side model execution.
- **EHR & Integrations**: SMART on FHIR clients, IndexedDB for async browser storage, openFDA REST API for adverse event analysis.
- **Testing**: E2E integration verification via Playwright.

### Challenges we ran into
- Quantizing and running deep learning models (40MB-150MB) client-side in browser memory with zero CPU choking.
- Handling audio downsampling to 16kHz for Whisper in pure client-side JS.

### Accomplishments we're proud of
- Achieving zero-cost hosting with fully private clinical reasoning.
- Stunning, responsive design with premium micro-interactions.

### What's next for Shinrin AI
- Direct integration into clinical EHR systems (Epic/Cerner) via App Orchard.
- Fine-tuning larger open-source medical models (e.g. Meditron-7B) for clinical decision-making.

---

## 2. Presentation Deck Outline

### Slide 1: Title & Vision
- **Title**: Shinrin AI (森林)
- **Tagline**: The Wabi-Sabi Styled Clinician Assistant
- **Vision**: Bringing high-fidelity, private on-device AI to the medical workspace.

### Slide 2: The Problem
- **Data Privacy**: Standard cloud AI models leak patient PII, risking massive HIPAA violations.
- **Cost**: Server-side model hosting for thousands of medical notes is prohibitively expensive.
- **Cognitive Load**: Doctors spend 50% of their day typing SOAP notes instead of looking at patients.

### Slide 3: The Solution
- **On-Device Execution**: 100% private. All clinical NLP runs in the browser via WASM/ONNX.
- **Zero Cost**: Zero API server costs. Scale to millions of clinicians for $0/month.
- **Ambient Intake**: Hands-free dictation plus a Simulated Actor Clinic to train clinicians.

### Slide 4: Interactive Architecture
- **Biomedical NER**: Instantly parses symptoms, risks, and medications.
- **Anatomy correlation**: Clicking organs correlates with current notes to suggest diagnostic tests.
- **openFDA Integration**: Dynamic alerts for medication side-effect profiles.

### Slide 5: The Market & Impact
- Clinicians, rural doctors, and medical students.
- Providing an offline-first, beautiful, and distraction-free diagnostic workspace.

---

## 3. GitHub Repo README.md Outline

```markdown
# Shinrin AI - Sino-Japanese Clinical Decision Support Suite

[![Vercel Deployment](https://img.shields.io/badge/deploy-vercel-brightgreen)](https://shinrin-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Shinrin AI (森林) is a lightweight, single-page clinical decision support dashboard inspired by traditional Japanese Zen and Wabi-Sabi aesthetics. It operates entirely client-side using WebGPU, ONNX Runtime, and WebAssembly to parse clinical narratives, simulate patient cases, and map FHIR bundles locally.

## Features
- **Hands-Free Dictation**: Direct mic dictation with browser Web Speech or a local Whisper model.
- **Biomedical Tagging**: Extracts symptoms, meds, and diagnoses locally.
- **Interactive Atlas**: Clickable multi-layer anatomical atlas to correlate symptoms.
- **Patient Simulator**: Interview mock patients (Kenji, Ami, Hiroshi) with TTS audio.
- **FDA Drug Alerts**: Direct openFDA querying for drug reactions.

## Quick Start
1. Clone the repository.
2. Run a local server: `python3 -m http.server 8080`.
3. Open `http://localhost:8080`.

## Tech Stack
- HTML5, Vanilla JavaScript, TailwindCSS, Custom CSS.
- Transformers.js, ONNX Runtime Web.
- Playwright E2E testing framework.

## 🎓 Developer & Legal Disclaimer

**Developed by Dr. Baddam Sucharith Reddy (AI-Assisted)**  
*Contact & Portfolios*: [LinkedIn Profile](https://www.linkedin.com/in/sucharith007) | [GitHub Profile](https://github.com/safevoice009) | [Project Source](https://github.com/safevoice009/shinrin-ai)

> [!WARNING]
> **Legal Notice**: This software is a proof-of-concept prototype. All patient profiles, clinical narratives, medical codes, policy checks, simulated patient dialogues (SPAC), and database logs are strictly simulated and for demonstration/portfolio purposes. It should not be used as medical advice or in real production healthcare environments.

**🔐 Privacy Safeguard**: No Protected Health Information (PHI) is ever collected, stored, or transmitted outside the client's browser. All Named Entity Recognition (NER), local text summarization, and audio transcription (Whisper AI) occur fully client-side inside this device's memory.
```
