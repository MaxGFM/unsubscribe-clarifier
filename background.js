async function runClarifier(tabId) {
	try {
		// Inject lexicons first so content.js can read them
		await browser.scripting.executeScript({
			target: { tabId },
			files: ["lexicons.js"]
		});
		await browser.scripting.executeScript({
			target: { tabId },
			files: ["content.js"]
		});
		await browser.scripting.insertCSS({
		target: { tabId },
		files: ["content.css"]
		});
	} catch (err) {
		// activeTab denies injection into about:*, addons.mozilla.org, etc.
		// That's expected — fail quietly rather than confusing the user.
		console.error("[Unsubscribe Clarifier] Injection failed:", err);
	}
}

browser.action.onClicked.addListener((tab) => {
	if (tab?.id) runClarifier(tab.id);
});

browser.menus.create({
	id: "clarify-unsubscribe",
	title: browser.i18n.getMessage("menuLabel"),
	contexts: ["page", "selection", "link"]
});

browser.menus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "clarify-unsubscribe" && tab?.id) {
		runClarifier(tab.id);
	}
});

browser.commands.onCommand.addListener(async (command) => {
	if (command !== "clarify-unsubscribe") return;
	const [tab] = await browser.tabs.query({ 
		active: true, currentWindow: true 
	});
	if (tab?.id) runClarifier(tab.id);
});