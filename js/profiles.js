export const profiles = [
    {
        id: 'profileA',
        name: 'Profile A: Cardiac Care',
        demographics: '62yo M • CHF History',
        description: 'A 62-year-old male presenting with progressive dyspnea and fatigue. Echo reveals reduced ejection fraction (EF 35%).',
        notes: 'Patient reports progressive dyspnea and fatigue over the past 2 weeks. Marked by peripheral edema. Past medical history is significant for congestive heart failure. Current medications include lisinopril and carvedilol. Echocardiogram showed left ventricular ejection fraction at 35% with moderate mitral regurgitation.',
        timeline: [
            { date: "2025/12/01", event: "Lisinopril dose adjusted due to microalbuminuria", type: "medication" },
            { date: "2026/01/15", event: "Echo performed: EF evaluated at 35%", type: "test" },
            { date: "2026/02/10", event: "Outpatient visit: complaints of mild fatigue", type: "symptom" },
            { date: "2026/03/01", event: "Acute decompensation admission due to CHF", type: "risk" }
        ],
        highlights: [
            { term: "progressive dyspnea", type: "symptom" },
            { term: "fatigue", type: "symptom" },
            { term: "peripheral edema", type: "symptom" },
            { term: "congestive heart failure", type: "risk" },
            { term: "lisinopril", type: "medication" },
            { term: "carvedilol", type: "medication" },
            { term: "ejection fraction at 35%", type: "risk" }
        ],
        recommendations: [
            {
                title: "Initiate Guideline-Directed Medical Therapy (GDMT)",
                description: "Consider adding a sodium-glucose cotransporter-2 (SGLT2) inhibitor (e.g., empagliflozin) as patient exhibits HFrEF (EF 35%) and remains symptomatic."
            },
            {
                title: "Titrate Diuretics to Euvolemia",
                description: "Address peripheral edema immediately with short-term loop diuretic adjustments (e.g., furosemide) and advise daily weight monitoring."
            },
            {
                title: "UpToDate Evidence Reference",
                description: "See [Management of heart failure with reduced ejection fraction](https://www.uptodate.com) for guidelines on SGLT2i inclusion."
            }
        ]
    },
    {
        id: 'profileB',
        name: 'Profile B: Rheumatology',
        demographics: '34yo F • ANA Positive',
        description: 'A 34-year-old female presenting with acute joint pain, malar rash, and positive ANA titer.',
        notes: 'Patient reports acute joint pain in bilateral wrists and MCP joints. Accompanied by a prominent malar rash following sun exposure. Laboratory reports indicate a positive ANA titer (1:160, speckled pattern). Active complaints of fatigue and transient morning stiffness.',
        timeline: [
            { date: "2026/02/01", event: "Bilateral wrist stiffness reported in clinic", type: "symptom" },
            { date: "2026/03/10", event: "ANA panel ordered: returned positive (1:160)", type: "test" },
            { date: "2026/04/05", event: "Started on low-dose naproxen", type: "medication" }
        ],
        highlights: [
            { term: "joint pain", type: "symptom" },
            { term: "malar rash", type: "symptom" },
            { term: "positive ANA titer", type: "risk" },
            { term: "fatigue", type: "symptom" },
            { term: "naproxen", type: "medication" }
        ],
        recommendations: [
            {
                title: "Evaluate for Systemic Lupus Erythematosus (SLE)",
                description: "Assess clinical criteria (renal function, urinalysis for proteinuria, dsDNA, anti-Smith antibodies, and complement levels C3/C4) given the combination of photosensitive malar rash, arthralgias, and positive ANA."
            },
            {
                title: "Hydroxychloroquine Baseline Assessment",
                description: "Consider early initiation of hydroxychloroquine (Plaquenil) for disease control, ensuring a baseline ophthalmologic evaluation is scheduled."
            },
            {
                title: "PubMed Reference Portal",
                description: "Review [2019 EULAR/ACR Classification Criteria for SLE](https://pubmed.ncbi.nlm.nih.gov/31385872/) to evaluate diagnostic criteria scoring."
            }
        ]
    },
    {
        id: 'profileC',
        name: 'Profile C: Pulmonology',
        demographics: '45yo M • Infiltration',
        description: 'A 45-year-old male with persistent cough, night sweats, and localized upper lobe infiltration.',
        notes: 'Patient presents with a persistent productive cough lasting over 4 weeks. Reports drenching night sweats and weight loss. Chest X-ray reveals a localized infiltration in the right upper lobe. Denies hemoptysis.',
        timeline: [
            { date: "2026/01/20", event: "Persistent productive cough starts", type: "symptom" },
            { date: "2026/02/15", event: "Chest X-ray shows right upper lobe infiltration", type: "test" },
            { date: "2026/03/05", event: "Initiated amoxicillin course (no resolution)", type: "medication" }
        ],
        highlights: [
            { term: "persistent productive cough", type: "symptom" },
            { term: "night sweats", type: "symptom" },
            { term: "weight loss", type: "symptom" },
            { term: "upper lobe infiltration", type: "risk" },
            { term: "amoxicillin", type: "medication" }
        ],
        recommendations: [
            {
                title: "Rule Out Infectious Granulomatous Disease",
                description: "Order sputum acid-fast bacilli (AFB) smears and Mycobacterium tuberculosis PCR. Place patient under airborne isolation precautions immediately."
            },
            {
                title: "Refer for Diagnostic Bronchoscopy",
                description: "If sputum samples are negative or unobtainable, refer for bronchoscopy with bronchoalveolar lavage (BAL) and biopsy to rule out malignancy or atypical fungal infection."
            },
            {
                title: "CDC Literature Reference",
                description: "Consult the [CDC Guidelines for Preventing Transmission of Mycobacterium tuberculosis](https://www.cdc.gov/tb/) for clinical containment protocols."
            }
        ]
    }
];
