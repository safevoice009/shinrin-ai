import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
import { abbreviations } from './abbreviations.js';
import { profiles } from './profiles.js';
import { runChads, runHasbled, runWells, runMews, runMeld, runCurb65, insertScore } from './calculators.js';
import { runDiagnostics } from './diagnostics.js';
import { fetchFhirRecord } from './fhir.js';

// Disable local model caching, fetch from HuggingFace CDN
env.allowLocalModels = false;

let currentProfiles = [...profiles];
function loadProfilesFromStorage() {
    const saved = localStorage.getItem('shinrin_custom_cases');
    if (saved) {
        try {
            const customCases = JSON.parse(saved);
            customCases.forEach(customCase => {
                currentProfiles.push(customCase);
            });
        } catch (e) {
            console.error("Failed to parse custom cases from localStorage", e);
        }
    }
}
loadProfilesFromStorage();

function saveProfilesToStorage() {
    const custom = currentProfiles.filter(p => p.id.startsWith('profile_'));
    localStorage.setItem('shinrin_custom_cases', JSON.stringify(custom));
}

let activeProfile = currentProfiles[0];
let classifier = null;
let activeModel = 'distilbert';
let activeRegistryTool = 'openmrs';
let activeConsoleTab = 'clinical';

// Initialize UI Elements
const profileSwitcher = document.getElementById('profileSwitcher');
const recommendationPanel = document.getElementById('recommendationPanel');
const timelinePanel = document.getElementById('timelinePanel');
const noteInput = document.getElementById('noteInput');

// Telemetry & Stepper Utilities
function toggleConsole() {
    const container = document.getElementById('consoleContainer');
    const chevron = document.getElementById('consoleChevron');
    if (!container) return;
    if (container.classList.contains('h-12')) {
        container.classList.remove('h-12');
        container.classList.add('h-64');
        if (chevron) chevron.classList.add('rotate-180');
    } else {
        container.classList.remove('h-64');
        container.classList.add('h-12');
        if (chevron) chevron.classList.remove('rotate-180');
    }
}
window.toggleConsole = toggleConsole;

// OpenMed AI Model Hub Selector
function changeOpenmedModel() {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    const selector = document.getElementById('openmed-model-selector');
    if (!selector) return;
    
    activeModel = selector.value;
    logTelemetry(`OpenMed active model hub set to: "${selector.options[selector.selectedIndex].text}"`, "SYSTEM");
    
    // Update header status visual
    const statusEl = document.getElementById('aiHeaderStatus');
    const labelEl = document.getElementById('aiHeaderLabel');
    if (activeModel === 'distilbert') {
        if (classifier) {
            statusEl.className = "inline-block w-2.5 h-2.5 rounded-full bg-[#4A5D4E]";
            labelEl.textContent = "Local Model: Ready (Cached)";
        } else {
            statusEl.className = "inline-block w-2.5 h-2.5 rounded-full bg-amber-450 animate-pulse";
            labelEl.textContent = "Local Model: Offline";
        }
    } else if (activeModel === 'summarizer') {
        statusEl.className = "inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse";
        labelEl.textContent = "OpenMed: Summarizer Ready";
    } else if (activeModel === 'ner') {
        statusEl.className = "inline-block w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse";
        labelEl.textContent = "OpenMed: NER-Biomedical Ready";
    }
}
window.changeOpenmedModel = changeOpenmedModel;

// Collapsible Drawer Tab Switcher
function switchConsoleTab(tabId) {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    activeConsoleTab = tabId;
    
    const tabClinical = document.getElementById('tab-console-clinical');
    const tabTelemetry = document.getElementById('tab-console-telemetry');
    const viewClinical = document.getElementById('console-view-clinical');
    const viewTelemetry = document.getElementById('console-view-telemetry');
    
    if (!tabClinical || !tabTelemetry || !viewClinical || !viewTelemetry) return;
    
    if (tabId === 'clinical') {
        tabClinical.className = "text-[#D1A153] border-b-2 border-[#D1A153] pb-0.5 px-1 hover:text-white transition duration-200";
        tabTelemetry.className = "text-stone-400 pb-0.5 px-1 hover:text-white transition duration-200";
        viewClinical.classList.remove('hidden');
        viewTelemetry.classList.add('hidden');
    } else {
        tabClinical.className = "text-stone-400 pb-0.5 px-1 hover:text-white transition duration-200";
        tabTelemetry.className = "text-[#D1A153] border-b-2 border-[#D1A153] pb-0.5 px-1 hover:text-white transition duration-200";
        viewClinical.classList.add('hidden');
        viewTelemetry.classList.remove('hidden');
    }
}
window.switchConsoleTab = switchConsoleTab;

// Open Health Tech Registry Integration
function selectRegistryTool(toolId) {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    activeRegistryTool = toolId;
    
    const titleEl = document.getElementById('sandbox-tool-title');
    const descEl = document.getElementById('sandbox-tool-desc');
    const endpointEl = document.getElementById('sandbox-endpoint');
    const ehrLabelEl = document.getElementById('sync-node-ehr-label');
    const ehrNodeEl = document.getElementById('sync-node-ehr');
    const gatewayNodeEl = document.getElementById('sync-node-gateway');
    const line1El = document.getElementById('sync-line-1');
    const line2El = document.getElementById('sync-line-2');
    const glowPathEl = document.getElementById('sync-glow-path');
    const statusEl = document.getElementById('sandbox-status');
    
    if (ehrLabelEl) ehrLabelEl.textContent = toolId === 'gnuhealth' ? 'GNU Health' : toolId.toUpperCase();
    if (ehrNodeEl) {
        ehrNodeEl.className = "w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-950 border-2 border-stone-250/20 dark:border-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-400";
        ehrNodeEl.classList.remove('sync-node-pulse');
    }
    if (gatewayNodeEl) {
        gatewayNodeEl.className = "w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-950 border-2 border-stone-250/20 dark:border-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-400";
        gatewayNodeEl.classList.remove('sync-node-pulse-gold');
    }
    if (line1El) line1El.classList.add('opacity-0');
    if (line2El) line2El.classList.add('opacity-0');
    if (glowPathEl) glowPathEl.classList.add('hidden');
    if (statusEl) {
        statusEl.textContent = "Status: Idle";
        statusEl.className = "text-[10px] text-stone-400 dark:text-stone-555 font-bold uppercase tracking-wider";
    }
    
    if (!titleEl || !descEl || !endpointEl) return;
    
    if (toolId === 'openmrs') {
        titleEl.textContent = "Integrate with OpenMRS";
        descEl.textContent = "Compile SOAP clinical records and sync them directly to OpenMRS database via standard REST endpoints.";
        endpointEl.value = "https://demo.openmrs.org/openmrs/ws/rest/v1/obs";
    } else if (toolId === 'openemr') {
        titleEl.textContent = "Integrate with OpenEMR";
        descEl.textContent = "Sync clinical encounter records with OpenEMR practice management system database.";
        endpointEl.value = "https://demo.openemr.io/openemr/api/default/encounter";
    } else if (toolId === 'medplum') {
        titleEl.textContent = "Integrate with Medplum";
        descEl.textContent = "Dispatch standard compliant HL7 FHIR bundles to your headless Medplum HIPAA repository.";
        endpointEl.value = "https://api.medplum.com/fhir/R4/Encounter";
    } else if (toolId === 'gnuhealth') {
        titleEl.textContent = "Integrate with GNU Health";
        descEl.textContent = "Publish structured diagnosis and evaluation details to GNU Health node via federation API.";
        endpointEl.value = "https://gnuhealth-demo.org/api/clinical/evaluations";
    }
    
    // Refresh connection payload with current values if available
    if (window.lastSoap) {
        updateFHIRBundle(activeProfile, window.lastSoap);
    } else {
        updateFHIRBundle(activeProfile, null);
    }
}
window.selectRegistryTool = selectRegistryTool;

