// Per-language keyword lexicons. Always consult English as a fallback
// because URL paths, CSS classes, and aria-labels skew English globally.

const LEXICONS = {
	en: {
		positive: [
			"unsubscribe", "un-subscribe", "opt out", "opt-out", "opt_out",
			"remove me", "remove from list", "stop emails", "stop receiving",
			"cancel subscription", "cancel membership", "end subscription",
			"delete account", "turn off notifications"
		],
		negative: [
			"keep", "stay subscribed", "continue receiving", "not now",
			"maybe later", "go back", "nevermind", "never mind",
			"keep me subscribed", "resubscribe", "remain"
		],
		ambiguous: ["cancel", "continue", "confirm", "submit", "ok", "yes", "no"],
		ambiguousAbort: ["cancel"]
	},

	es: {
		positive: [
			"cancelar suscripción", "darse de baja", "baja", "eliminar",
			"dejar de recibir", "no quiero recibir", "cancelar membresía",
			"eliminar cuenta", "desuscribir"
		],
		negative: [
			"mantener", "seguir recibiendo", "continuar suscrito",
			"ahora no", "más tarde", "volver", "conservar"
		],
		ambiguous: ["cancelar", "continuar", "confirmar", "enviar", "aceptar", "sí", "no"],
		ambiguousAbort: ["cancelar"]
	},

	de: {
		positive: [
			"abmelden", "abbestellen", "kündigen", "austragen",
			"newsletter beenden", "abonnement beenden", "konto löschen",
			"nicht mehr erhalten", "benachrichtigungen deaktivieren"
		],
		negative: [
			"behalten", "weiter erhalten", "angemeldet bleiben",
			"nicht jetzt", "später", "zurück", "bleiben"
		],
		ambiguous: ["abbrechen", "weiter", "bestätigen", "senden", "ok", "ja", "nein"],
		ambiguousAbort: ["abbrechen"]
	},

	ja: {
		positive: [
			"配信停止", "購読解除", "退会", "解除", "停止する",
			"受信を停止", "メール停止", "アカウント削除",
			"オプトアウト", "メルマガ解除"
		],
		negative: [
			"継続", "引き続き受信", "購読を続ける",
			"後で", "キャンセル", "戻る", "維持"
		],
		ambiguous: ["キャンセル", "続ける", "確認", "送信", "はい", "いいえ", "ok"],
		ambiguousAbort: ["キャンセル", "戻る"]
	}
};

// Phrases that appear in URLs, class names, and IDs. These are
// language-independent because web conventions are English-dominant.
const UNIVERSAL_ATTRIBUTE_SIGNALS = [
	"unsubscribe", "unsub", "optout", "opt-out", "opt_out",
	"remove", "delete", "cancel-subscription", "cancelsubscription",
	"end-subscription", "endsubscription"
];

function normalizeText(s) {
	if (!s) return "";
	// NFKC folds full-width/half-width variants and compatibility forms.
  	// Lowercase handles Latin-script variants; harmless for CJK.
	return s.normalize("NFKC").toLowerCase();
}

function getLexicon(lang) {
	if (!lang) return { primary: LEXICONS.en, fallback: null };
	const base = lang.toLowerCase().split("-")[0];
	const primary = LEXICONS[base] || LEXICONS.en;
	// Always also check English as a fallback for attribute signals
	const fallback = base === "en" ? null : LEXICONS.en;
	return { primary, fallback };
}

// Exported via window assignment since content scripts injected via
// scripting.executeScript don't share a module system with background.
window.__UC_LEXICONS = { LEXICONS, UNIVERSAL_ATTRIBUTE_SIGNALS, normalizeText, getLexicon };