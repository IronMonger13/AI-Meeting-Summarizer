    require("dotenv").config();
    const puppeteer = require("puppeteer");

    (async () => {
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: "C:\\Users\\ishaa\\AppData\\Local\\Google\\Chrome\\User Data",
        args: [
        "--profile-directory=Default",
        "--use-fake-ui-for-media-stream",
        "--no-sandbox",
        ],
    });

    const page = await browser.newPage();

    // Debug navigation
    page.on("framenavigated", () => {
        console.log("⚠️ Frame changed (Meet reloaded)");
    });

    console.log("Opening Meet link...");
    await page.goto(process.env.MEET_LINK, { waitUntil: "networkidle2" });

    // Let UI settle
    await new Promise((r) => setTimeout(r, 7000));

    // Turn off mic & cam
    try {
        await page.keyboard.press("KeyE");
        await page.keyboard.press("KeyD");
        console.log("🎤 Mic & Cam toggled");
    } catch {}

    // -------- JOIN LOGIC (FIXED) --------
    console.log("Looking for join button...");

    let joined = false;

    for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 3000));

        const buttons = await page.$$("button");

        for (let btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);

        if (!text) continue;

        const lower = text.toLowerCase();

        if (
            lower.includes("join") ||
            lower.includes("ask to join") ||
            lower.includes("join now")
        ) {
            console.log("👉 Clicking:", text);
            await btn.click();
            joined = true;
            break;
        }
        }

        if (joined) break;
    }

    if (joined) {
        console.log("✅ Joined meeting");
    } else {
        console.log("❌ Could not find join button (maybe already inside)");
    }

    // Wait for meeting UI
    await new Promise((r) => setTimeout(r, 8000));

    // -------- ENABLE CAPTIONS (RELIABLE) --------
    console.log("Enabling captions...");

    for (let i = 0; i < 3; i++) {
        try {
        await page.keyboard.press("KeyC");
        await new Promise((r) => setTimeout(r, 2000));
        } catch {}
    }

    console.log("🎧 Listening for captions...\n");

    let lastCaptions = [];

    // -------- CAPTURE LOOP (IMPROVED) --------
    setInterval(async () => {
        try {
        const captions = await page.$$eval(
            '[aria-live="polite"]',
            nodes => nodes.map(n => n.innerText)
        );

        const newCaptions = captions.filter(c => !lastCaptions.includes(c));

        if (newCaptions.length > 0) {
            console.log("📝", newCaptions);
            lastCaptions = captions;
        }

        } catch (err) {
        console.log("⚠️ Retrying caption read...");
        }
    }, 3000);
    })();