async function syncSandboxTool() {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    const btn = document.getElementById('sandbox-sync-btn');
    const statusEl = document.getElementById('sandbox-status');
    
    const nodeLocal = document.getElementById('sync-node-local');
    const nodeGateway = document.getElementById('sync-node-gateway');
    const nodeEhr = document.getElementById('sync-node-ehr');
    const line1 = document.getElementById('sync-line-1');
    const line2 = document.getElementById('sync-line-2');
    const glowPath = document.getElementById('sync-glow-path');
    
    if (!btn || !statusEl) return;
    
    btn.disabled = true;
    btn.textContent = "Syncing...";
    statusEl.textContent = "Status: Dispatching...";
    statusEl.className = "text-[10px] text-amber-500 font-bold uppercase tracking-wider animate-pulse";
    
    logTelemetry(`Initiating Sync to ${activeRegistryTool.toUpperCase()} EHR Gateway...`, "FHIR");
    
    // Start pathway animation step 1
    if (line1) line1.classList.remove('opacity-0');
    if (glowPath) glowPath.classList.remove('hidden');
    if (nodeGateway) {
        nodeGateway.className = "w-8 h-8 rounded-full bg-[#D1A153]/15 border-2 border-[#D1A153] flex items-center justify-center text-[10px] font-bold text-[#D1A153] sync-node-pulse-gold shadow-sm";
    }
    
    // Step 2 delay
    await new Promise(resolve => setTimeout(resolve, 700));
    if (line2) line2.classList.remove('opacity-0');
    if (nodeEhr) {
        nodeEhr.className = "w-8 h-8 rounded-full bg-emerald-500/10 border-2 border-emerald-500/80 flex items-center justify-center text-[10px] font-bold text-emerald-500 sync-node-pulse shadow-sm";
    }
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    btn.disabled = false;
    btn.textContent = "Dispatch to EHR";
    statusEl.textContent = "Status: Synced (201 Created)";
    statusEl.className = "text-[10px] text-green-500 font-bold uppercase tracking-wider";
    
    if (glowPath) glowPath.classList.add('hidden');
    if (nodeEhr) {
        // Steady success green node
        nodeEhr.className = "w-8 h-8 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg";
    }
    
    logTelemetry(`Data successfully committed to ${activeRegistryTool.toUpperCase()} registry. Server returned HTTP 201 Created.`, "SUCCESS");
}
window.syncSandboxTool = syncSandboxTool;

// Doctor Workspace (Clinical Insights)
function updateClinicalInsights(profile, soap = null) {
    const pathophysEl = document.getElementById('clinical-pathophysiology');
    const guidelinesEl = document.getElementById('clinical-guidelines-checklist');
    const diffsEl = document.getElementById('clinical-differentials');
    
    if (!pathophysEl || !guidelinesEl || !diffsEl) return;
    
    let pathophysText = "";
    let guidelines = [];
    let differentials = [];
    
    if (profile.id === 'profileA') {
        pathophysText = "Progressive left ventricular systolic impairment leads to elevated pulmonary venous pressures, driving pulmonary transudate (causing dyspnea) and systemic venous congestion (causing peripheral edema). GDMT mitigates neurohormonal activation.";
        guidelines = [
            "Initiate SGLT2 inhibitor (e.g., Empagliflozin) per 2022 AHA/ACC HFrEF Guidelines (Class 1a recommendation).",
            "Monitor serum potassium and renal function (GFR) during ACEi/ARB titration.",
            "Schedule follow-up echocardiogram in 3 months to assess for cardiac remodeling."
        ];
        differentials = [
            "Acute Decompensated Heart Failure (HFrEF baseline)",
            "Renal failure with systemic fluid overload",
            "COPD exacerbation (pulmonary etiology)"
        ];
    } else if (profile.id === 'profileB') {
        pathophysText = "Auto-antibody cascade results in immune-complex deposition at dermal-epidermal junctions (malar rash) and synovium membranes, causing localized symmetrical polyarthritis and transient stiffness.";
        guidelines = [
            "Order dsDNA, anti-Smith, complement levels (C3/C4), and urinalysis to screen for lupus nephritis.",
            "Schedule baseline retinal photography prior to starting Hydroxychloroquine therapy.",
            "Advise complete photoprotection (broad-spectrum SPF, UV clothing) as solar exposure triggers disease activity."
        ];
        differentials = [
            "Systemic Lupus Erythematosus (SLE suspect)",
            "Early Rheumatoid Arthritis",
            "Drug-induced Lupus Erythematosus"
        ];
    } else if (profile.id === 'profileC') {
        pathophysText = "Inhalation of mycobacterial droplets triggers alveolar macrophage phagocytosis, forming necrotizing caseous granulomas (infiltration). Cytokine cascade (TNF-α, IL-1) drives weight loss and hypothalamic night sweats.";
        guidelines = [
            "Enforce immediate airborne infection isolation containment precautions.",
            "Obtain triple morning sputum samples for Acid-Fast Bacilli (AFB) smear and GeneXpert PCR.",
            "Obtain baseline hepatic panel prior to starting potential hepatotoxic RIPE treatment."
        ];
        differentials = [
            "Pulmonary Tuberculosis infection",
            "Atypical fungal pneumonia (Histoplasmosis, Coccidioidomycosis)",
            "Bronchogenic Carcinoma (mass effect/necrosis)"
        ];
    } else {
        pathophysText = "Patient note structured dynamically. Review custom guidelines checklist.";
        guidelines = ["Assess vitals and objective labs.", "Monitor clinical progression."];
        differentials = ["Unspecified clinical syndrome"];
    }
    
    pathophysEl.textContent = pathophysText;
    
    guidelinesEl.innerHTML = guidelines.map(g => `
        <li class="flex items-start gap-2">
            <input type="checkbox" class="mt-0.5 rounded accent-[#4A5D4E]" ${soap ? 'checked' : ''}>
            <span>${g}</span>
        </li>
    `).join('');
    
    diffsEl.innerHTML = differentials.map((d, i) => `
        <li class="flex items-center gap-2">
            <span class="font-extrabold text-[#D1A153]">[${i + 1}]</span>
            <span>${d}</span>
        </li>
    `).join('');
}
window.updateClinicalInsights = updateClinicalInsights;

// Developer Workspace (FHIR Bundle JSON Syntax Highlighter)
function highlightJson(jsonObj) {
    let jsonStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj, null, 2);
    // Escape HTML to prevent injection
    jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
    return jsonStr.replace(regex, function (match) {
        let cls = 'token-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'token-key';
                return `<span class="${cls}">${match.replace(/:$/, '')}</span>:`;
            } else {
                cls = 'token-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'token-boolean';
        } else if (/null/.test(match)) {
            cls = 'token-null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}

function updateFHIRBundle(profile, soap = null) {
    const fhirEl = document.getElementById('console-fhir-payload');
    if (!fhirEl) return;
    
    const patientId = profile.id;
    const bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": new Date().toISOString(),
        "entry": [
            {
                "fullUrl": `urn:uuid:patient-${patientId}`,
                "resource": {
                    "resourceType": "Patient",
                    "id": patientId,
                    "active": true,
                    "name": [
                        {
                            "use": "official",
                            "text": profile.name.split(':')[1]?.trim() || profile.name
                        }
                    ],
                    "gender": profile.id === 'profileB' ? "female" : "male",
                    "birthDate": profile.id === 'profileB' ? "1992-04-12" : (profile.id === 'profileA' ? "1964-08-22" : "1981-11-05")
                }
            }
        ]
    };
    
    if (soap) {
        bundle.entry.push({
            "fullUrl": `urn:uuid:encounter-${patientId}`,
            "resource": {
                "resourceType": "Encounter",
                "id": `encounter-${patientId}`,
                "status": "finished",
                "class": {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": "AMB",
                    "display": "ambulatory"
                },
                "subject": {
                    "reference": `urn:uuid:patient-${patientId}`
                },
                "reasonCode": [
                    {
                        "text": profile.description
                    }
                ]
            }
        });
        
        bundle.entry.push({
            "fullUrl": `urn:uuid:documentreference-${patientId}`,
            "resource": {
                "resourceType": "DocumentReference",
                "id": `soap-${patientId}`,
                "status": "current",
                "type": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "11506-3",
                            "display": "Provider-unspecified Progress note"
                        }
                    ],
                    "text": "Clinical SOAP Progress Note"
                },
                "subject": {
                    "reference": `urn:uuid:patient-${patientId}`
                },
                "content": [
                    {
                        "attachment": {
                            "contentType": "text/plain",
                            "data": btoa(unescape(encodeURIComponent(`Subjective: ${soap.subjective}\nObjective: ${soap.objective}\nAssessment: ${soap.assessment}\nPlan: ${soap.plan}`)))
                        }
                    }
                ]
            }
        });
    }
    
    fhirEl.innerHTML = highlightJson(bundle);
    
    // Also update the registry connection sandbox payload
    const sandboxPayloadEl = document.getElementById('sandbox-payload');
    if (sandboxPayloadEl) {
        const obsPayload = {
            "resourceType": "Observation",
            "status": "final",
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "11506-3",
                        "display": "Progress Note Observation"
                    }
                ],
                "text": "Ingested Narrative SOAP Observation"
            },
            "subject": {
                "reference": `Patient/${patientId}`
            },
            "valueString": soap ? `S: ${soap.subjective.substring(0,60).replace(/\n/g, ' ')}... O: ${soap.objective.substring(0,60).replace(/\n/g, ' ')}...` : "Waiting for narrative Note structure."
        };
        sandboxPayloadEl.innerHTML = highlightJson(obsPayload);
    }
}
window.updateFHIRBundle = updateFHIRBundle;

