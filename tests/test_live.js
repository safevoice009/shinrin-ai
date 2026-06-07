const { chromium } = require('@playwright/test');
const path = require('path');

async function runLiveTest() {
    console.log("Launching Chromium browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log("Navigating to live deployment: https://shinrin-ai.vercel.app ...");
    await page.goto('https://shinrin-ai.vercel.app', { waitUntil: 'networkidle' });
    
    console.log("Toggling the console drawer to ensure it is visible...");
    const consoleDrawer = page.locator('#consoleContainer');
    const isCollapsed = await consoleDrawer.evaluate(node => node.classList.contains('h-12'));
    if (isCollapsed) {
        await page.locator('div[onclick="toggleConsole()"]').click();
    }
    
    // Switch to Copilot input tab
    console.log("Selecting Clinical Copilot Chat tab...");
    await page.locator('#tab-console-copilot').click();
    
    const copilotInput = page.locator('#copilotChatInput');
    const historyEl = page.locator('#copilotChatHistory');
    
    console.log("Entering query in Clinical AI Copilot...");
    const testQuery = "What are the first-line drug titration guidelines for chronic heart failure?";
    await copilotInput.fill(testQuery);
    await copilotInput.press('Enter');
    
    console.log("Sent query. Waiting 8 seconds for the live LLM response...");
    await page.waitForTimeout(8000);
    
    console.log("Reading chat logs...");
    const chatLogs = await historyEl.textContent();
    console.log("\n=================== CHAT LOGS ===================");
    console.log(chatLogs);
    console.log("=================================================\n");
    
    const screenshotPath = path.join(__dirname, '..', 'live_test_screenshot.png');
    console.log(`Saving screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath });
    
    await browser.close();
    console.log("Live browser test completed successfully.");
}

runLiveTest().catch(err => {
    console.error("Live test failed with error:", err);
    process.exit(1);
});
