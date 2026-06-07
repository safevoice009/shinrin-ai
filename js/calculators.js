function sanitizeCalculatorInput(value, defaultValue = 1.0) {
    const val = parseFloat(value);
    if (isNaN(val) || !isFinite(val)) return defaultValue;
    return val;
}

export function runChads() {
    let score = 0;
    if (document.getElementById('chads-c').checked) score += 1;
    if (document.getElementById('chads-h').checked) score += 1;
    if (document.getElementById('chads-a75').checked) score += 2;
    if (document.getElementById('chads-d').checked) score += 1;
    if (document.getElementById('chads-s').checked) score += 2;
    if (document.getElementById('chads-v').checked) score += 1;
    if (document.getElementById('chads-a65').checked) score += 1;
    if (document.getElementById('chads-f').checked) score += 1;

    document.getElementById('chads-score').textContent = score;
    const risks = [0.2, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 6.7, 15.2];
    const riskVal = risks[Math.min(score, risks.length - 1)];
    document.getElementById('chads-stroke-risk').textContent = `Annual Stroke Risk: ${riskVal}%`;

    // Update risk UI
    const badge = document.getElementById('chads-risk-badge');
    const bar = document.getElementById('chads-risk-bar');
    if (badge && bar) {
        let label = "Low Risk";
        let width = "10%";
        let colorClasses = "bg-emerald-500";
        let bgBadge = "bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
        
        if (score >= 3) {
            label = "High Risk";
            width = "90%";
            colorClasses = "bg-rose-500";
            bgBadge = "bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
        } else if (score === 2) {
            label = "Moderate Risk";
            width = "50%";
            colorClasses = "bg-amber-500";
            bgBadge = "bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
        } else if (score === 1) {
            label = "Mild Risk";
            width = "25%";
            colorClasses = "bg-yellow-500";
            bgBadge = "bg-yellow-100/50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400";
        }
        badge.textContent = label;
        badge.className = `px-2 py-0.5 rounded font-extrabold ${bgBadge}`;
        bar.className = `h-full ${colorClasses} transition-all duration-500 ease-out`;
        bar.style.width = width;
    }
}

export function runHasbled() {
    let score = 0;
    if (document.getElementById('hasbled-h').checked) score += 1;
    if (document.getElementById('hasbled-a').checked) score += 1;
    if (document.getElementById('hasbled-s').checked) score += 1;
    if (document.getElementById('hasbled-b').checked) score += 1;
    if (document.getElementById('hasbled-l').checked) score += 1;
    if (document.getElementById('hasbled-e').checked) score += 1;
    if (document.getElementById('hasbled-d').checked) score += 1;

    document.getElementById('hasbled-score').textContent = score;
    let risk = "Low Bleeding Risk (1.13%)";
    if (score >= 3) {
        risk = "High Bleeding Risk (3.74%+)";
    } else if (score === 1) {
        risk = "Moderate Bleeding Risk (1.02%)";
    } else if (score === 2) {
        risk = "Moderate Bleeding Risk (1.88%)";
    }
    document.getElementById('hasbled-risk').textContent = `Bleeding Risk: ${risk}`;

    // Update risk UI
    const badge = document.getElementById('hasbled-risk-badge');
    const bar = document.getElementById('hasbled-risk-bar');
    if (badge && bar) {
        let label = "Low Risk";
        let width = "15%";
        let colorClasses = "bg-emerald-500";
        let bgBadge = "bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
        
        if (score >= 3) {
            label = "High Risk";
            width = "90%";
            colorClasses = "bg-rose-500";
            bgBadge = "bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
        } else if (score === 2) {
            label = "Moderate Risk";
            width = "50%";
            colorClasses = "bg-amber-500";
            bgBadge = "bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
        } else if (score === 1) {
            label = "Mild Risk";
            width = "30%";
            colorClasses = "bg-yellow-500";
            bgBadge = "bg-yellow-100/50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400";
        }
        badge.textContent = label;
        badge.className = `px-2 py-0.5 rounded font-extrabold ${bgBadge}`;
        bar.className = `h-full ${colorClasses} transition-all duration-500 ease-out`;
        bar.style.width = width;
    }
}

