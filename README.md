# Shinrin AI (森林 AI)

> **A Japanese Wabi-Sabi Styled Clinical Decision Support Dashboard.**

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
No installation or compilation is required. The application runs entirely client-side in any modern web browser.

1. Clone this repository:
   ```bash
   git clone https://github.com/safevoice009/shinrin-ai.git
   ```
2. Open the file in your browser:
   ```bash
   firefox index.html
   ```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
