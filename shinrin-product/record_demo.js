const { chromium } = require('@playwright/test');
const path = require('path');
const http = require('http');
const fs = require('fs');

let server;

async function startServer() {
    server = http.createServer((req, res) => {
        let urlPath = req.url.split('?')[0];
        if (urlPath === '/') urlPath = '/index.html';
        
        const filePath = path.join(__dirname, urlPath);
        
        let contentType = 'text/html';
        if (filePath.endsWith('.js')) {
            contentType = 'application/javascript';
        } else if (filePath.endsWith('.css')) {
            contentType = 'text/css';
        } else if (filePath.endsWith('.png')) {
            contentType = 'image/png';
        } else if (filePath.endsWith('.json')) {
            contentType = 'application/json';
        }
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    });

    await new Promise((resolve) => {
        server.listen(8090, '127.0.0.1', () => {
            console.log('Server running at http://127.0.0.1:8090/');
            resolve();
        });
    });
}

async function record() {
    // Read durations
    const durationsPath = path.join(__dirname, 'pause_durations.json');
    if (!fs.existsSync(durationsPath)) {
        console.error("Error: pause_durations.json not found! Run generate_audio first.");
        process.exit(1);
    }
    const durations = JSON.parse(fs.readFileSync(durationsPath, 'utf8'));
    console.log("Loaded durations:", durations);

    await startServer();

    console.log("Launching browser...");
    const browser = await chromium.launch({
        headless: true
    });

    const context = await browser.newContext({
        recordVideo: {
            dir: path.join(__dirname, 'videos'),
            size: { width: 1280, height: 720 }
        },
        viewport: { width: 1280, height: 720 }
    });

    // Mock speech and pipeline
    const page = await context.newPage();
    
    // Console error logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    await page.addInitScript(() => {
        window.webkitSpeechRecognition = class MockSpeechRecognition {
            constructor() {
                this.continuous = true;
                this.interimResults = false;
                this.lang = 'en-US';
            }
            start() {
                setTimeout(() => {
                    if (this.onstart) this.onstart();
                    setTimeout(() => {
                        if (this.onresult) {
                            this.onresult({
                                results: [[{ transcript: "Patient reports progressive dyspnea and joint pain. Start lisinopril." }]]
                            });
                        }
                        setTimeout(() => { if (this.onend) this.onend(); }, 50);
                    }, 100);
                }, 50);
            }
            stop() { if (this.onend) this.onend(); }
        };
        window.SpeechRecognition = window.webkitSpeechRecognition;

        window.AudioContext = class MockAudioContext {
            createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 0 } }; }
            createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
            destination = {};
        };

        window.__mockPipeline = async (task, model, options) => {
            if (options && options.progress_callback) {
                options.progress_callback({ status: 'progress', progress: 100 });
            }
            if (task === 'text-classification') return async () => [{ label: 'POSITIVE', score: 0.99 }];
            if (task === 'token-classification') return async (text) => {
                const res = [];
                const textLower = text.toLowerCase();
                if (textLower.includes('lisinopril')) res.push({ entity_group: 'MEDICATION', word: 'lisinopril', score: 0.99, start: textLower.indexOf('lisinopril'), end: textLower.indexOf('lisinopril') + 10 });
                if (textLower.includes('shortness')) res.push({ entity_group: 'SIGN_SYMPTOM', word: 'shortness of breath', score: 0.98, start: textLower.indexOf('shortness'), end: textLower.indexOf('shortness') + 18 });
                if (textLower.includes('fatigue')) res.push({ entity_group: 'SIGN_SYMPTOM', word: 'fatigue', score: 0.98, start: textLower.indexOf('fatigue'), end: textLower.indexOf('fatigue') + 7 });
                return res;
            };
        };
    });

    console.log("Navigating to dashboard...");
    const startTime = Date.now();
    await page.goto('http://127.0.0.1:8090/index.html');

    // Select the NER model at the start to let it load instantly using mocks
    await page.selectOption('#openmed-model-selector', 'ner');

    // SCENE 1: Introduction (User voice + edge-tts intro part 2)
    // Total intro duration = user_intro + intro_part2
    const totalIntroSec = durations.user_intro + durations.intro_part2;
    console.log(`SCENE 1: Intro narration (total: ${totalIntroSec.toFixed(2)}s)`);
    
    // We spend the first 8 seconds hovering over the top bar widgets
    await page.waitForTimeout(3000);
    await page.locator('#zen-breathing-widget').hover();
    await page.waitForTimeout(3000);
    await page.locator('#streakDays').hover();
    await page.waitForTimeout(2000);

    // Then we type the patient narrative to fill the rest of the intro part 2 duration
    const textToType = "Patient is a 45yo female presenting with severe shortness of breath, fatigue, and bilateral leg swelling. Has history of hypertension. Started Lisinopril 10mg.";
    const typingStartTime = Date.now();
    console.log("Simulating clinical narrative typing...");
    await page.locator('#noteInput').focus();
    await page.locator('#noteInput').fill('');
    await page.keyboard.type(textToType, { delay: 60 }); // Simulates natural key strokes

    // Calculate how much remaining time we need to wait for the intro narration to complete
    const elapsedIntroMs = Date.now() - startTime;
    const remainingIntroMs = (totalIntroSec * 1000) - elapsedIntroMs;
    if (remainingIntroMs > 0) {
        console.log(`Waiting remaining intro time: ${remainingIntroMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingIntroMs);
    }

    // SCENE 2: Clinical Workspace & SOAP structuring
    const workspaceStartTime = Date.now();
    console.log(`SCENE 2: Clinical Workspace narration (${durations.workspace.toFixed(2)}s)`);
    
    // Select summarizer model and structure the note
    await page.selectOption('#openmed-model-selector', 'ner');
    await page.locator('button:has-text("Structure Note")').click();
    
    // Wait for the pipeline processing overlay to close
    await page.waitForSelector('#pipelineLoader', { state: 'hidden', timeout: 10000 });
    
    // Scroll down to display entity highlights and SOAP notes
    await page.locator('#highlightsContainer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(4000);
    
    // Switch to SOAP tab to make the SOAP fields visible
    await page.locator('#tab-soap').click();
    await page.waitForTimeout(1000);
    
    await page.locator('#soap-s').scrollIntoViewIfNeeded();
    await page.waitForTimeout(4000);
    
    await page.locator('#soap-a').focus();
    await page.waitForTimeout(4000);
    
    await page.locator('#vitalsTrendChart').scrollIntoViewIfNeeded();
    await page.waitForTimeout(4000);

    const elapsedWorkspaceMs = Date.now() - workspaceStartTime;
    const remainingWorkspaceMs = (durations.workspace * 1000) - elapsedWorkspaceMs;
    if (remainingWorkspaceMs > 0) {
        console.log(`Waiting remaining workspace time: ${remainingWorkspaceMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingWorkspaceMs);
    }

    // SCENE 3: Risk Calculators
    const calcStartTime = Date.now();
    console.log(`SCENE 3: Risk Calculators narration (${durations.calculators.toFixed(2)}s)`);
    
    // Go to Risk Calculators tab
    await page.locator('#primary-tab-calculators').click();
    await page.waitForTimeout(1500);
    
    // Click Wells' Score card
    await page.locator('#btn-calc-wells').click();
    await page.waitForTimeout(1500);
    
    // Check some clinical findings
    await page.locator('label:has-text("Clinical signs/symptoms of DVT")').click();
    await page.waitForTimeout(1500);
    await page.locator('label:has-text("PE is primary diagnosis or equally likely")').click();
    await page.waitForTimeout(1500);
    
    // Insert score to SOAP Note
    await page.locator('button[onclick="insertScore(\'Wells\')"]').click();
    await page.waitForTimeout(1500);

    // Switch back to Workspace to show insertion
    await page.locator('#primary-tab-workspace').click();
    await page.waitForTimeout(2000);
    
    const elapsedCalcMs = Date.now() - calcStartTime;
    const remainingCalcMs = (durations.calculators * 1000) - elapsedCalcMs;
    if (remainingCalcMs > 0) {
        console.log(`Waiting remaining calculators time: ${remainingCalcMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingCalcMs);
    }

    // SCENE 4: Anatomical Atlas
    const atlasStartTime = Date.now();
    console.log(`SCENE 4: Anatomical Atlas narration (${durations.atlas.toFixed(2)}s)`);
    
    // Go to Anatomical Atlas tab
    await page.locator('#primary-tab-anatomy').click();
    await page.waitForTimeout(2000);
    
    // Select skeletal layer
    await page.locator('#layer-btn-skeletal').click();
    await page.waitForTimeout(2000);
    
    // Select bone skull
    await page.locator('#bone-skull').click();
    await page.waitForTimeout(2000);
    
    // Correlate bone
    await page.locator('button:has-text("Correlate with Active Note")').click();
    await page.waitForTimeout(3000);

    const elapsedAtlasMs = Date.now() - atlasStartTime;
    const remainingAtlasMs = (durations.atlas * 1000) - elapsedAtlasMs;
    if (remainingAtlasMs > 0) {
        console.log(`Waiting remaining atlas time: ${remainingAtlasMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingAtlasMs);
    }

    // SCENE 5: Patient Simulator
    const simStartTime = Date.now();
    console.log(`SCENE 5: Patient Simulator narration (${durations.simulator.toFixed(2)}s)`);
    
    // Go to Patient Simulator tab
    await page.locator('#primary-tab-simulator').click();
    await page.waitForTimeout(2000);
    
    // Select Ami Tanaka
    await page.locator('#sim-card-ami').click();
    await page.waitForTimeout(2000);
    
    // Select joint hotspot
    await page.locator('#sim-scan-container svg g').first().click({ force: true });
    await page.waitForTimeout(2000);
    
    // Click describe symptoms
    await page.locator('button:has-text("Describe your symptoms")').click();
    await page.waitForTimeout(3000);
    
    // Sync interview
    await page.locator('button:has-text("Sync Interview to Note")').click();
    await page.waitForTimeout(2000);

    const elapsedSimMs = Date.now() - simStartTime;
    const remainingSimMs = (durations.simulator * 1000) - elapsedSimMs;
    if (remainingSimMs > 0) {
        console.log(`Waiting remaining simulator time: ${remainingSimMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingSimMs);
    }

    // SCENE 6: AI Workbench
    const workbenchStartTime = Date.now();
    console.log(`SCENE 6: AI Workbench narration (${durations.workbench.toFixed(2)}s)`);
    
    // Go to AI Workbench
    await page.locator('#primary-tab-workbench').click();
    await page.waitForTimeout(2000);
    
    // Start LoRA simulation
    await page.locator('button:has-text("Start LoRA Fine-Tuning Simulation")').click();
    // LoRA progress takes about 3 seconds in mocks
    await page.waitForTimeout(4000);

    const elapsedWorkbenchMs = Date.now() - workbenchStartTime;
    const remainingWorkbenchMs = (durations.workbench * 1000) - elapsedWorkbenchMs;
    if (remainingWorkbenchMs > 0) {
        console.log(`Waiting remaining workbench time: ${remainingWorkbenchMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingWorkbenchMs);
    }

    // SCENE 7: Diagnostics & Logs Drawer
    const diagStartTime = Date.now();
    console.log(`SCENE 7: Diagnostics narration (${durations.diagnostics.toFixed(2)}s)`);
    
    // Go to diagnostics
    await page.locator('#primary-tab-diagnostics').click();
    await page.waitForTimeout(2000);
    
    // Run self-test
    await page.locator('button:has-text("Run Self-Test Suite")').click();
    await page.waitForTimeout(3000);
    
    // Expand console logs drawer
    await page.locator('div[onclick="toggleConsole()"]').click();
    await page.waitForTimeout(3000);
    
    // Collapse console logs drawer
    await page.locator('div[onclick="toggleConsole()"]').click();
    await page.waitForTimeout(2000);

    const elapsedDiagMs = Date.now() - diagStartTime;
    const remainingDiagMs = (durations.diagnostics * 1000) - elapsedDiagMs;
    if (remainingDiagMs > 0) {
        console.log(`Waiting remaining diagnostics time: ${remainingDiagMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingDiagMs);
    }

    // SCENE 8: Conclusion & Dark Mode
    const conclStartTime = Date.now();
    console.log(`SCENE 8: Conclusion narration (${durations.conclusion.toFixed(2)}s)`);
    
    // Toggle Dark Mode
    await page.locator('#themeBtn').click();
    await page.waitForTimeout(5000);
    
    // Toggle back to Light Mode
    await page.locator('#themeBtn').click();
    await page.waitForTimeout(3000);

    const elapsedConclMs = Date.now() - conclStartTime;
    const remainingConclMs = (durations.conclusion * 1000) - elapsedConclMs;
    if (remainingConclMs > 0) {
        console.log(`Waiting remaining conclusion time: ${remainingConclMs.toFixed(0)}ms`);
        await page.waitForTimeout(remainingConclMs);
    }

    console.log("Closing browser and saving video...");
    await context.close();
    await browser.close();

    // Close local server
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
    console.log("Server closed. Video recording done.");
}

record().catch(e => {
    console.error("Recording failed:", e);
    process.exit(1);
});