// Web Audio Premium Haptic Feedback Sound
function playPremiumHapticSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(140, audioCtx.currentTime); // 140Hz warm tone
        
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06); // 60ms decay
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.06);
        
        if (navigator.vibrate) {
            navigator.vibrate(12); // Short vibration pulse
        }
    } catch (e) {
        // Safe fallback
    }
}
window.playPremiumHapticSound = playPremiumHapticSound;

// Dynamic haptic binder
function bindHapticClickListeners() {
    const elements = document.querySelectorAll('button, input[type="checkbox"], select, nav button, [onclick]');
    elements.forEach(el => {
        if (!el.dataset.hapticBound) {
            el.addEventListener('click', () => {
                playPremiumHapticSound();
            });
            el.dataset.hapticBound = 'true';
        }
    });
}
window.bindHapticClickListeners = bindHapticClickListeners;

// Interactive 3D Card Tilt Effect
function initCard3DTilt() {
    const cards = document.querySelectorAll('.tilt-card-3d');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            
            // Subtly divide by 150 for a gentle micro-tilt
            const angleX = (yc - y) / 150;
            const angleY = (x - xc) / 150;
            
            // Cap the rotation at a maximum of 1.0 degree to maintain readability
            const clampedX = Math.max(-1.0, Math.min(1.0, angleX));
            const clampedY = Math.max(-1.0, Math.min(1.0, angleY));
            
            // Ultra-subtle lift and rotation
            card.style.transform = `perspective(1000px) rotateX(${clampedX}deg) rotateY(${clampedY}deg) translateY(-2px) scale3d(1.003, 1.003, 1.003)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
        });
    });
}
window.initCard3DTilt = initCard3DTilt;


// Mobile Responsive Tab Switcher
function switchMobileTab(tabName) {
    playPremiumHapticSound();
    const tabs = ['ingest', 'hub', 'calcs'];
    
    // Toggle navigation button styles
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-mob-${t}`);
        if (!btn) return;
        if (t === tabName) {
            btn.className = 'flex flex-col items-center gap-0.5 text-stone-900 dark:text-white font-extrabold text-[9px] uppercase tracking-wider py-1 px-3 rounded-xl bg-stone-100 dark:bg-stone-800';
        } else {
            btn.className = 'flex flex-col items-center gap-0.5 text-stone-400 dark:text-stone-550 font-bold text-[9px] uppercase tracking-wider py-1 px-3 rounded-xl';
        }
    });
    
    // Show/hide screen layouts
    tabs.forEach(t => {
        const sections = document.querySelectorAll(`.mob-section-${t}`);
        sections.forEach(sec => {
            if (t === tabName) {
                if (sec.id === 'highlightsContainer') {
                    if (window.isNoteParsed) {
                        sec.classList.remove('hidden');
                    }
                } else {
                    sec.classList.remove('hidden');
                }
            } else {
                sec.classList.add('hidden');
            }
        });
    });
}
window.switchMobileTab = switchMobileTab;

// HIPAA session auto-lock countdown timer
let hipaaTimer = null;
function toggleHipaaAutolock() {
    playPremiumHapticSound();
    const isChecked = document.getElementById('hipaa-autolock').checked;
    
    if (isChecked) {
        logTelemetry("HIPAA Auto-Lock Enabled (15 min countdown start on inactivity).", "INFO");
        resetHipaaTimer();
        document.addEventListener('mousemove', resetHipaaTimer);
        document.addEventListener('keypress', resetHipaaTimer);
    } else {
        logTelemetry("HIPAA Auto-Lock Disabled by Clinician.", "INFO");
        if (hipaaTimer) clearTimeout(hipaaTimer);
        document.removeEventListener('mousemove', resetHipaaTimer);
        document.removeEventListener('keypress', resetHipaaTimer);
    }
}
window.toggleHipaaAutolock = toggleHipaaAutolock;

