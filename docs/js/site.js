// shellcity.fun: the nav's backdrop once you scroll, the phone menu, and
// sections easing in as they arrive. Nothing else runs.
(() => {
	const nav = document.getElementById("nav");
	const solid = () => nav.classList.toggle("solid", window.scrollY > 40 || !document.querySelector(".hero"));
	solid();
	window.addEventListener("scroll", solid, { passive: true });

	const toggle = nav.querySelector(".nav-toggle");
	const links = document.getElementById("links");
	toggle.addEventListener("click", () => {
		const open = links.classList.toggle("open");
		toggle.setAttribute("aria-expanded", String(open));
	});
	links.addEventListener("click", (e) => {
		if (e.target.closest("a")) {
			links.classList.remove("open");
			toggle.setAttribute("aria-expanded", "false");
		}
	});

	const items = document.querySelectorAll(".reveal");
	if ("IntersectionObserver" in window) {
		const io = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add("in");
					io.unobserve(entry.target);
				}
			}
		}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
		items.forEach((el) => io.observe(el));
	} else {
		items.forEach((el) => el.classList.add("in"));
	}

	// The hero loop (about 7 MB) only loads on a wide screen with motion allowed and no save-data flag.
	// Phones, metered links and reduced-motion visitors keep the still poster.
	const video = document.querySelector(".hero video");
	const conn = navigator.connection;
	const lean = conn && (conn.saveData || /2g/.test(conn.effectiveType || ""));
	if (video && !lean && matchMedia("(min-width: 760px) and (prefers-reduced-motion: no-preference)").matches) {
		video.querySelectorAll("source[data-src]").forEach((s) => { s.src = s.dataset.src; });
		video.load();
		video.play().catch(() => {});
	}

	const year = document.getElementById("year");
	if (year) year.textContent = String(new Date().getFullYear());
})();
