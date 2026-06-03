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
        risk = "High Bleeding Risk (3.74%+ - regular review required)";
    } else if (score === 1) {
        risk = "Moderate Bleeding Risk (1.02%)";
    } else if (score === 2) {
        risk = "Moderate Bleeding Risk (1.88%)";
    }
    document.getElementById('hasbled-risk').textContent = `Bleeding Risk: ${risk}`;
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
    }
    const noteText = noteInput.value;
    noteInput.value = noteText.trim() + "\n" + textToInsert;
    alert(`${name} score appended to Clinical Narrative Note. Please click 'Structure Note' to refresh highlights and SOAP fields.`);
}