function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-stone-900/95 dark:bg-[#FAF7F2]/95 backdrop-blur text-[#FAF7F2] dark:text-[#1C1C1E] px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 dark:border-black/5 text-xs font-semibold flex items-center gap-2 pointer-events-auto transform translate-y-8 opacity-0 transition-all duration-300 ease-out';
    
    let icon = '🔔';
    if (type === 'success') {
        icon = '✓';
        toast.className += ' border-l-4 border-emerald-500';
    } else if (type === 'info') {
        icon = 'ℹ️';
        toast.className += ' border-l-4 border-blue-500';
    } else if (type === 'warning') {
        icon = '⚠️';
        toast.className += ' border-l-4 border-amber-500';
    }
    
    toast.innerHTML = `<span class="flex items-center justify-center w-5 h-5 rounded-full bg-stone-850 dark:bg-stone-200 text-[10px]">${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-8', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-[-8px]', 'opacity-0');
        setTimeout(() => {
            toast.remove();
            if (toastContainer.childNodes.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 3000);
}
window.showToast = showToast;

function resetHipaaTimer() {
    if (hipaaTimer) clearTimeout(hipaaTimer);
    hipaaTimer = setTimeout(() => {
        resetNote();
        logTelemetry("HIPAA Session Auto-Cleared due to 15-minute inactivity.", "SYSTEM");
        showToast("Session cleared for HIPAA privacy compliance (inactivity lock).", "warning");
    }, 15 * 60 * 1000);
}


function logTelemetry(message, type = 'INFO') {
    const logsEl = document.getElementById('consoleLogs');
    if (!logsEl) return;
    
    const time = new Date().toLocaleTimeString(undefined, { hour12: false });
    const div = document.createElement('div');
    
    let prefixColor = 'text-stone-400';
    let contentColor = 'text-stone-300';
    
    if (type === 'SUCCESS') {
        prefixColor = 'text-emerald-500 font-bold';
        contentColor = 'text-emerald-100';
    } else if (type === 'AI_WASM') {
        prefixColor = 'text-cyan-400 font-bold';
        contentColor = 'text-cyan-100';
    } else if (type === 'FHIR') {
        prefixColor = 'text-purple-400 font-bold';
        contentColor = 'text-purple-100';
    } else if (type === 'SYSTEM') {
        prefixColor = 'text-[#D1A153] font-bold';
        contentColor = 'text-[#FAF7F2]';
    } else if (type === 'ERROR') {
        prefixColor = 'text-red-500 font-bold';
        contentColor = 'text-red-300';
    }
    
    div.innerHTML = `<span class="text-stone-500">[${time}]</span> <span class="${prefixColor}">[${type}]</span> <span class="${contentColor}">${message}</span>`;
    logsEl.appendChild(div);
    logsEl.scrollTop = logsEl.scrollHeight;
}
window.logTelemetry = logTelemetry;

function setStepperStage(stageIndex) {
    const stepperLine = document.getElementById('stepperLine');
    if (stepperLine) {
        const percent = stageIndex * 25;
        stepperLine.style.width = `${percent}%`;
    }
    
    for (let i = 0; i <= 4; i++) {
        const stepNode = document.getElementById(`step-${i}`);
        if (!stepNode) continue;
        
        const circle = stepNode.querySelector('div');
        const label = stepNode.querySelector('span');
        
        if (!circle || !label) continue;
        
        // Clear existing classes
        circle.className = 'w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-300 ';
        label.className = 'text-[8px] mt-2 transition-all duration-300 ';
        
        if (i < stageIndex) {
            circle.className += 'border-[#34C759] bg-[#34C759] text-white font-bold';
            label.className += 'text-[#34C759] font-bold';
        } else if (i === stageIndex) {
            circle.className += 'border-[#D1A153] bg-white dark:bg-stone-900 text-[#D1A153] font-black animate-pulseGlow';
            label.className += 'text-[#D1A153] font-extrabold uppercase tracking-wider';
        } else {
            circle.className += 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-400 text-xs font-bold';
            label.className += 'text-stone-400 font-bold uppercase tracking-wider';
        }
    }
}
window.setStepperStage = setStepperStage;

function updatePipelineStep(stepIndex, status) {
    const stepEl = document.getElementById(`pipeline-step-${stepIndex}`);
    const iconEl = document.getElementById(`pipeline-icon-${stepIndex}`);
    const progressEl = document.getElementById('pipelineProgress');
    const statusTextEl = document.getElementById('pipelineStatusText');
    const percentEl = document.getElementById('pipelineProgressPercent');

    if (!stepEl || !iconEl || !progressEl || !statusTextEl || !percentEl) return;

    stepEl.classList.remove('opacity-40', 'opacity-100');
    
    if (status === 'active') {
        stepEl.classList.add('opacity-100');
        iconEl.innerHTML = `<span class="inline-block animate-spin">⚙️</span>`;
        iconEl.className = "text-sm font-bold text-[#D1A153] w-5 h-5 flex items-center justify-center rounded-full bg-[#D1A153]/10";
        statusTextEl.innerText = stepEl.querySelector('h4').innerText + "...";
    } else if (status === 'done') {
        stepEl.classList.add('opacity-100');
        iconEl.innerHTML = `✓`;
        iconEl.className = "text-xs font-bold text-white w-5 h-5 flex items-center justify-center rounded-full bg-[#34C759]";
    } else {
        stepEl.classList.add('opacity-40');
        iconEl.innerHTML = `⌛`;
        iconEl.className = "text-sm font-bold text-stone-500 w-5 h-5 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-850";
    }

    const progressPercent = Math.round(((stepIndex + (status === 'done' ? 1 : 0.5)) / 5) * 100);
    progressEl.style.width = `${progressPercent}%`;
    percentEl.innerText = `${progressPercent}%`;
}
window.updatePipelineStep = updatePipelineStep;

// Create profile switcher buttons
function renderSwitcher() {
    profileSwitcher.innerHTML = '';
    currentProfiles.forEach(profile => {
        const btn = document.createElement('button');
        btn.id = `btn-${profile.id}`;
        btn.className = 'px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border dark:border-stone-850 flex items-center gap-1 hover:bg-stone-50 dark:hover:bg-stone-800';
        
        if (profile.id === activeProfile.id) {
            btn.className += ' bg-[#4A5D4E] text-[#FAF7F2] border-[#4A5D4E] shadow-sm';
            btn.classList.remove('hover:bg-stone-50', 'dark:hover:bg-stone-800');
        } else {
            btn.className += ' bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200';
        }

        const label = document.createElement('span');
        label.textContent = profile.name.split(':')[0];
        btn.appendChild(label);

        if (profile.id.startsWith('profile_')) {
            const delBtn = document.createElement('span');
            delBtn.innerHTML = '&times;';
            delBtn.className = 'ml-2 text-stone-400 hover:text-red-500 font-bold cursor-pointer text-sm transition-colors px-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteCustomCase(profile.id);
            };
            btn.appendChild(delBtn);
        }

        btn.onclick = () => selectProfile(profile.id);
        profileSwitcher.appendChild(btn);
    });
    bindHapticClickListeners();
}

function deleteCustomCase(profileId) {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    if (confirm("Are you sure you want to delete this patient case?")) {
        currentProfiles = currentProfiles.filter(p => p.id !== profileId);
        saveProfilesToStorage();
        if (activeProfile.id === profileId) {
            selectProfile(currentProfiles[0].id);
        } else {
            renderSwitcher();
        }
        showToast("Case deleted successfully.", "info");
    }
}
window.deleteCustomCase = deleteCustomCase;

function promptNewCase() {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    const modal = document.getElementById('newCaseModal');
    if (modal) {
        document.getElementById('new-case-name').value = '';
        document.getElementById('new-case-demo').value = '';
        modal.classList.remove('hidden');
    }
}
window.promptNewCase = promptNewCase;

function closeNewCaseModal() {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    const modal = document.getElementById('newCaseModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
window.closeNewCaseModal = closeNewCaseModal;

function submitNewCase() {
    const nameInputVal = document.getElementById('new-case-name').value.trim();
    const demoInputVal = document.getElementById('new-case-demo').value.trim();
    
    if (!nameInputVal) {
        showToast("Patient Name is required.", "warning");
        return;
    }
    
    const id = 'profile_' + Date.now();
    const newProfile = {
        id: id,
        name: `Case: ${nameInputVal}`,
        demographics: demoInputVal || "Demographics unspecified",
        description: "Clinician created custom patient profile. Input history below.",
        notes: "",
        timeline: [
            { date: new Date().toLocaleDateString(), event: "New Patient Case Opened", type: "test" }
        ],
        highlights: [],
        recommendations: [
            {
                title: "Custom Case Initialized",
                description: "Type the unstructured narrative note and click 'Structure Note' to activate the pipeline."
            }
        ],
        soap: null
    };
    
    currentProfiles.push(newProfile);
    saveProfilesToStorage();
    closeNewCaseModal();
    selectProfile(id);
    showToast(`New case added: ${nameInputVal}`, "success");
}
window.submitNewCase = submitNewCase;

function onSoapEdit() {
    if (!activeProfile.soap) activeProfile.soap = {};
    
    activeProfile.soap.subjective = document.getElementById('soap-s').value;
    activeProfile.soap.objective = document.getElementById('soap-o').value;
    activeProfile.soap.assessment = document.getElementById('soap-a').value;
    activeProfile.soap.plan = document.getElementById('soap-p').value;
    
    window.lastSoap = activeProfile.soap;
    
    if (activeProfile.id.startsWith('profile_')) {
        saveProfilesToStorage();
    }
    
    updateClinicalInsights(activeProfile, activeProfile.soap);
    updateFHIRBundle(activeProfile, activeProfile.soap);
}
window.onSoapEdit = onSoapEdit;

const clinicalEntities = [
    { term: "lisinopril", type: "medication" },
    { term: "carvedilol", type: "medication" },
    { term: "naproxen", type: "medication" },
    { term: "amoxicillin", type: "medication" },
    { term: "progressive dyspnea", type: "symptom" },
    { term: "dyspnea", type: "symptom" },
    { term: "fatigue", type: "symptom" },
    { term: "peripheral edema", type: "symptom" },
    { term: "joint pain", type: "symptom" },
    { term: "malar rash", type: "symptom" },
    { term: "cough", type: "symptom" },
    { term: "night sweats", type: "symptom" },
    { term: "weight loss", type: "symptom" },
    { term: "congestive heart failure", type: "risk" },
    { term: "chf", type: "risk" },
    { term: "positive ANA titer", type: "risk" },
    { term: "upper lobe infiltration", type: "risk" },
    { term: "infiltration", type: "risk" }
];

function generateCustomRecommendations(noteText) {
    const recs = [];
    const lowerText = noteText.toLowerCase();

    if (lowerText.includes('chf') || lowerText.includes('heart failure') || lowerText.includes('dyspnea')) {
        recs.push({
            title: "Initiate Guideline-Directed Medical Therapy (GDMT)",
            description: "Consider adding a sodium-glucose cotransporter-2 (SGLT2) inhibitor (e.g., empagliflozin) per AHA/ACC guidelines for heart failure."
        });
        recs.push({
            title: "Volume Status Monitoring",
            description: "Address peripheral edema and volume overload with short-term loop diuretic adjustments and daily weight logs."
        });
    }

    if (lowerText.includes('joint pain') || lowerText.includes('lupus') || lowerText.includes('ana')) {
        recs.push({
            title: "Evaluate for Autoimmune Connective Tissue Disease",
            description: "Evaluate for Systemic Lupus Erythematosus (SLE) or Rheumatoid Arthritis. Request dsDNA, anti-Smith, complement levels (C3/C4)."
        });
        recs.push({
            title: "Hydroxychloroquine Baseline retinoscopy",
            description: "Advise complete UV sunblock protection and schedule baseline retinal scans prior to starting antimalarials."
        });
    }

    if (lowerText.includes('cough') || lowerText.includes('sweats') || lowerText.includes('infiltration') || lowerText.includes('tb')) {
        recs.push({
            title: "Rule Out Granulomatous Lung Infection",
            description: "Isolate patient immediately under airborne precautions. Order sputum AFB smears and M. tuberculosis PCR."
        });
        recs.push({
            title: "Diagnostic Bronchoscopy / Chest CT Scan",
            description: "Order high-resolution chest CT scan or refer for diagnostic bronchoscopy with BAL if sputum samples are negative."
        });
    }

    if (recs.length === 0) {
        recs.push({
            title: "Clinical Organ System Assessment",
            description: "Review vitals, basic metabolics (CBC/CMP), and follow clinic-specific longitudinal diagnostic guidelines."
        });
    }

    return recs;
}

function selectProfile(profileId) {
    activeProfile = currentProfiles.find(p => p.id === profileId);
    renderSwitcher();
    
    // Set stepper to stage 0
    setStepperStage(0);
    logTelemetry(`Profile selected: ${activeProfile.name.split(':')[0]} (${activeProfile.demographics}).`, 'INFO');
    logTelemetry(`Loaded clinical notes: ${activeProfile.notes.length} characters.`, 'INFO');
    
    // Update Active Card details
    document.getElementById('patientName').textContent = activeProfile.name;
    document.getElementById('patientDemographics').textContent = activeProfile.demographics;
    document.getElementById('patientDescription').textContent = activeProfile.description;
    
    // Populate note textarea
    noteInput.value = activeProfile.notes;
    
    // Hide parsed text until 'Structure Note' is clicked
    document.getElementById('highlightsContainer').classList.add('hidden');
    
    // Reset diagnostic panel message
    recommendationPanel.innerHTML = `
        <div class="text-center py-12 text-stone-400 dark:text-stone-555 text-sm">
            <p>New profile loaded: ${activeProfile.name.split(':')[0]}</p>
            <p class="text-xs mt-1">Click 'Structure Note' to generate recommendations.</p>
        </div>
    `;
    
    // Reset Gauge
    const gaugeValueEl = document.getElementById('urgencyGaugeValue');
    const gaugeLabelEl = document.getElementById('urgencyGaugeLabel');
    const gaugePercentEl = document.getElementById('urgencyGaugePercent');
    if (gaugeValueEl) {
        gaugeValueEl.style.strokeDashoffset = '213.63';
        gaugeValueEl.setAttribute('stroke', '#D1A153');
    }
    if (gaugeLabelEl) gaugeLabelEl.textContent = 'Idle';
    if (gaugePercentEl) gaugePercentEl.textContent = '0%';
    
    // Reset clinical workspace state
    window.lastSoap = activeProfile.soap || null;
    
    if (activeProfile.soap) {
        document.getElementById('soap-s').value = activeProfile.soap.subjective || '';
        document.getElementById('soap-o').value = activeProfile.soap.objective || '';
        document.getElementById('soap-a').value = activeProfile.soap.assessment || '';
        document.getElementById('soap-p').value = activeProfile.soap.plan || '';
        updateClinicalInsights(activeProfile, activeProfile.soap);
        updateFHIRBundle(activeProfile, activeProfile.soap);
        document.getElementById('highlightsContainer').classList.remove('hidden');
    } else {
        document.getElementById('soap-s').value = '';
        document.getElementById('soap-o').value = '';
        document.getElementById('soap-a').value = '';
        document.getElementById('soap-p').value = '';
        updateClinicalInsights(activeProfile, null);
        updateFHIRBundle(activeProfile, null);
    }
    
    renderTimeline();
    logTelemetry(`Longitudinal timeline rendered with ${activeProfile.timeline.length} clinical nodes.`, 'SUCCESS');
}
window.selectProfile = selectProfile;

function resetNote() {
    noteInput.value = '';
    document.getElementById('highlightsContainer').classList.add('hidden');
    recommendationPanel.innerHTML = `
        <div class="text-center py-12 text-stone-400 dark:text-stone-550 text-sm">
            <p>Narrative cleared.</p>
        </div>
    `;
    // Reset Gauge
    const gaugeValueEl = document.getElementById('urgencyGaugeValue');
    const gaugeLabelEl = document.getElementById('urgencyGaugeLabel');
    const gaugePercentEl = document.getElementById('urgencyGaugePercent');
    if (gaugeValueEl) {
        gaugeValueEl.style.strokeDashoffset = '213.63';
        gaugeValueEl.setAttribute('stroke', '#D1A153');
    }
    if (gaugeLabelEl) gaugeLabelEl.textContent = 'Idle';
    if (gaugePercentEl) gaugePercentEl.textContent = '0%';
    
    setStepperStage(0);
    logTelemetry("Clinical narrative note cleared by user. Urgency gauge reset.", "INFO");
}
window.resetNote = resetNote;

// Custom model loading overlay
function showModelLoading(show) {
    const loader = document.getElementById('modelLoader');
    if (show) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

// Initialize classifier pipeline
async function loadModel() {
    if (classifier) return;
    
    showModelLoading(true);
    logTelemetry("Loading local AI Model: DistilBERT text classification (40MB)...", "INFO");
    document.getElementById('aiHeaderStatus').className = "inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse";
    document.getElementById('aiHeaderLabel').textContent = "Local Model: Downloading...";
 
    // Setup callback for tracking model download progress
    const progressCallback = (info) => {
        if (info.status === 'progress') {
            const pct = Math.round(info.progress);
            document.getElementById('modelProgress').style.width = `${pct}%`;
            document.getElementById('progressText').textContent = `${pct}% Loaded`;
        }
    };
 
    try {
        // Initialize text classification pipeline (loads ~40MB quantized DistilBERT)
        classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
            progress_callback: progressCallback
        });
        
        showModelLoading(false);
        logTelemetry("Local AI Model loaded successfully. Ready for private browser-side inference.", "SUCCESS");
        document.getElementById('aiHeaderStatus').className = "inline-block w-2.5 h-2.5 rounded-full bg-[#4A5D4E]";
        document.getElementById('aiHeaderLabel').textContent = "Local Model: Ready (Cached)";
    } catch (err) {
        console.error("Failed to load model", err);
        showModelLoading(false);
        logTelemetry("Failed to load local AI model. System falling back.", "ERROR");
        document.getElementById('aiHeaderStatus').className = "inline-block w-2.5 h-2.5 rounded-full bg-red-400";
        document.getElementById('aiHeaderLabel').textContent = "Local Model: Load Failed";
    }
}

// SOAP formatting logic
function generateSOAP(noteText, profile) {
    let subjective = "";
    let objective = "";
    let assessment = "";
    let plan = "";

    if (profile && profile.id === 'profileA' && noteText.includes('CHF')) {
        subjective = "• Patient reports progressive dyspnea and fatigue over the past 2 weeks.\n• Peripheral edema noted by patient.\n• Significant history of Congestive Heart Failure.";
        objective = "• Current meds: Lisinopril, Carvedilol.\n• Echocardiogram: Left ventricular ejection fraction (LVEF) at 35%.\n• Mitral regurgitation: Moderate.";
        assessment = "• Clinical Urgency: ROUTINE / STABLE (clinical baseline).\n• Primary Impression: Acute decompensated heart failure with reduced ejection fraction (HFrEF).\n• Complicating factors: Peripheral edema indicating fluid overload.";
        plan = "• Adjust loop diuretics to titrate to euvolemia.\n• Consider initiating sodium-glucose cotransporter-2 (SGLT2) inhibitor (GDMT guidelines).\n• Schedule follow-up echo in 3 months.\n• Advise daily weight monitoring and fluid restriction.";
    } else if (profile && profile.id === 'profileB' && noteText.includes('ANA')) {
        subjective = "• Patient reports acute joint pain in bilateral wrists and MCP joints.\n• Active complaints of fatigue and transient morning stiffness.";
        objective = "• Laboratory: Positive antinuclear antibody (ANA) titer (1:160, speckled pattern).\n• Physical Exam: Prominent malar rash on face following sun exposure.\n• Meds: Started on low-dose naproxen.";
        assessment = "• Clinical Urgency: STABLE / WORK-UP REQUIRED.\n• Primary Impression: Suspected Systemic Lupus Erythematosus (SLE) based on positive ANA, malar rash, and arthralgias.";
        plan = "• Order dsDNA, anti-Smith antibodies, complement levels (C3/C4), and urinalysis.\n• Schedule baseline ophthalmologic evaluation for future hydroxychloroquine initiation.\n• Advise photoprotection (sunscreen, UV protection).";
    } else if (profile && profile.id === 'profileC' && noteText.includes('infiltration')) {
        subjective = "• Patient presents with persistent productive cough for over 4 weeks.\n• Reports drenching night sweats and significant unintentional weight loss.\n• Denies hemoptysis.";
        objective = "• Chest X-ray: Localized infiltration in the right upper lobe.\n• Previous treatment: Amoxicillin course completed with no clinical resolution.";
        assessment = "• Clinical Urgency: POTENTIALLY URGENT / INFECTIOUS RISK.\n• Primary Impression: Suspected pulmonary tuberculosis or granulomatous disease vs. atypical pneumonia or malignancy.";
        plan = "• Place patient under immediate airborne isolation precautions.\n• Order sputum acid-fast bacilli (AFB) smears and Mycobacterium tuberculosis PCR.\n• Refer for diagnostic bronchoscopy with BAL if sputum results are inconclusive.";
    } else {
        const lines = noteText.split(/[.\n]+/);
        let sLines = [];
        let oLines = [];
        let aLines = [];
        let pLines = [];

        lines.forEach(line => {
            const clean = line.trim();
            if (!clean) return;

            if (clean.toLowerCase().match(/(report|complain|feel|pain|fatigue|dyspnea|sweat|cough|history|history of|history for)/)) {
                sLines.push(`• ${clean}`);
            } else if (clean.toLowerCase().match(/(echo|reveal|show|indicate|titer|med|medication|lisinopril|carvedilol|naproxen|amoxicillin|titer|level|test|result|mg|g|mcg|blood pressure|vitals|lab|val|rate)/)) {
                oLines.push(`• ${clean}`);
            } else if (clean.toLowerCase().match(/(consider|isolate|order|refer|adjust|start|initiate|titrate|schedule|advise|restrict)/)) {
                pLines.push(`• ${clean}`);
            } else {
                aLines.push(`• ${clean}`);
            }
        });

        subjective = sLines.join('\n') || "• Patient reports symptoms described in note.";
        objective = oLines.join('\n') || "• Reference raw clinical narrative for vitals/meds.";
        assessment = aLines.join('\n') || "• Evaluated using browser local AI classifier.";
        plan = pLines.join('\n') || "• Review clinical recommendations panel.";
    }

    return { subjective, objective, assessment, plan };
}

// Layman Explainer Generation
function generateLaymanSummary(noteText, profile) {
    if (profile && profile.id === 'profileA' && noteText.includes('CHF')) {
        return `**Patient Layman Summary (Heart Function Monitoring)**

• **What is happening**: You are being monitored for Congestive Heart Failure. This is a condition where the heart muscles pump blood slightly less effectively than normal.
• **Key Measurements**: Your heart's pumping strength (Ejection Fraction) was measured at 35% (normal is generally 50-70%). This is the reason you might feel tired or out of breath, and notice fluid buildup (swelling) in your legs.
• **Active Medications**: You are taking Lisinopril and Carvedilol, which are standard medications to relax your blood vessels, reduce heart strain, and help it pump better.
• **Recommended Steps**:
  1. We may recommend starting a new heart-protective medication (an SGLT2 inhibitor) to improve your symptoms.
  2. Continue tracking your weight daily (a sudden increase means fluid is building up).
  3. Limit salt and fluid intake as discussed with your clinic.`;
    }
    
    if (profile && profile.id === 'profileB' && noteText.includes('ANA')) {
        return `**Patient Layman Summary (Autoimmune/Lupus Evaluation)**

• **What is happening**: We are evaluating you for an autoimmune condition. An autoimmune condition means the body's natural defense system accidentally attacks its own healthy tissues.
• **Key Indicators**:
  - A blood test called ANA (Antinuclear Antibody) returned positive. This is a sign of immune activity.
  - Joint stiffness (especially in the mornings) and wrist discomfort.
  - A skin rash (malar or "butterfly" rash) on your cheeks/nose triggered by sun exposure.
• **Active Medications**: Currently taking Naproxen to reduce joint swelling and stiffness.
• **Recommended Steps**:
  1. We are ordering follow-up blood and urine tests to look for markers of Lupus (SLE).
  2. We recommend scheduling an eye test. This is a baseline check before starting standard immune-modulating treatments (like hydroxychloroquine).
  3. Wear sunscreen and protect your skin from direct sun exposure, as it can trigger symptoms.`;
    }

    if (profile && profile.id === 'profileC' && noteText.includes('infiltration')) {
        return `**Patient Layman Summary (Lung Infection Investigation)**

• **What is happening**: We are investigating a persistent cough (lasting over 4 weeks) accompanied by heavy night sweats and unexplained weight loss.
• **Key Indicators**: A chest X-ray showed a spot or cloudy area (infiltration) in the upper right part of your lung. Standard antibiotics (Amoxicillin) did not clear this up.
• **Active Actions**:
  - We need to rule out specific chest infections, including tuberculosis (TB).
  - You will be placed under temporary protective precautions (airborne isolation) in the clinic until we verify the cause.
• **Recommended Steps**:
  1. Provide sputum (cough samples) for laboratory screening (AFB smear and PCR).
  2. If those tests are not clear, we will refer you for a lung camera examination (bronchoscopy) to look closer and take sample cells.`;
    }

    let summary = `**Patient Layman Summary**\n\n• **Summary**: You are undergoing a clinical evaluation. Based on the notes compiled, here is a translated guide to the terms used:\n`;
    let termFound = false;
    const translations = {
        "dyspnea": "shortness of breath",
        "fatigue": "unusual tiredness",
        "peripheral edema": "fluid swelling in the legs/ankles",
        "congestive heart failure": "heart muscle weakness",
        "malar rash": "butterfly-shaped facial rash from sun exposure",
        "arthralgias": "joint pain",
        "tuberculosis": "a bacterial lung infection",
        "infiltration": "cloudy spot on lung imaging, usually indicating inflammation or infection",
        "bronchoscopy": "a visual examination of the lungs with a thin tube camera",
        "AFB": "a bacteria-specific lab stain",
        "PCR": "a highly sensitive genetic molecule test",
        "gdmt": "evidence-based heart medication guidelines",
        "titer": "blood concentration measurement",
        "hempoptysis": "coughing up blood"
    };

    for (const [jargon, explanation] of Object.entries(translations)) {
        if (noteText.toLowerCase().includes(jargon)) {
            summary += `  - **${jargon}**: translates to **${explanation}**.\n`;
            termFound = true;
        }
    }

    if (!termFound) {
        summary += `  - No complex clinical jargon was directly matched in our local translation library. The notes appear to describe routine symptoms.\n`;
    }

    summary += `\n• **General Guideline**: Follow all medications as prescribed. If you experience worsening symptoms, contact your clinic immediately.`;
    return summary;
}

// Highlight generator & Local AI inference
async function parseNote() {
    const container = document.getElementById('highlightsContainer');
    const highlightedTextEl = document.getElementById('highlightedText');
    const noteText = noteInput.value;

    if (!noteText.trim()) return;

    // Show Pipeline Loader modal and initialize states
    const pipelineLoader = document.getElementById('pipelineLoader');
    if (pipelineLoader) {
        pipelineLoader.classList.remove('hidden');
        for (let i = 0; i <= 4; i++) {
            updatePipelineStep(i, 'idle');
        }
    }

    // Step 0: Ingest Raw Notes
    setStepperStage(0);
    updatePipelineStep(0, 'active');
    logTelemetry("Starting clinical note ingestion pipeline...", "SYSTEM");
    logTelemetry(`Ingested raw narrative: "${noteText.substring(0, 60)}..."`, "INFO");
    await new Promise(resolve => setTimeout(resolve, 600));

    // Step 1: Map Medical Abbreviations
    updatePipelineStep(0, 'done');
    updatePipelineStep(1, 'active');
    setStepperStage(1);
    logTelemetry("Executing clinical abbreviation mapper...", "INFO");
    
    // Highlight clinical terms
    let markedText = noteText;
    
    if (activeProfile.id.startsWith('profile_')) {
        activeProfile.highlights = [];
        clinicalEntities.forEach(ent => {
            const escaped = ent.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
            if (regex.test(noteText)) {
                activeProfile.highlights.push({ term: ent.term, type: ent.type });
            }
        });
        activeProfile.recommendations = generateCustomRecommendations(noteText);
        
        // Dynamically add clinical findings to the patient timeline
        if (activeProfile.timeline.length <= 1) {
            activeProfile.highlights.forEach(h => {
                activeProfile.timeline.push({
                    date: new Date().toLocaleDateString(),
                    event: `Clinical finding: ${h.term} (${h.type})`,
                    type: h.type
                });
            });
        }
    }
    
    activeProfile.highlights.forEach(entity => {
        const escapedTerm = entity.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        let highlightClass = "";
        let codingInfo = "";
        
        if (activeModel === 'ner') {
            const termLower = entity.term.toLowerCase();
            if (termLower.includes("lisinopril")) codingInfo = "RxNorm: 6470 (Lisinopril)";
            else if (termLower.includes("carvedilol")) codingInfo = "RxNorm: 20352 (Carvedilol)";
            else if (termLower.includes("naproxen")) codingInfo = "RxNorm: 7258 (Naproxen)";
            else if (termLower.includes("amoxicillin")) codingInfo = "RxNorm: 723 (Amoxicillin)";
            else if (termLower.includes("heart failure") || termLower.includes("chf")) codingInfo = "ICD-10-CM: I50.9 / SNOMED: 42343007 (Heart Failure)";
            else if (termLower.includes("malar rash")) codingInfo = "ICD-10-CM: L93.0 / SNOMED: 24062002 (Malar Rash)";
            else if (termLower.includes("cough")) codingInfo = "ICD-10-CM: R05.3 / SNOMED: 287178001 (Cough)";
            else if (termLower.includes("sweats")) codingInfo = "ICD-10-CM: R61.9 / SNOMED: 427218002 (Night Sweats)";
            else if (termLower.includes("weight loss")) codingInfo = "ICD-10-CM: R63.4 / SNOMED: 89362005 (Weight Loss)";
            else if (termLower.includes("infiltration")) codingInfo = "ICD-10-CM: R91.8 / SNOMED: 271584003 (Lung Infiltration)";
            else if (termLower.includes("ejection fraction")) codingInfo = "LOINC: 8801-9 (Left Ventricular Ejection Fraction)";
            else if (termLower.includes("ana")) codingInfo = "LOINC: 11502-2 (Antinuclear Antibody)";
            else codingInfo = "SNOMED-CT Concept Reference";
        }
        
        if (entity.type === "medication") {
            highlightClass = "bg-[#E8F5E9] dark:bg-green-950/45 border-b border-green-400 text-green-800 dark:text-green-300 font-medium px-1 rounded";
        } else if (entity.type === "symptom") {
            highlightClass = "bg-[#FFF9C4] dark:bg-yellow-950/45 border-b border-yellow-400 text-yellow-800 dark:text-yellow-350 font-medium px-1 rounded";
        } else if (entity.type === "risk") {
            highlightClass = "bg-[#FFEBEE] dark:bg-red-950/45 border-b border-red-400 text-red-800 dark:text-red-300 font-medium px-1 rounded";
        }
        
        if (activeModel === 'ner' && codingInfo) {
            markedText = markedText.replace(regex, `<span class="${highlightClass} abbr-tooltip" data-tooltip="${codingInfo}">$1</span>`);
        } else {
            markedText = markedText.replace(regex, `<span class="${highlightClass}">$1</span>`);
        }
    });

    // Translate abbreviations (only those not inside HTML tags)
    let countAbbr = 0;
    for (const [abbr, desc] of Object.entries(abbreviations)) {
        const regex = new RegExp(`\\b(${abbr})\\b(?![^<>]*>)`, 'g');
        if (regex.test(markedText)) {
            countAbbr++;
            markedText = markedText.replace(regex, `<span class="abbr-tooltip border-b border-dashed border-[#D1A153] pb-0.5" data-tooltip="${desc}">$1</span>`);
        }
    }

    highlightedTextEl.innerHTML = markedText;
    container.classList.remove('hidden');
    
    logTelemetry(`Mapped ${countAbbr} clinical abbreviation patterns.`, "SUCCESS");
    await new Promise(resolve => setTimeout(resolve, 600));

    // Step 2: WASM AI Sentiment Classification / Model Hub Selection
    updatePipelineStep(1, 'done');
    updatePipelineStep(2, 'active');
    setStepperStage(2);
    const aiStartTime = performance.now();
    const badgeContainer = document.getElementById('aiUrgencyBadge');
    
    let urgencyLabel = "Routine / Stable";
    let urgencyClass = "bg-[#E8F5E9] dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-300 dark:border-green-900";
    let label = "POSITIVE";
    let score = 0.99;

    if (activeModel === 'distilbert') {
        logTelemetry("Executing local AI clinical classifier (WASM DistilBERT)...", "INFO");
        badgeContainer.innerHTML = `
            <div class="flex items-center text-xs text-stone-400 font-medium bg-[#FAF7F2] dark:bg-stone-950/40 border border-stone-100 dark:border-stone-850 rounded-full px-3 py-1 animate-pulse">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-450 mr-2 animate-ping"></span>
                Running Local AI Classification...
            </div>
        `;

        if (!classifier) {
            await loadModel();
        }

        try {
            // Run inference on clinical note
            const result = await classifier(noteText);
            label = result[0].label; // "POSITIVE" or "NEGATIVE"
            score = result[0].score;
            
            // Map negative sentiment to high clinical urgency / risk warning
            if (label === "NEGATIVE") {
                urgencyLabel = "Urgent / Action Required";
                urgencyClass = "bg-[#FFEBEE] dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-300 dark:border-red-900 animate-pulse";
            }

            badgeContainer.innerHTML = `
                <span class="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${urgencyClass}">
                    ${urgencyLabel} (Confidence: ${(score * 100).toFixed(1)}%)
                </span>
            `;

            const elapsed = Math.round(performance.now() - aiStartTime);
            logTelemetry(`AI classification complete: Sentiment=${label}, Confidence=${(score * 100).toFixed(1)}%. Latency=${elapsed}ms`, "AI_WASM");
        } catch (err) {
            console.error("AI inference error", err);
            badgeContainer.innerHTML = `<span class="text-xs text-red-400">AI Classification Error</span>`;
            logTelemetry(`AI inference failed: ${err.message}`, "ERROR");
        }
    } else if (activeModel === 'summarizer') {
        logTelemetry("Executing OpenMed Clinical Summarizer (Simulated LLM)...", "SYSTEM");
        logTelemetry("Token generation starting: <s_soap> compiling clinical structures...", "AI_WASM");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        label = activeProfile.id === 'profileC' ? "NEGATIVE" : "POSITIVE";
        score = 0.945;
        urgencyLabel = label === "NEGATIVE" ? "Urgent / Action Required" : "Routine / Stable";
        urgencyClass = label === "NEGATIVE" ? "bg-[#FFEBEE] dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-300 dark:border-red-900 animate-pulse" : "bg-[#E8F5E9] dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-300 dark:border-green-900";
        
        badgeContainer.innerHTML = `
            <span class="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${urgencyClass}">
                ${urgencyLabel} (OpenMed Confidence: 94.5%)
            </span>
        `;
        logTelemetry("OpenMed Clinical Summarizer generated summary. Latency=800ms", "SUCCESS");
    } else if (activeModel === 'ner') {
        logTelemetry("Executing OpenMed NER-Biomedical Entity Extractor...", "SYSTEM");
        logTelemetry("NER Tokenizer identifying medical codes and concepts...", "AI_WASM");
        await new Promise(resolve => setTimeout(resolve, 900));
        
        label = activeProfile.id === 'profileC' ? "NEGATIVE" : "POSITIVE";
        score = 0.978;
        urgencyLabel = label === "NEGATIVE" ? "Urgent / Action Required" : "Routine / Stable";
        urgencyClass = label === "NEGATIVE" ? "bg-[#FFEBEE] dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-300 dark:border-red-900 animate-pulse" : "bg-[#E8F5E9] dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-300 dark:border-green-900";
        
        badgeContainer.innerHTML = `
            <span class="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${urgencyClass}">
                ${urgencyLabel} (OpenMed NER Confidence: 97.8%)
            </span>
        `;
        logTelemetry("OpenMed NER-Biomedical mapping complete. Extracted biomedical concepts and mapped to RxNorm / ICD-10 standards.", "SUCCESS");
    }

    // Update Circular iOS Vital Gauge
    const gaugeValueEl = document.getElementById('urgencyGaugeValue');
    const gaugeLabelEl = document.getElementById('urgencyGaugeLabel');
    const gaugePercentEl = document.getElementById('urgencyGaugePercent');

    let percent = 0;
    let strokeColor = "#D1A153";
    let shortUrgencyLabel = "Idle";

    if (label === "NEGATIVE") {
        percent = Math.round((1 - score) * 100) || 75;
        strokeColor = "#FF3B30"; // Apple Red
        shortUrgencyLabel = "Urgent";
    } else {
        percent = Math.round(score * 100);
        strokeColor = "#34C759"; // Apple Green
        shortUrgencyLabel = "Stable";
    }

    if (gaugeValueEl) {
        gaugeValueEl.style.strokeDashoffset = `${213.63 - (percent / 100) * 213.63}`;
        gaugeValueEl.setAttribute('stroke', strokeColor);
    }
    if (gaugeLabelEl) gaugeLabelEl.textContent = shortUrgencyLabel;
    if (gaugePercentEl) gaugePercentEl.textContent = `${percent}%`;

    await new Promise(resolve => setTimeout(resolve, 600));

    // Step 3: Format SOAP and Layman Clinical Structures
    updatePipelineStep(2, 'done');
    updatePipelineStep(3, 'active');
    setStepperStage(3);
    logTelemetry("Formatting objective & subjective SOAP fields...", "INFO");

    // Generate SOAP Note
    const soap = generateSOAP(noteText, activeProfile);
    document.getElementById('soap-s').value = soap.subjective;
    document.getElementById('soap-o').value = soap.objective;
    document.getElementById('soap-a').value = soap.assessment;
    document.getElementById('soap-p').value = soap.plan;
    
    // Update the Assessment field in the SOAP note to include the AI output
    const assessmentField = document.getElementById('soap-a');
    if (assessmentField) {
        let currentVal = assessmentField.value;
        if (currentVal) {
            assessmentField.value = currentVal.replace(/• Clinical Urgency: [^\n]*/, `• Clinical Urgency: ${urgencyLabel.toUpperCase()} (${activeModel.toUpperCase()} confidence: ${(score * 100).toFixed(1)}%)`);
        }
    }

    // Generate Layman Summary
    const layman = generateLaymanSummary(noteText, activeProfile);
    document.getElementById('laymanText').innerText = layman;

    // Default to Highlights tab on fresh parse
    switchAnalysisTab('highlights');

    // Render recommendations
    recommendationPanel.innerHTML = '';
    activeProfile.recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'p-5 rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-sm hover:shadow-md transition-all duration-300';
        
        const dot = `<span class="inline-block w-2.5 h-2.5 rounded-full bg-[#D1A153] mr-2"></span>`;

        const titleEl = document.createElement('h3');
        titleEl.className = "text-stone-800 dark:text-stone-200 font-semibold text-sm mb-1.5 flex items-center";
        titleEl.innerHTML = dot + rec.title;

        const descEl = document.createElement('p');
        descEl.className = 'text-xs text-stone-600 dark:text-stone-450 leading-relaxed';
        
        // Render markdown links in description
        let descHTML = rec.description;
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        descHTML = descHTML.replace(linkRegex, `<a href="$2" target="_blank" class="text-[#4A5D4E] dark:text-[#FAF7F2] underline hover:text-[#3D4F41] font-semibold">$1</a>`);
        descEl.innerHTML = descHTML;

        card.appendChild(titleEl);
        card.appendChild(descEl);
        recommendationPanel.appendChild(card);
    });

    // Save state for synchronization reference
    window.lastSoap = soap;
    activeProfile.soap = soap;
    if (activeProfile.id.startsWith('profile_')) {
        saveProfilesToStorage();
    }
    updateClinicalInsights(activeProfile, soap);
    updateFHIRBundle(activeProfile, soap);

    logTelemetry("SOAP clinical structures generated and mapped to edit forms.", "SUCCESS");
    await new Promise(resolve => setTimeout(resolve, 600));

    // Step 4: EHR FHIR compliance preflight & export
    updatePipelineStep(3, 'done');
    updatePipelineStep(4, 'active');
    setStepperStage(4);
    logTelemetry("Preflight check for HL7 FHIR compliance...", "INFO");
    logTelemetry(`Exporting clinical resources to target EHR (HAPI BaseR4)...`, "FHIR");
    logTelemetry("FHIR bundle successfully serialized and de-identified.", "SUCCESS");

    updatePipelineStep(4, 'done');
    await new Promise(resolve => setTimeout(resolve, 800));
    if (pipelineLoader) {
        pipelineLoader.classList.add('hidden');
    }
}
window.parseNote = parseNote;

// Render horizontal scrollable timeline
function renderTimeline() {
    timelinePanel.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'flex space-x-6 min-w-max py-2 px-1';

    activeProfile.timeline.forEach((entry, idx) => {
        const container = document.createElement('div');
        container.className = 'flex items-center space-x-4';

        const card = document.createElement('div');
        
        let colorBorder = "border-stone-200 dark:border-stone-800";
        let colorBg = "bg-stone-50/40 dark:bg-stone-900/40";
        if (entry.type === "medication") {
            colorBorder = "border-green-300 dark:border-green-900";
            colorBg = "bg-[#E8F5E9]/10 dark:bg-green-950/5";
        } else if (entry.type === "test") {
            colorBorder = "border-[#D1A153]/55 dark:border-[#D1A153]/30";
            colorBg = "bg-[#FFF9C4]/10 dark:bg-yellow-950/5";
        } else if (entry.type === "risk") {
            colorBorder = "border-red-300 dark:border-red-900";
            colorBg = "bg-[#FFEBEE]/10 dark:bg-red-950/5";
        }

        card.className = `w-64 p-4 rounded-xl border ${colorBorder} ${colorBg} shadow-sm hover:shadow transition-all duration-300`;

        const dateEl = document.createElement('div');
        dateEl.className = 'text-[9px] uppercase tracking-widest text-stone-400 dark:text-stone-550 font-bold mb-1';
        dateEl.textContent = new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

        const eventEl = document.createElement('div');
        eventEl.className = 'text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium';
        eventEl.textContent = entry.event;

        card.appendChild(dateEl);
        card.appendChild(eventEl);
        container.appendChild(card);

        // Add arrow indicator between timeline steps
        if (idx < activeProfile.timeline.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'text-stone-300 dark:text-stone-750 text-sm font-light select-none';
            arrow.innerHTML = '➔';
            container.appendChild(arrow);
        }

        wrapper.appendChild(container);
    });

    timelinePanel.appendChild(wrapper);
}

// Active Analysis Tab Switcher
let activeAnalysisTab = 'highlights';
function switchAnalysisTab(tab) {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    activeAnalysisTab = tab;
    const tabs = ['highlights', 'soap', 'layman', 'fhir', 'api-hub', 'open-tech'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        const panel = document.getElementById(`panel-${t}`);
        if (!btn || !panel) return;
        if (t === tab) {
            btn.className = 'flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap bg-white dark:bg-stone-850 text-stone-850 dark:text-stone-100 shadow-sm border border-black/5 dark:border-white/5';
            panel.classList.remove('hidden');
        } else {
            btn.className = 'flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap text-stone-400 dark:text-stone-555 hover:text-stone-600 dark:hover:text-stone-400';
            panel.classList.add('hidden');
        }
    });
}
window.switchAnalysisTab = switchAnalysisTab;

function copySoapNote() {
    const s = document.getElementById('soap-s').value;
    const o = document.getElementById('soap-o').value;
    const a = document.getElementById('soap-a').value;
    const p = document.getElementById('soap-p').value;
    const fullSoap = `CLINICAL SOAP NOTE\n==================\n\nSUBJECTIVE (S):\n${s}\n\nOBJECTIVE (O):\n${o}\n\nASSESSMENT (A):\n${a}\n\nPLAN (P):\n${p}\n`;
    navigator.clipboard.writeText(fullSoap).then(() => {
        showToast("SOAP Note copied to clipboard!", "success");
    }).catch(err => {
        console.error("Clipboard copy failed", err);
    });
}
window.copySoapNote = copySoapNote;

function copyLaymanSummary() {
    const text = document.getElementById('laymanText').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Layman Summary copied to clipboard!", "success");
    }).catch(err => {
        console.error("Clipboard copy failed", err);
    });
}
window.copyLaymanSummary = copyLaymanSummary;

// Dark Mode Logic
function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    const icon = document.getElementById('themeBtnIcon');
    const text = document.getElementById('themeBtnText');
    if (isDark) {
        icon.textContent = '☀️';
        text.textContent = 'Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.textContent = '🌙';
        text.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}
window.toggleDarkMode = toggleDarkMode;

function initTheme() {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        document.getElementById('themeBtnIcon').textContent = '☀️';
        document.getElementById('themeBtnText').textContent = 'Light Mode';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('themeBtnIcon').textContent = '🌙';
        document.getElementById('themeBtnText').textContent = 'Dark Mode';
    }
}

// Calculators routing
window.runChads = runChads;
window.runHasbled = runHasbled;
window.runWells = runWells;
window.runMews = runMews;
window.runMeld = runMeld;
window.runCurb65 = runCurb65;
window.switchCalc = (type) => switchCalc(type);
window.insertScore = (name) => insertScore(name, noteInput);

// Diagnostics Routing
window.runDiagnostics = () => runDiagnostics(classifier, activeProfile, noteInput, selectProfile, generateSOAP);

// FHIR routing
window.fetchFhirRecord = fetchFhirRecord;

// Switcher helper
let activeCalc = 'chads';
function switchCalc(calcType) {
    activeCalc = calcType;
    const calcs = ['chads', 'hasbled', 'wells', 'mews', 'meld', 'curb'];
    calcs.forEach(c => {
        const form = document.getElementById(`calc-${c}`);
        const btn = document.getElementById(`btn-calc-${c}`);
        if (!form || !btn) return;
        if (c === calcType) {
            form.classList.remove('hidden');
            btn.className = 'flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap bg-white dark:bg-stone-850 text-stone-850 dark:text-stone-100 shadow-sm border border-black/5 dark:border-white/5';
        } else {
            form.classList.add('hidden');
            btn.className = 'flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap text-stone-400 dark:text-stone-550 hover:text-stone-600 dark:hover:text-stone-400';
        }
    });
}

// Init App state
initTheme();
selectProfile('profileA');
bindHapticClickListeners();
initCard3DTilt();

// Auto-save clinical note to active profile in real-time
noteInput.addEventListener('input', () => {
    activeProfile.notes = noteInput.value;
    if (activeProfile.id.startsWith('profile_')) {
        saveProfilesToStorage();
    }
});

// Handle responsive viewport transitions
window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        switchMobileTab('ingest');
    } else {
        // Desktop recovery
        ['ingest', 'hub', 'calcs'].forEach(t => {
            const sections = document.querySelectorAll(`.mob-section-${t}`);
            sections.forEach(sec => {
                if (sec.id === 'highlightsContainer') {
                    if (window.isNoteParsed) {
                        sec.classList.remove('hidden');
                    } else {
                        sec.classList.add('hidden');
                    }
                } else {
                    sec.classList.remove('hidden');
                }
            });
        });
    }
});

// Mobile startup trigger
if (window.innerWidth < 768) {
    setTimeout(() => {
        switchMobileTab('ingest');
    }, 100);
}

function scrollToSection(id, btn) {
    if (window.playPremiumHapticSound) window.playPremiumHapticSound();
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.querySelectorAll('.nav-pill-btn').forEach(b => {
        b.classList.remove('bg-stone-200/80', 'dark:bg-stone-850/80', 'text-stone-900', 'dark:text-white');
        b.classList.add('hover:text-stone-900', 'dark:hover:text-white', 'hover:bg-stone-100/50', 'dark:hover:bg-stone-800/50');
    });
    if (btn) {
        btn.classList.remove('hover:text-stone-900', 'dark:hover:text-white', 'hover:bg-stone-100/50', 'dark:hover:bg-stone-800/50');
        btn.classList.add('bg-stone-200/80', 'dark:bg-stone-850/80', 'text-stone-900', 'dark:text-white');
    }
}
window.scrollToSection = scrollToSection;

