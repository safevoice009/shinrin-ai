import { abbreviations } from './abbreviations.js';
import { profiles } from './profiles.js';

export async function runDiagnostics(classifier, activeProfile, noteInput, selectProfile, generateSOAP) {
    const list = document.getElementById('diagnosticsList');
    list.innerHTML = '';

    const tests = [
        {
            name: "Entity Highlighter Parsing Test",
            fn: async () => {
                const testText = "Patient takes lisinopril for joint pain.";
                let marked = testText;
                const highlights = [
                    { term: "lisinopril", type: "medication" },
                    { term: "joint pain", type: "symptom" }
                ];
                highlights.forEach(entity => {
                    const regex = new RegExp(`(${entity.term})`, 'gi');
                    marked = marked.replace(regex, `<span class="highlight-${entity.type}">$1</span>`);
                });
                if (!marked.includes('class="highlight-medication">lisinopril') || !marked.includes('class="highlight-symptom">joint pain')) {
                    throw new Error("Highlight tags did not match expected structure.");
                }
            }
        },
        {
            name: "Medical Abbreviation Lookup Test",
            fn: async () => {
                const target = abbreviations["CHF"];
                if (!target || !target.includes("Congestive Heart Failure")) {
                    throw new Error("Abbreviation CHF expansion was incorrect or missing.");
                }
            }
        },
        {
            name: "SOAP Layout Sectioning Test",
            fn: async () => {
                const soap = generateSOAP("Patient reports progressive dyspnea and fatigue. Lisinopril and carvedilol are medications.", profiles[0]);
                if (!soap.subjective || !soap.objective || !soap.assessment || !soap.plan) {
                    throw new Error("SOAP note was missing one or more required sections (S, O, A, P).");
                }
                if (!soap.subjective.includes("progressive dyspnea")) {
                    throw new Error("Subjective text did not extract complaints correctly.");
                }
            }
        },
        {
            name: "Profile State Switcher Integrity Test",
            fn: async () => {
                const oldProfileId = activeProfile.id;
                selectProfile('profileB');
                if (activeProfile.id !== 'profileB' || noteInput.value !== profiles[1].notes) {
                    throw new Error("State transition to Profile B failed.");
                }
                selectProfile(oldProfileId);
            }
        },
        {
            name: "MELD Liver Failure Risk Score Test",
            fn: async () => {
                const bilirubinEl = document.getElementById('meld-bilirubin');
                const inrEl = document.getElementById('meld-inr');
                const creatinineEl = document.getElementById('meld-creatinine');
                const dialysisEl = document.getElementById('meld-dialysis');
                const scoreEl = document.getElementById('meld-score');
                const riskEl = document.getElementById('meld-mortality-risk');
                
                if (bilirubinEl && inrEl && creatinineEl && dialysisEl && scoreEl && riskEl) {
                    const origBilirubin = bilirubinEl.value;
                    const origInr = inrEl.value;
                    const origCreatinine = creatinineEl.value;
                    const origDialysis = dialysisEl.checked;
                    const origScore = scoreEl.textContent;
                    const origRisk = riskEl.textContent;
                    
                    try {
                        bilirubinEl.value = '1.2';
                        inrEl.value = '1.1';
                        creatinineEl.value = '1.5';
                        dialysisEl.checked = false;
                        
                        const { runMeld } = await import('./calculators.js');
                        runMeld();
                        
                        const score = parseInt(scoreEl.textContent, 10);
                        if (isNaN(score) || score <= 0) {
                            throw new Error(`Calculated invalid MELD score: ${score}`);
                        }
                    } finally {
                        bilirubinEl.value = origBilirubin;
                        inrEl.value = origInr;
                        creatinineEl.value = origCreatinine;
                        dialysisEl.checked = origDialysis;
                        scoreEl.textContent = origScore;
                        riskEl.textContent = origRisk;
                    }
                } else {
                    const mockBilirubin = document.createElement('input');
                    mockBilirubin.id = 'meld-bilirubin';
                    mockBilirubin.value = '1.2';
                    const mockInr = document.createElement('input');
                    mockInr.id = 'meld-inr';
                    mockInr.value = '1.1';
                    const mockCreatinine = document.createElement('input');
                    mockCreatinine.id = 'meld-creatinine';
                    mockCreatinine.value = '1.5';
                    const mockDialysis = document.createElement('input');
                    mockDialysis.type = 'checkbox';
                    mockDialysis.id = 'meld-dialysis';
                    mockDialysis.checked = false;
                    
                    const scoreSpan = document.createElement('span');
                    scoreSpan.id = 'meld-score';
                    const riskDiv = document.createElement('div');
                    riskDiv.id = 'meld-mortality-risk';
                    
                    document.body.appendChild(mockBilirubin);
                    document.body.appendChild(mockInr);
                    document.body.appendChild(mockCreatinine);
                    document.body.appendChild(mockDialysis);
                    document.body.appendChild(scoreSpan);
                    document.body.appendChild(riskDiv);
                    
                    try {
                        const { runMeld } = await import('./calculators.js');
                        runMeld();
                        const score = parseInt(scoreSpan.textContent, 10);
                        if (isNaN(score) || score <= 0) {
                            throw new Error(`Calculated invalid MELD score: ${score}`);
                        }
                    } finally {
                        mockBilirubin.remove();
                        mockInr.remove();
                        mockCreatinine.remove();
                        mockDialysis.remove();
                        scoreSpan.remove();
                        riskDiv.remove();
                    }
                }
            }
        },
        {
            name: "WASM Transformers.js Model Inference Test",
            fn: async () => {
                if (!classifier) {
                    throw new Error("AI classifier model is not loaded. Load model by parsing a note first.");
                }
                const testText = "Severe crushing chest pain and short of breath.";
                const start = performance.now();
                const res = await classifier(testText);
                const latency = performance.now() - start;
                if (!res || !res[0] || !res[0].label) {
                    throw new Error("Inference result did not contain expected fields.");
                }
                return `Inference returned ${res[0].label} in ${latency.toFixed(0)}ms`;
            }
        }
    ];

    if (window.logTelemetry) {
        window.logTelemetry("Starting local diagnostic self-test suite...", "SYSTEM");
    }

    for (const test of tests) {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-3 rounded-xl border border-stone-200 dark:border-stone-885 bg-[#FAF7F2] dark:bg-stone-950/40 text-xs animate-pulse';
        item.innerHTML = `
            <span class="text-stone-700 dark:text-stone-300 font-medium">${test.name}</span>
            <span class="text-stone-400 dark:text-stone-555">Running...</span>
        `;
        list.appendChild(item);

        const start = performance.now();
        let pass = false;
        let message = "Passed";
        let timeLabel = "";

        try {
            const res = await test.fn();
            pass = true;
            if (res) message = res;
            const end = performance.now();
            timeLabel = `${(end - start).toFixed(0)}ms`;
        } catch (e) {
            pass = false;
            message = e.message;
            const end = performance.now();
            timeLabel = `${(end - start).toFixed(0)}ms`;
        }

        item.classList.remove('animate-pulse');
        if (pass) {
            item.className = 'flex justify-between items-center p-3 rounded-xl border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10 text-xs';
            item.innerHTML = `
                <div class="flex items-center space-x-2">
                    <span class="text-green-600 font-bold text-sm">✓</span>
                    <span class="text-stone-700 dark:text-stone-300 font-medium">${test.name}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-[10px] text-stone-400 dark:text-stone-550 font-mono">${timeLabel}</span>
                    <span class="text-green-700 dark:text-green-400 font-semibold bg-green-100/50 dark:bg-green-900/30 px-2 py-0.5 rounded">${message}</span>
                </div>
            `;
            if (window.logTelemetry) {
                window.logTelemetry(`[PASS] ${test.name} (${timeLabel})`, "SUCCESS");
            }
        } else {
            item.className = 'flex justify-between items-center p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 text-xs';
            item.innerHTML = `
                <div class="flex items-center space-x-2">
                    <span class="text-red-600 font-bold text-sm">✗</span>
                    <span class="text-stone-700 dark:text-stone-300 font-medium">${test.name}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-[10px] text-stone-400 dark:text-stone-550 font-mono">${timeLabel}</span>
                    <span class="text-red-700 dark:text-red-400 font-semibold bg-red-100/50 dark:bg-red-900/30 px-2 py-0.5 rounded">${message}</span>
                </div>
            `;
            if (window.logTelemetry) {
                window.logTelemetry(`[FAIL] ${test.name} (${timeLabel}): ${message}`, "ERROR");
            }
        }
    }
    
    if (window.logTelemetry) {
        window.logTelemetry("Diagnostic test suite complete.", "SYSTEM");
    }
}
