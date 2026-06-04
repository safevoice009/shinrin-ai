const { test, expect } = require('@playwright/test');
const path = require('path');
const http = require('http');
const fs = require('fs');

let server;

test.beforeAll(async () => {
    // Spin up a simple static file HTTP server to support ES module loading without CORS errors
    server = http.createServer((req, res) => {
        let urlPath = req.url.split('?')[0];
        if (urlPath === '/') urlPath = '/index.html';
        
        const filePath = path.join(__dirname, '..', urlPath);
        
        let contentType = 'text/html';
        if (filePath.endsWith('.js')) {
            contentType = 'application/javascript';
        } else if (filePath.endsWith('.css')) {
            contentType = 'text/css';
        } else if (filePath.endsWith('.png')) {
            contentType = 'image/png';
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
            console.log('Test server running at http://127.0.0.1:8090/');
            resolve();
        });
    });
});

test.afterAll(async () => {
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
});

test('Shinrin AI - Full Clinician Flow E2E Test', async ({ page }) => {
    // Dismiss the browser alert dialog automatically when inserting score
    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    // Mock SpeechRecognition API to test dictation locally/headless
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
                    // Simulate voice transcript event
                    setTimeout(() => {
                        if (this.onresult) {
                            const event = {
                                results: [
                                    [{ transcript: "Patient reports progressive dyspnea and joint pain. Start lisinopril." }]
                                ]
                            };
                            this.onresult(event);
                        }
                        // Stop automatically in mock
                        setTimeout(() => {
                            if (this.onend) this.onend();
                        }, 50);
                    }, 100);
                }, 50);
            }
            stop() {
                if (this.onend) this.onend();
            }
        };
        window.SpeechRecognition = window.webkitSpeechRecognition;
        
        // Mock AudioContext and other audio feedback so haptics don't fail in headless browser
        window.AudioContext = window.AudioContext || window.webkitAudioContext || class MockAudioContext {
            createOscillator() {
                return {
                    connect: () => {},
                    start: () => {},
                    stop: () => {},
                    frequency: { value: 0 }
                };
            }
            createGain() {
                return {
                    connect: () => {},
                    gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
                };
            }
            destination = {};
        };
    });

    // Open the local test server
    await page.goto('http://127.0.0.1:8090/index.html');

    // Wait for the body to be visible
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/Shinrin AI/);

    // Select the NER-Biomedical model to run simulated inference instantly without downloading 40MB
    await page.selectOption('#openmed-model-selector', 'ner');

    // 3. Create a new custom patient case ("Dr. Colleague Case")
    // Trigger "New Case" modal
    await page.locator('button:has-text("New Case")').click();
    await expect(page.locator('#newCaseModal')).not.toHaveClass(/hidden/);

    // Fill the inputs
    await page.locator('#new-case-name').fill('Dr. Colleague Case');
    await page.locator('#new-case-demo').fill('42yo M • Sudden Onset Dyspnea');
    
    // Submit creation
    await page.locator('button:has-text("Create Case")').click();
    
    // Verify modal is closed and switcher has the new button
    await expect(page.locator('#newCaseModal')).toHaveClass(/hidden/);
    const customTab = page.locator('#profileSwitcher button[id^="btn-profile_"]');
    await expect(customTab).toBeVisible();

    // Select the new case to verify loaded context (already selected by submitNewCase)
    await customTab.first().click();
    await expect(page.locator('#patientName')).toHaveText('Case: Dr. Colleague Case');

    // 4. Test Autocomplete dropdown
    const noteInput = page.locator('#noteInput');
    await noteInput.focus();
    
    // Clear and type "CH" to trigger autocomplete for "CHF"
    await noteInput.fill('');
    await noteInput.type('CH');
    
    const autocompleteDropdown = page.locator('#autocomplete-dropdown');
    await expect(autocompleteDropdown).not.toHaveClass(/hidden/);
    
    // Check dropdown suggestions contain CHF
    const suggestionCHF = autocompleteDropdown.locator('span:has-text("CHF")');
    await expect(suggestionCHF).toBeVisible();
    
    // Select CHF suggestion
    await suggestionCHF.click();
    
    // Check that CHF was inserted
    let noteValue = await noteInput.inputValue();
    expect(noteValue).toContain('CHF');

    // 5. Test Live Voice-to-Text Dictation
    // Click Dictate Note button
    const dictateBtn = page.locator('#dictateBtn');
    await dictateBtn.click();
    
    // Wait for mock dictation to complete and fill text
    await page.waitForTimeout(500);
    
    noteValue = await noteInput.inputValue();
    expect(noteValue).toContain('progressive dyspnea');
    expect(noteValue).toContain('lisinopril');

    // 6. Test parsing notes
    await page.locator('button:has-text("Structure Note")').click();
    
    // Wait for pipeline loading overlay to hide
    const pipelineLoader = page.locator('#pipelineLoader');
    await expect(pipelineLoader).toHaveClass(/hidden/, { timeout: 10000 });

    // Verify clinical highlights are populated
    await expect(page.locator('#highlightsContainer')).not.toHaveClass(/hidden/);
    const highlightedText = await page.locator('#highlightedText').innerHTML();
    expect(highlightedText).toContain('lisinopril');
    expect(highlightedText).toContain('progressive');
    expect(highlightedText).toContain('dyspnea');

    // Verify SOAP note textareas are populated reactively
    await expect(page.locator('#soap-s')).not.toHaveValue('');
    await expect(page.locator('#soap-o')).not.toHaveValue('');
    await expect(page.locator('#soap-a')).not.toHaveValue('');
    await expect(page.locator('#soap-p')).not.toHaveValue('');

    // Verify dynamic note-driven guidelines & differentials inside Doctor Console Drawer
    const consoleDrawer = page.locator('#consoleContainer');
    const isConsoleCollapsed = await consoleDrawer.evaluate(node => node.classList.contains('h-12'));
    if (isConsoleCollapsed) {
        await page.locator('div[onclick="toggleConsole()"]').click();
    }
    
    // Verify pathophysiology details are loaded dynamically based on cardiovascular keywords
    const pathophysText = await page.locator('#clinical-pathophysiology').textContent();
    expect(pathophysText).toContain('systolic impairment');
    
    // Verify guidelines are populated
    const guidelinesChecklist = page.locator('#clinical-guidelines-checklist');
    await expect(guidelinesChecklist).toContainText('SGLT2');

    // Collapse the console drawer so it doesn't overlap other buttons during test clicks
    const isConsoleOpen = await consoleDrawer.evaluate(node => !node.classList.contains('h-12'));
    if (isConsoleOpen) {
        await page.locator('div[onclick="toggleConsole()"]').click();
    }

    // 7. Test EHR Sync Gateway Tab View
    await page.locator('#primary-tab-ehr').click();
    await expect(page.locator('#view-ehr')).not.toHaveClass(/hidden/);
    await expect(page.locator('#view-workspace')).toHaveClass(/hidden/);

    // Switch sub-tab to EHR Registry Sync
    await page.locator('#tab-ehr-open-tech').click();
    
    // Select OpenMRS tool card
    await page.locator('div[onclick="selectRegistryTool(\'openmrs\')"]').click();
    
    // Dispatch to EHR
    const dispatchBtn = page.locator('#sandbox-sync-btn');
    await dispatchBtn.click();
    
    // Wait for mock sync response
    const statusLabel = page.locator('#sandbox-status');
    await expect(statusLabel).toContainText('Synced');

    // 8. Test Risk Calculators Tab View
    await page.locator('#primary-tab-calculators').click();
    await expect(page.locator('#view-calculators')).not.toHaveClass(/hidden/);
    await expect(page.locator('#view-ehr')).toHaveClass(/hidden/);

    // Switch to Wells' Calculator
    await page.locator('#btn-calc-wells').click();
    await expect(page.locator('#calc-wells')).not.toHaveClass(/hidden/);

    // Click inputs directly since actual checkbox is sr-only inside custom labels
    await page.locator('#wells-dvt').click({ force: true });
    await page.locator('#wells-pe').click({ force: true });

    // Verify wells-score is computed (3.0 + 3.0 = 6.0 points)
    const scoreText = await page.locator('#wells-score').textContent();
    expect(parseFloat(scoreText)).toBeGreaterThan(0);

    // Insert score to SOAP Note (it appends to Narrative Note input)
    await page.locator('button[onclick="insertScore(\'Wells\')"]').click();
    
    // Go back to Workspace to verify note content contains the score insertion
    await page.locator('#primary-tab-workspace').click();
    const noteContent = await page.locator('#noteInput').inputValue();
    expect(noteContent).toContain('Wells');
});
