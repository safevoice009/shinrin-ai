# Shinrin AI (森林)

> **A Japanese Wabi-Sabi Styled Clinical Decision Support Dashboard.**

<div align="center">
  <p align="center">
    <strong>Watch the clinical workflow execution, LoRA fine-tuning, anatomical atlas, and patient simulator:</strong>
  </p>

  <video src="shinrin-product/shinrin_ai_product_demo.mp4" width="100%" controls autoplay loop muted style="border-radius: 12px; border: 1px solid #8AA690; box-shadow: 0 10px 30px rgba(0,0,0,0.05);"></video>
</div>

Shinrin AI is a premium, open-source clinical dashboard designed to streamline clinical workflows, visualize patient histories, and highlight medical narratives. It is built as a lightweight, single-page web application with a focus on minimalist aesthetics, balanced white space, and clear typography.

---

## 🎨 Design System & Aesthetics
Inspired by traditional Japanese zen and **wabi-sabi** (finding beauty in simplicity and natural forms) principles:
* **Background**: Warm washi paper (`#FAF7F2`)
* **Text**: Sumi-ink charcoal (`#2C2C2A`)
* **Accents**: Organic Cedar/Moss green (`#4A5D4E`)
* **Highlights**: Ochre earth (`#D1A153`) for tests, blossom clay (`#E0A9A5`) for warnings
* **Elements**: Rounded corners (`rounded-2xl` / `rounded-3xl`) resembling smooth river stones with delicate borders and minimal shadows.

---

## 🌟 Key Features
1. **Longitudinal Patient Timeline**: An interactive, chronological history mapping clinical events (visits, diagnostic tests, hospitalizations) with dynamic color-coding.
2. **Clinical Narrative Entity Highlights**: Built-in mock NLP parses unstructured notes to highlight core entities (green for medications, gold for symptoms, red for warnings).
3. **Structured EHR Mapping**: Automatically maps extracted narrative components into structured tabular cards.
4. **Clinical Decision Recommendations**: Suggests evidence-based clinical pathways and diagnostic next-steps, accompanied by direct literature links (e.g. PubMed, CDC).

---

## 🚀 How to Run Locally
No installation or compilation is required. The application runs client-side, but due to modern browser security policies (CORS) regarding ES Modules, it must be served via a local web server rather than opened directly as a file.

1. Clone this repository:
   ```bash
   git clone https://github.com/safevoice009/shinrin-ai.git
   ```
2. Start a lightweight local server from the project directory:
   * **Python 3** (Default on most systems):
     ```bash
     python3 -m http.server 8080
     ```
   * **NodeJS / npm**:
     ```bash
     npx serve
     ```
3. Open your browser and navigate to:
   [http://localhost:8080](http://localhost:8080) (or the port outputted by the server).

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

---

## 🎓 Developer & Legal Disclaimer

**Developed by Dr. Baddam Sucharith Reddy (AI-Assisted)**  
*Contact & Portfolios*: [LinkedIn Profile](https://www.linkedin.com/in/sucharith007) | [GitHub Profile](https://github.com/safevoice009) | [Project Source](https://github.com/safevoice009/shinrin-ai)

> [!WARNING]
> **Legal Notice**: This software is a proof-of-concept prototype. All patient profiles, clinical narratives, medical codes, policy checks, simulated patient dialogues (SPAC), and database logs are strictly simulated and for demonstration/portfolio purposes. It should not be used as medical advice or in real production healthcare environments.

**🔐 Privacy Safeguard**: No Protected Health Information (PHI) is ever collected, stored, or transmitted outside the client's browser. All Named Entity Recognition (NER), local text summarization, and audio transcription (Whisper AI) occur fully client-side inside this device's memory.