export function runWells() {
    let score = 0.0;
    if (document.getElementById('wells-dvt').checked) score += 3.0;
    if (document.getElementById('wells-pe').checked) score += 3.0;
    if (document.getElementById('wells-hr').checked) score += 1.5;
    if (document.getElementById('wells-immob').checked) score += 1.5;
    if (document.getElementById('wells-prev').checked) score += 1.5;
    if (document.getElementById('wells-hemo').checked) score += 1.0;
    if (document.getElementById('wells-malig').checked) score += 1.0;

    document.getElementById('wells-score').textContent = score.toFixed(1);
    let probability = "Low (10%)";
    if (score > 6.0) probability = "High (65%)";
    else if (score >= 2.0) probability = "Moderate (30%)";
    document.getElementById('wells-risk').textContent = `PE Probability: ${probability}`;

    // Update risk UI
    const badge = document.getElementById('wells-risk-badge');
    const bar = document.getElementById('wells-risk-bar');
    if (badge && bar) {
        let label = "Low (10%)";
        let width = "15%";
        let colorClasses = "bg-emerald-500";
        let bgBadge = "bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
        
        if (score > 6.0) {
            label = "High (65%)";
            width = "90%";
            colorClasses = "bg-rose-500";
            bgBadge = "bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
        } else if (score >= 2.0) {
            label = "Moderate (30%)";
            width = "50%";
            colorClasses = "bg-amber-500";
            bgBadge = "bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
        }
        badge.textContent = label;
        badge.className = `px-2 py-0.5 rounded font-extrabold ${bgBadge}`;
        bar.className = `h-full ${colorClasses} transition-all duration-500 ease-out`;
        bar.style.width = width;
    }
}

export function runMews() {
    let score = 0;
    score += parseInt(document.getElementById('mews-sbp').value, 10);
    score += parseInt(document.getElementById('mews-hr').value, 10);
    score += parseInt(document.getElementById('mews-rr').value, 10);
    score += parseInt(document.getElementById('mews-temp').value, 10);
    score += parseInt(document.getElementById('mews-avpu').value, 10);

    document.getElementById('mews-score').textContent = score;
    let risk = "Low Risk (routine checks)";
    if (score >= 5) {
        risk = "Critical / High Risk (Immediate clinical review required!)";
    } else if (score >= 3) {
        risk = "Moderate Risk (Increase monitoring)";
    }
    document.getElementById('mews-risk').textContent = `Risk Assessment: ${risk}`;

    // Update risk UI
    const badge = document.getElementById('mews-risk-badge');
    const bar = document.getElementById('mews-risk-bar');
    if (badge && bar) {
        let label = "Low Risk";
        let width = "15%";
        let colorClasses = "bg-emerald-500";
        let bgBadge = "bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
        
        if (score >= 5) {
            label = "Critical Risk";
            width = "95%";
            colorClasses = "bg-rose-500";
            bgBadge = "bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
        } else if (score >= 3) {
            label = "Moderate Risk";
            width = "55%";
            colorClasses = "bg-amber-500";
            bgBadge = "bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
        }
        badge.textContent = label;
        badge.className = `px-2 py-0.5 rounded font-extrabold ${bgBadge}`;
        bar.className = `h-full ${colorClasses} transition-all duration-500 ease-out`;
        bar.style.width = width;
    }
}

export function runMeld() {
    let bilirubin = sanitizeCalculatorInput(document.getElementById('meld-bilirubin').value, 1.0);
    let inr = sanitizeCalculatorInput(document.getElementById('meld-inr').value, 1.0);
    let creatinine = sanitizeCalculatorInput(document.getElementById('meld-creatinine').value, 1.0);
    let dialysis = document.getElementById('meld-dialysis').checked;

    if (dialysis || creatinine > 4.0) {
        creatinine = 4.0;
    }

    // Lower bound cap at 1.0 for logarithmic inputs
    bilirubin = Math.max(1.0, bilirubin);
    inr = Math.max(1.0, inr);
    creatinine = Math.max(1.0, creatinine);

    let meldVal = (3.78 * Math.log(bilirubin)) + (11.2 * Math.log(inr)) + (9.57 * Math.log(creatinine)) + 6.43;
    let score = Math.round(meldVal);
    
    // Clinical cap for MELD score is 6 to 40
    score = Math.max(6, Math.min(40, score));

    let mortality = "1.9% 3-month mortality";
    if (score >= 40) mortality = "71.3% 3-month mortality (Immediate ICU/Transplant Priority)";
    else if (score >= 30) mortality = "52.6% 3-month mortality (Severe liver failure)";
    else if (score >= 20) mortality = "19.6% 3-month mortality (Moderate-severe liver failure)";
    else if (score >= 10) mortality = "6.0% 3-month mortality (Mild-moderate liver failure)";

    document.getElementById('meld-score').textContent = score;
    document.getElementById('meld-mortality-risk').textContent = `Mortality Risk: ${mortality}`;

    // Update risk UI
    const badge = document.getElementById('meld-risk-badge');
    const bar = document.getElementById('meld-risk-bar');
    if (badge && bar) {
        let label = "Low (6.0%)";
        let width = "15%";
        let colorClasses = "bg-emerald-500";
        let bgBadge = "bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
        
        if (score >= 40) {
            label = "Critical (71.3%)";
            width = "100%";
            colorClasses = "bg-rose-500";
            bgBadge = "bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
        } else if (score >= 30) {
            label = "Severe (52.6%)";
            width = "80%";
            colorClasses = "bg-rose-500/80";
            bgBadge = "bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
        } else if (score >= 20) {
            label = "Mod-Severe (19.6%)";
            width = "55%";
            colorClasses = "bg-amber-500";
            bgBadge = "bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
        } else if (score >= 10) {
            label = "Mild-Mod (6.0%)";
            width = "35%";
            colorClasses = "bg-yellow-500";
            bgBadge = "bg-yellow-100/50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400";
        }
        badge.textContent = label;
        badge.className = `px-2 py-0.5 rounded font-extrabold ${bgBadge}`;
        bar.className = `h-full ${colorClasses} transition-all duration-500 ease-out`;
        bar.style.width = width;
    }
}

