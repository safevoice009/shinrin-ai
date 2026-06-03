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

export function insertScore(name, noteInput) {
    let textToInsert = "";
    if (name === 'CHA₂DS₂-VASc') {
        const score = document.getElementById('chads-score').textContent;
        const risk = document.getElementById('chads-stroke-risk').textContent;
        textToInsert = `[Calculated CHA₂DS₂-VASc Score: ${score} - ${risk}]`;
    } else {
        const score = document.getElementById('wells-score').textContent;
        const risk = document.getElementById('wells-risk').textContent;
        textToInsert = `[Calculated Wells' PE Score: ${score} - ${risk}]`;
    }
    const noteText = noteInput.value;
    noteInput.value = noteText.trim() + "\n" + textToInsert;
    alert(`${name} score appended to Clinical Narrative Note. Please click 'Structure Note' to refresh highlights and SOAP fields.`);
}
