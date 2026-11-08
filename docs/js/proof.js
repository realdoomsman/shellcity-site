// shellcity.fun/proof/: reads the launch record from the backend when the page opens. A 404 means $SHELL has not
// launched yet. Recordings come from proof/recordings.json, a static list the owner fills in: [{ title, url, sha256 }].
(() => {
	const API = "https://api.shellcity.fun/shell/proof";
	const RECORDINGS = "/proof/recordings.json";

	const $ = (id) => document.getElementById(id);
	const base58 = (s, min, max) => typeof s === "string" && s.length >= min && s.length <= max && /^[1-9A-HJ-NP-Za-km-z]+$/.test(s);
	const isSig = (s) => base58(s, 64, 88);
	const isMint = (s) => base58(s, 32, 44);
	const isSlot = (n) => Number.isSafeInteger(n) && n >= 0;

	function headline(text, lede) {
		$("proof-headline").textContent = text;
		$("proof-lede").textContent = lede;
	}

	function link(el, href, text) {
		el.href = href;
		el.textContent = text;
	}

	function show(p) {
		const user = String(p.robloxUserId);
		const valid = isSig(p.signature) && isSig(p.transferSignature) && isMint(p.mint)
			&& isSlot(p.slot) && isSlot(p.transferSlot)
			&& typeof p.memo === "string" && typeof p.jobId === "string" && p.jobId !== ""
			&& Number.isSafeInteger(p.placeVersion) && /^[1-9][0-9]{0,18}$/.test(user);
		if (!valid) {
			headline("Launch record unreadable", "The launch record came back in a shape this page does not recognise. Try again later.");
			return;
		}
		headline("$SHELL was launched from inside Shell City, a Roblox game",
			"The transactions, the memo, the game server and the Roblox account are all public records. Open each one and check it.");

		const tx = (sig) => `https://solscan.io/tx/${sig}`;
		link($("tx-launch"), tx(p.signature), p.signature);
		$("tx-launch-slot").textContent = `slot ${p.slot}`;
		link($("tx-transfer"), tx(p.transferSignature), p.transferSignature);
		$("tx-transfer-slot").textContent = `slot ${p.transferSlot}`;
		link($("mint"), `https://solscan.io/token/${p.mint}`, p.mint);
		$("job-id").textContent = p.jobId;
		$("place-version").textContent = String(p.placeVersion);
		link($("roblox-user"), `https://www.roblox.com/users/${user}/profile`, `roblox.com/users/${user}/profile`);
		$("memo").textContent = p.memo;
		$("memo-tx").href = tx(p.signature);
		$("launch").hidden = false;

		loadRecordings();
	}

	async function loadRecordings() {
		$("recordings").hidden = false;
		let list = [];
		try {
			const res = await fetch(RECORDINGS, { cache: "no-cache" });
			if (res.ok) list = await res.json();
		} catch {
			list = [];
		}
		const items = (Array.isArray(list) ? list : []).filter((r) => r && typeof r.title === "string" && r.title !== ""
			&& typeof r.url === "string" && /^https?:\/\//.test(r.url)
			&& typeof r.sha256 === "string" && /^[0-9a-fA-F]{64}$/.test(r.sha256));
		const ul = $("recordings-list");
		for (const r of items) {
			const li = document.createElement("li");
			const a = document.createElement("a");
			a.rel = "noopener";
			link(a, r.url, r.title);
			const hash = document.createElement("code");
			hash.textContent = `sha256 ${r.sha256.toLowerCase()}`;
			li.append(a, hash);
			ul.append(li);
		}
		$("recordings-empty").hidden = items.length > 0;
	}

	(async () => {
		let res;
		try {
			res = await fetch(API, { cache: "no-store", headers: { accept: "application/json" } });
		} catch {
			headline("Can't reach the launch record", "The launch record could not be loaded. Check your connection and try again later.");
			return;
		}
		if (res.status === 404) {
			headline("Not launched yet", "$SHELL has not launched. When it does, this page shows the public transactions and Roblox records of the launch.");
			return;
		}
		let body = null;
		if (res.ok) {
			try { body = await res.json(); } catch { body = null; }
		}
		if (!body || typeof body !== "object") {
			headline("Can't reach the launch record", "The launch record could not be loaded. Try again later.");
			return;
		}
		show(body);
	})();
})();