export function runCurb65() {
    let score = 0;
    if (document.getElementById('curb-c').checked) score += 1;
    if (document.getElementById('curb-u').checked) score += 1;
    if (document.getElementById('curb-r').checked) score += 1;
    if (document.getElementById('curb-b').checked) score += 1;
    if (document.getElementById('curb-age').checked) score += 1;

    let mortality = "1.5% 30-day mortality (Low Risk - Outpatient care)";
    if (score >= 3) {
        mortality = `22.0% 30-day mortality (Severe Risk - Urgent Inpatient admission, evaluate for ICU if >= 4)`;
    } else if (score === 2) {
        mortality = `9.2% 30-day mortality (Moderate Risk - Short-stay inpatient or close outpatient monitoring)`;
    }

    document.getElementById('curb-score').textContent = score;
    document.getElementById('curb-mortality-risk').textContent = `Assessment: ${mortality}`;

    // Update risk UI
    const badge = document.getElementById('curb-risk-badge');
    const bar = document.getElementById('curb-risk-bar');
    if (badge && bar) {
        let label = "Low Risk (1.5%)";
        let width = "20%";
        let colorClasses = "bg-emerald-500";
        let bgBadge = "bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
        
        if (score >= 3) {
            label = "Severe Risk (22%)";
            width = "90%";
            colorClasses = "bg-rose-500";
            bgBadge = "bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
        } else if (score === 2) {
            label = "Moderate Risk (9.2%)";
            width = "55%";
            colorClasses = "bg-amber-500";
            bgBadge = "bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
        }
        badge.textContent = label;
        badge.className = `px-2 py-0.5 rounded font-extrabold ${bgBadge}`;
        bar.className = `h-full ${colorClasses} transition-all duration-500 ease-out`;
        bar.style.width = width;
    }
}

export function insertScore(name, noteInput) {
    let textToInsert = "";
    if (name === 'CHA₂DS₂-VASc') {
        const score = document.getElementById('chads-score').textContent;
        const risk = document.getElementById('chads-stroke-risk').textContent;
        textToInsert = `[Calculated CHA₂DS₂-VASc Score: ${score} - ${risk}]`;
    } else if (name === 'HAS-BLED') {
        const score = document.getElementById('hasbled-score').textContent;
        const risk = document.getElementById('hasbled-risk').textContent;
        textToInsert = `[Calculated HAS-BLED Score: ${score} - ${risk}]`;
    } else if (name === 'Wells') {
        const score = document.getElementById('wells-score').textContent;
        const risk = document.getElementById('wells-risk').textContent;
        textToInsert = `[Calculated Wells' PE Score: ${score} - ${risk}]`;
    } else if (name === 'MEWS') {
        const score = document.getElementById('mews-score').textContent;
        const risk = document.getElementById('mews-risk').textContent;
        textToInsert = `[Calculated MEWS Score: ${score} - ${risk}]`;
    } else if (name === 'MELD') {
        const score = document.getElementById('meld-score').textContent;
        const risk = document.getElementById('meld-mortality-risk').textContent;
        textToInsert = `[Calculated MELD Score: ${score} - ${risk}]`;
    } else if (name === 'CURB-65') {
        const score = document.getElementById('curb-score').textContent;
        const risk = document.getElementById('curb-mortality-risk').textContent;
        textToInsert = `[Calculated CURB-65 Score: ${score} - ${risk}]`;
    }
    const noteText = noteInput.value;
    noteInput.value = noteText.trim() + "\n" + textToInsert;
    alert(`${name} score appended to Clinical Narrative Note. Please click 'Structure Note' to refresh highlights and SOAP fields.`);
}

