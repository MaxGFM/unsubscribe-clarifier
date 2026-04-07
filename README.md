# Unsubscribe Clarifier

A Firefox extension that highlights the button most likely to actually unsubscribe you from a mailing list.
Bypasses dark patterns like swapped "Cancel" and "Continue" labels.

## What it does
Runs only when you click the toolbar icon, select "Clarify unsubscribe buttons" from the right-click menu, or press Ctrl+Shift+U. 
It inspects the page's buttons, forms, and attributes and outlines the most likely real unsubscribe button in green. 
Up to two runners-up are outlined in dashed orange.

## What it does not do
- It does not auto-click anything. You are always in control.
- It does not run on every page. It only runs when you invoke it.
- It does not send any data anywhere. All analysis happens locally in your browser.
- It does not guarantee correctness. A motivated dark-pattern designer can defeat these heuristics. Always read the button before clicking.

## Permissions
- `activeTab`: temporarily access the current tab when you explicitly invoke the extension.
- `scripting`: inject the analysis script into that tab.
- `menus`: add the right-click menu item.

No host permissions. No storage. No network.

## Installing
Install from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/unsubscribe-clarifier/) (not yet published as of this writing).

For development: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" → pick `manifest.json`.

## Building
`./build.sh`
Produces a reproducible .xpi. Anyone with this source tree at the same commit will produce a byte-identical file.

## Verifying a release
`./verify.sh path/to/downloaded.xpi`
Confirms that a downloaded release matches what this source tree would build.

## Security
See [SECURITY.md](SECURITY.md) for reporting vulnerabilities and [RELEASING.md](RELEASING.md) if you believe this project is compromised.

## License
See [LICENSE](LICENSE).