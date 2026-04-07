(() => {
	// Idempotent re-run: if already loaded, just re-annotate.
	if (window.__unsubscribeClarifierLoaded) {
		window.__unsubscribeClarifierAnnotate?.();
	return;
	}

	window.__unsubscribeClarifierLoaded = true;

	const { UNIVERSAL_ATTRIBUTE_SIGNALS, normalizeText, getLexicon } = window.__UC_LEXICONS;

	// Private state — held in closure, not exposed to the page.
	const reasonsByElement = new WeakMap();
	const originalStylesByElement = new WeakMap();
	const markedElements = new Set();

	const MAX_ELEMENTS_WALKED = 10000;
	const MAX_CONTEXT_LENGTH = 50000;
	const MAX_SHADOW_HOPS = 100;

	// Language detection, defaults to English
	function detectPageLanguage() {
		const htmlLang = document.documentElement.getAttribute("lang");
		if (htmlLang) return htmlLang;
		const meta = document.querySelector('meta[http-equiv="content-language"]');
		if (meta?.content) return meta.content;
		return null;
	}

	const pageLang = detectPageLanguage();
	const { primary: lex, fallback: lexFallback } = getLexicon(pageLang);

	// Bounded DOM walking, including open shadow roots
	function* walkAllElements(root, budget) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
		let node = walker.currentNode;
		while (node && budget.remaining > 0) {
			budget.remaining--;
			yield node;
			if (node.shadowRoot) yield* walkAllElements(node.shadowRoot, budget);
			node = walker.nextNode();
		}
	}

	function closestAcrossShadows(el, selector) {
		let node = el;
		let hops = 0;
		while (node && hops++ < MAX_SHADOW_HOPS) {
			if (node.nodeType === Node.ELEMENT_NODE && node.matches?.(selector)) return node;
			if (node.parentNode) {
				node = node.parentNode;
				if (node instanceof ShadowRoot) node = node.host;
			} else {
				return null;
			}
		}
		return null;
	}

	function matchesCandidateSelector(el) {
		const tag = el.tagName;
		if (tag === "BUTTON") return true;
		if (tag === "A" && el.hasAttribute("href")) return true;
		if (tag === "INPUT") {
			const t = (el.type || "").toLowerCase();
			return t === "submit" || t === "button";
		}
		if (el.getAttribute?.("role") === "button") return true;
		return false;
	}

	function findCandidates() {
		const results = [];
		const budget = { remaining: MAX_ELEMENTS_WALKED };
		for (const el of walkAllElements(document, budget)) {
			if (!matchesCandidateSelector(el)) continue;
			const rect = el.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) results.push(el);
		}
		if (budget.remaining <= 0) {
			console.warn("[Unsubscribe Clarifier] DOM walk budget exceeded; results may be incomplete.");
		}
		return results;
	}

	// Signal extraction
	function getOwnText(el) {
		return normalizeText(el.textContent || el.value || "");
	}

	function getAllAttributeSignals(el) {
		const parts = [
			el.getAttribute("aria-label") || "",
			el.getAttribute("title") || "",
			el.getAttribute("name") || "",
			el.getAttribute("value") || "",
			el.getAttribute("id") || "",
			el.className || "",
			el.getAttribute("href") || ""
		];
		for (const attr of el.attributes || []) {
			if (attr.name.startsWith("data-")) parts.push(attr.value);
		}
		return normalizeText(parts.join(" "));
	}

	function getFormSignals(el) {
		const form = closestAcrossShadows(el, "form");
		if (!form) return "";
		const parts = [
			form.getAttribute("action") || "",
			form.getAttribute("name") || "",
			form.getAttribute("id") || ""
		];
		form.querySelectorAll("input[type=hidden]").forEach(i => {
			parts.push(i.name || "", i.value || "");
		});
		return normalizeText(parts.join(" "));
	}

	function getContextText(el) {
		let node = el.parentElement;
		let depth = 0;
		while (node && depth < 3) {
			const raw = node.textContent || "";
			if (raw.length > MAX_CONTEXT_LENGTH) return "";
			const txt = raw.trim();
			if (txt.length > 20 && txt.length < 600) return normalizeText(txt);
			node = node.parentElement;
			depth++;
		}
		return "";
	}

	// Scoring 
	function scoreCandidate(el) {
		const ownText = getOwnText(el);
		const attrSignals = getAllAttributeSignals(el);
		const formSignals = getFormSignals(el);
		const context = getContextText(el);

		let score = 0;
		const reasons = [];

		// Positive matches in the page's primary language
		for (const phrase of lex.positive) {
			const p = normalizeText(phrase);
			if (ownText.includes(p)) { 
				score += 10; 
				reasons.push(`label: "${phrase}"`);
			}
			else if (attrSignals.includes(p)) { 
				score += 6;
				reasons.push(`attribute: "${phrase}"`);
			}
			if (formSignals.includes(p)) {
				score += 5;
				reasons.push(`form: "${phrase}"`);
			}
		}

		// English fallback — attributes only, since visible text is in the page's language
		if (lexFallback) {
			for (const phrase of lexFallback.positive) {
				const p = normalizeText(phrase);
				if (attrSignals.includes(p)) {
					score += 4;
					reasons.push(`attribute (en): "${phrase}"`);
				}
				if (formSignals.includes(p)) {
					score += 4;
					reasons.push(`form (en): "${phrase}"`);
				}
			}
		}

		// Universal attribute signals (URL/class conventions are English-dominant)
		for (const phrase of UNIVERSAL_ATTRIBUTE_SIGNALS) {
			if (attrSignals.includes(phrase)) {
				score += 3;
				reasons.push(`convention: "${phrase}"`);
			}
			if (formSignals.includes(phrase)) {
				score += 4;
				reasons.push(`form convention: "${phrase}"`);
			}
		}

		// Negative matches in the page's language
		for (const phrase of lex.negative) {
			const p = normalizeText(phrase);
			if (ownText.includes(p)) {
				score -= 8;
				reasons.push(`anti-label: "${phrase}"`);
			}
		}

		// Ambiguous labels: small boost only if the surrounding form/context
    	// looks like an unsubscribe flow
		const contextLooksUnsub =
			lex.positive.some(p => context.includes(normalizeText(p)) || formSignals.includes(normalizeText(p))) ||
			UNIVERSAL_ATTRIBUTE_SIGNALS.some(p => formSignals.includes(p));

		for (const phrase of lex.ambiguous) {
			const p = normalizeText(phrase);
			if (ownText === p || ownText.startsWith(p + " ")) {
				if (contextLooksUnsub) {
					if (lex.ambiguousAbort.map(normalizeText).includes(p)) {
						score -= 3;
						reasons.push(`ambiguous abort-word in unsub context: "${phrase}"`);
					} else {
						score += 2;
						reasons.push(`ambiguous word in unsub context: "${phrase}"`);
					}
				}
			}
		}
		return { score, reasons, ownText };
	}

	// Markup and cleanup
	function isInShadowRoot(el) {
		return el.getRootNode() instanceof ShadowRoot;
	}

	function markElement(el, kind) {
		const className = kind === "likely" ? "uc-likely-unsubscribe" : "uc-possible-unsubscribe";
		el.classList.add(className);
		markedElements.add(el);

		if (isInShadowRoot(el)) {
			// Save the original inline styles so we can restore them exactly
			originalStylesByElement.set(el, {
				outline: el.style.outline,
				outlineOffset: el.style.outlineOffset,
				boxShadow: el.style.boxShadow
			});
			if (kind === "likely") {
				el.style.outline = "3px solid #00c853";
				el.style.outlineOffset = "2px";
				el.style.boxShadow = "0 0 0 3px rgba(0, 200, 83, 0.3)";
			} else {
				el.style.outline = "2px dashed #ffa000";
				el.style.outlineOffset = "2px";
			}
		}
	}

	function unmarkElement(el) {
		el.classList.remove("uc-likely-unsubscribe", "uc-possible-unsubscribe");
		const original = originalStylesByElement.get(el);
		if (original) {
			el.style.outline = original.outline;
			el.style.outlineOffset = original.outlineOffset;
			el.style.boxShadow = original.boxShadow;
			originalStylesByElement.delete(el);
		}
		reasonsByElement.delete(el);
	}

	function clearPreviousMarks() {
		for (const el of markedElements) {
			try { unmarkElement(el); } catch {}
		}
		markedElements.clear();
	}

	// Annotation
	function annotate() {
		try {
			clearPreviousMarks();

			const scored = findCandidates()
			.map(el => ({ el, ...scoreCandidate(el) }))
			.filter(c => c.score > 0)
			.sort((a, b) => b.score - a.score);

			if (scored.length === 0) {
				console.log("[Unsubscribe Clarifier] No candidates found.");
			return;
			}

			const top = scored[0];
			markElement(top.el, "likely");
			reasonsByElement.set(top.el, top.reasons);

			scored.slice(1, 3).forEach(c => {
				markElement(c.el, "possible");
				reasonsByElement.set(c.el, c.reasons);
			});

			// Log to the content script console only — this is NOT page-accessible.
			console.log("[Unsubscribe Clarifier] Top candidates:",
			scored.slice(0, 3).map(c => ({ text: c.ownText, score: c.score, reasons: c.reasons })));
		} catch (err) {
			console.error("[Unsubscribe Clarifier] Annotation failed:", err);
			try { clearPreviousMarks(); } catch {}
		}
	}

	window.__unsubscribeClarifierAnnotate = annotate;
	annotate();
})();