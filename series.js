/* Interactive Research Summaries: moving between the six papers, and the words about the project.

   Every paper page loads this file. It adds two things to the page:

   1. A list that stays down the left side of the window. It names all six papers, marks the one
      being read with a coloured background, and leads to each. Under the papers is "About this
      project". At the foot is a way to ask for another paper, which opens an email.
      On a narrow screen there is no room for it, so it slides in from the left when the button at
      the foot of the window is pressed.
   2. "About this project": the words about the series, in a dialog. It closes with the Close
      button, with Escape, or with a click anywhere outside it. Adding #about to the address
      opens it.

   The order of the papers is the list below. To change the order, change the list. */
(() => {
  const PAPERS = [
    { file: "Moving Clocks.dc.html", title: "Einstein’s slow clocks", cite: "Einstein, Annalen der Physik, 1905" },
    { file: "Ingressing Minds.dc.html", title: "Ingressing Minds", cite: "Levin, Philosophies, 2026" },
    { file: "Sleep and the Brain.dc.html", title: "Does sleep clean the brain?", cite: "Xie and others, Science, 2013" },
    { file: "Thinking by Hand.dc.html", title: "Why handwriting still wins", cite: "Mueller and Oppenheimer, Psychological Science, 2014" },
    { file: "Caffeine After Study.dc.html", title: "Timing of caffeine matters when studying", cite: "Borota and others, Nature Neuroscience, 2014" },
    { file: "Contagious Yawning.dc.html", title: "Are yawns contagious?", cite: "Gallup and Eldakar, Frontiers in Evolutionary Neuroscience, 2011" },
  ];
  const REQUEST = "mailto:zula@sas.upenn.edu?subject=" + encodeURIComponent("Paper request");

  const here = decodeURIComponent(location.pathname.split("/").pop() || "");
  const at = PAPERS.findIndex((p) => p.file === here);
  if (at < 0) return;                       // not one of the six papers: nothing to add
  const n = PAPERS.length;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const href = (p) => encodeURI(p.file);
  const two = (i) => String(i + 1).padStart(2, "0");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const SLIDE = 260;                        // how long the coloured background takes to slide, in milliseconds

  const style = document.createElement("style");
  style.textContent = `
    :root { --series-w: 256px; --series-ease: cubic-bezier(.3, .7, .2, 1); }

    .series-nav {
      position: fixed; z-index: 60; top: 0; bottom: 0; left: 0; width: var(--series-w);
      display: flex; flex-direction: column; overflow-y: auto;
      background: var(--color-neutral-100, #f8f4f4); color: var(--color-text, #201f1d);
      border-right: 1px solid var(--color-neutral-300, #d7d3d3);
      font-family: var(--font-body, Georgia, serif); font-size: 15px; line-height: 1.3;
    }
    .series-nav a, .series-nav button { color: inherit; text-decoration: none; font: inherit; background: none; border: 0; cursor: pointer; text-align: left; }
    .series-eyebrow, .series-about-btn, .series-about-bar span, .series-about h3 {
      font-family: var(--font-heading, Georgia, serif); font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
      color: var(--color-accent-700, #7d5411);
    }
    .series-head { display: grid; gap: 8px; padding: 26px 24px 18px; }
    .series-title { margin: 0; font-family: var(--font-heading, Georgia, serif); font-weight: 600; font-size: 23px; line-height: 1.1; }
    .series-eyebrow { margin: 0; }

    /* The six papers. The coloured background is one piece that slides from paper to paper. */
    .series-papers { position: relative; padding: 0 12px; }
    .series-hl {
      position: absolute; left: 12px; right: 12px; top: 0; height: 0; border-radius: 8px;
      background: var(--color-accent-200, #ffe3bf); box-shadow: inset 0 0 0 1px var(--color-accent-300, #facb8d);
    }
    .series-hl.moves { transition: transform ${SLIDE}ms var(--series-ease), height ${SLIDE}ms var(--series-ease); }
    .series-list { position: relative; margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }
    .series-list a {
      display: grid; grid-template-columns: 24px 1fr; gap: 8px; align-items: baseline; padding: 11px 12px; border-radius: 8px;
      color: var(--color-neutral-800, #444141); transition: background-color .18s ease, color .18s ease;
    }
    .series-list a:hover { background: var(--color-neutral-200, #eae7e7); color: var(--color-text, #201f1d); }
    .series-list i {
      font-style: normal; font-family: var(--font-heading, Georgia, serif); font-size: 12px; font-weight: 600; letter-spacing: .08em;
      font-variant-numeric: tabular-nums; color: var(--color-accent-700, #7d5411);
    }
    .series-list b { font-family: var(--font-heading, Georgia, serif); font-weight: 500; font-size: 18px; line-height: 1.2; text-wrap: balance; }
    .series-list a.now, .series-list a.now:hover { background: none; color: var(--color-text, #201f1d); }
    .series-list a.now b { font-weight: 600; }

    .series-about-btn {
      display: flex; align-items: center; gap: 10px; margin: 12px 12px 0; padding: 14px 12px 12px; border-radius: 0 0 8px 8px;
      border-top: 1px solid var(--color-neutral-300, #d7d3d3) !important;
      font-family: var(--font-heading, Georgia, serif) !important; font-size: 12px !important; font-weight: 600 !important;
      transition: background-color .18s ease;
    }
    .series-about-btn:hover { background: var(--color-neutral-200, #eae7e7); }
    .series-about-btn svg { flex: none; width: 15px; height: 15px; stroke: currentColor; stroke-width: 1.4; fill: none; stroke-linecap: round; }

    /* The foot of the list: asking for another paper. */
    .series-ask { margin-top: auto; padding: 18px 24px max(22px, env(safe-area-inset-bottom, 0px)); display: grid; gap: 12px; justify-items: start; }
    .series-ask::before { content: ""; justify-self: stretch; height: 1px; margin: 14px 0 6px; background: var(--color-neutral-300, #d7d3d3); }
    .series-ask p { margin: 0; font-size: 15px; line-height: 1.45; }
    .series-request {
      display: inline-flex; align-items: center; gap: 9px; padding: 10px 18px; border-radius: 999px;
      font-family: var(--font-heading, Georgia, serif) !important; font-size: 13px !important; font-weight: 600 !important; letter-spacing: .14em; text-transform: uppercase;
      background: var(--color-text, #201f1d) !important; color: var(--color-bg, #f3f2f2) !important;
      transition: background-color .18s ease, transform .18s ease;
    }
    .series-request:hover { background: var(--color-accent-800, #5a3b0a) !important; }
    .series-request:active { transform: scale(.97); }
    .series-request svg { width: 15px; height: 12px; stroke: currentColor; stroke-width: 1.3; fill: none; stroke-linejoin: round; stroke-linecap: round; }

    /* Only on a narrow screen: the button that opens the list, the Close button, the shade behind. */
    .series-open, .series-shut, .series-shade { display: none; }

    @media (min-width: 1080px) {
      body { padding-left: var(--series-w); }
    }
    @media (max-width: 1079.98px) {
      body { padding-bottom: 88px; }
      .series-nav {
        width: min(320px, 88vw); z-index: 80; overscroll-behavior: contain; box-shadow: 0 0 60px -10px rgba(0, 0, 0, .5);
        transform: translateX(-104%); visibility: hidden;
        transition: transform .3s var(--series-ease), visibility 0s .3s;
      }
      .series-nav.open { transform: none; visibility: visible; transition: transform .3s var(--series-ease), visibility 0s; }
      .series-head { grid-template-columns: 1fr auto; align-items: start; padding-right: 14px; }
      .series-eyebrow { grid-column: 1 / -1; }
      .series-shut {
        display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px;
        font-family: var(--font-heading, Georgia, serif) !important; font-size: 12px !important; font-weight: 600 !important; letter-spacing: .12em; text-transform: uppercase;
        border: 1px solid var(--color-neutral-400, #bab6b6) !important;
      }
      .series-shut svg { width: 10px; height: 10px; stroke: currentColor; stroke-width: 1.8; fill: none; stroke-linecap: round; }
      .series-shade {
        display: block; position: fixed; inset: 0; z-index: 70; background: rgba(20, 18, 16, .5);
        opacity: 0; pointer-events: none; transition: opacity .3s ease;
      }
      .series-shade.open { opacity: 1; pointer-events: auto; }
      .series-open {
        position: fixed; left: 50%; bottom: max(16px, env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 60;
        display: flex; align-items: center; gap: 14px; width: max-content; max-width: calc(100vw - 20px); padding: 10px 22px 10px 18px;
        background: var(--color-neutral-100, #f8f4f4); color: var(--color-text, #201f1d);
        border: 1px solid var(--color-neutral-300, #d7d3d3); border-radius: 999px; cursor: pointer;
        box-shadow: 0 14px 40px -12px rgba(0, 0, 0, .45);
        font-family: var(--font-body, Georgia, serif); line-height: 1.2; text-align: left;
      }
      .series-open svg { flex: none; width: 18px; height: 14px; stroke: var(--color-accent-700, #7d5411); stroke-width: 1.6; fill: none; stroke-linecap: round; }
      .series-open span { display: grid; gap: 2px; }
      .series-open small { font-family: var(--font-heading, Georgia, serif); font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--color-accent-700, #7d5411); }
      .series-open b { font-family: var(--font-heading, Georgia, serif); font-weight: 600; font-size: 18px; white-space: nowrap; }
    }
    @media (prefers-reduced-motion: reduce) {
      .series-hl.moves, .series-nav, .series-nav.open, .series-shade, .series-list a { transition: none; }
    }
    @media print { .series-nav, .series-open, .series-shade { display: none !important; } body { padding-left: 0; } }

    dialog.series-about {
      width: min(660px, calc(100vw - 28px)); max-height: min(88vh, 800px); padding: 0; overflow: hidden;
      border: 1px solid var(--color-neutral-300, #d7d3d3); border-radius: 10px;
      background: var(--color-bg, #f3f2f2); color: var(--color-text, #201f1d);
      box-shadow: 0 30px 80px -20px rgba(0, 0, 0, .55);
      font-family: var(--font-body, Georgia, serif);
    }
    dialog.series-about[open] { display: flex; flex-direction: column; }
    dialog.series-about::backdrop { background: rgba(20, 18, 16, .55); }
    .series-about-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 14px 12px 28px; border-bottom: 1px solid var(--color-neutral-300, #d7d3d3); }
    .series-about-bar span, .series-about h3 { letter-spacing: .18em; }
    .series-close {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; cursor: pointer;
      font-family: var(--font-heading, Georgia, serif); font-size: 13px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
      color: inherit; background: none; border: 1px solid var(--color-neutral-400, #bab6b6);
    }
    .series-close:hover { border-color: var(--color-text, #201f1d); }
    .series-close svg { width: 10px; height: 10px; stroke: currentColor; stroke-width: 1.8; fill: none; stroke-linecap: round; }
    .series-about-in { overflow-y: auto; padding: 26px 28px 32px; display: grid; gap: 12px; }
    .series-about h2 { margin: 0; font-family: var(--font-heading, Georgia, serif); font-weight: 600; font-size: 36px; line-height: 1.1; }
    .series-about h3 { margin: 14px 0 0; }
    .series-about p, .series-about li { margin: 0; font-size: 16.5px; line-height: 1.55; }
    .series-about p.lede { font-size: 19px; font-style: italic; }
    .series-about ol, .series-about ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
    .series-about ol { counter-reset: step; }
    .series-about ol li { counter-increment: step; padding-left: 30px; position: relative; }
    .series-about ol li::before {
      content: counter(step, decimal-leading-zero); position: absolute; left: 0; top: 3px;
      font-family: var(--font-heading, Georgia, serif); font-size: 13px; font-weight: 600; letter-spacing: .08em; color: var(--color-accent-700, #7d5411);
    }
    .series-about ul a { color: inherit; text-decoration: underline; text-decoration-color: var(--color-accent-400, #e1ad66); text-underline-offset: 3px; }
    .series-about ul a:hover { text-decoration-color: currentColor; }
    .series-about ul small { font-size: 14px; color: var(--color-neutral-700, #605d5d); }
  `;

  const cross = `<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1l-8 8"/></svg>`;

  /* The list down the left side. */
  const nav = document.createElement("nav");
  nav.className = "series-nav";
  nav.id = "series-nav";
  nav.setAttribute("aria-label", "The six papers");
  nav.innerHTML = `
    <div class="series-head">
      <p class="series-title">Interactive Research Summaries</p>
      <button type="button" class="series-shut">${cross}Close</button>
      <p class="series-eyebrow">Viewing paper ${at + 1} of ${n}</p>
    </div>
    <div class="series-papers">
      <span class="series-hl" aria-hidden="true"></span>
      <ol class="series-list">${PAPERS.map((p, i) => `
        <li><a href="${href(p)}"${i === at ? ' class="now" aria-current="page"' : ""}><i>${two(i)}</i><b>${esc(p.title)}</b></a></li>`).join("")}
      </ol>
    </div>
    <button type="button" class="series-about-btn" aria-haspopup="dialog"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6"/><path d="M8 7.2v4M8 4.7v.1"/></svg>About this project</button>
    <div class="series-ask">
      <p>Have a paper in mind? I’ll make it for you.</p>
      <a class="series-request" href="${REQUEST}"><svg viewBox="0 0 16 12" aria-hidden="true"><rect x="1" y="1" width="14" height="10" rx="1.5"/><path d="M1.5 1.8 8 6.8l6.5-5"/></svg>Request</a>
    </div>`;

  /* On a narrow screen: the button that slides the list in, and the shade behind it. */
  const opener = document.createElement("button");
  opener.type = "button";
  opener.className = "series-open";
  opener.setAttribute("aria-controls", "series-nav");
  opener.setAttribute("aria-expanded", "false");
  opener.setAttribute("aria-label", `All six papers. Viewing paper ${at + 1} of ${n}`);
  opener.innerHTML = `<svg viewBox="0 0 18 14" aria-hidden="true"><path d="M1 1.5h16M1 7h16M1 12.5h10"/></svg><span><small>Viewing</small><b>Paper ${at + 1} of ${n}</b></span>`;
  const shade = document.createElement("div");
  shade.className = "series-shade";

  const slide = (on) => {
    nav.classList.toggle("open", on);
    shade.classList.toggle("open", on);
    opener.setAttribute("aria-expanded", String(on));
  };
  opener.addEventListener("click", () => slide(true));
  shade.addEventListener("click", () => slide(false));
  nav.querySelector(".series-shut").addEventListener("click", () => slide(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) slide(false); });

  /* The coloured background behind the paper being read. It is one piece, so that a click can
     slide it to the paper chosen before the page changes. */
  const hl = nav.querySelector(".series-hl");
  const list = nav.querySelector(".series-list");
  const links = [...list.querySelectorAll("a")];
  let marked = links[at];
  const settle = () => {
    if (!marked.offsetHeight) return;       // not drawn yet
    const top = marked.offsetTop + list.offsetTop;
    hl.style.transform = `translateY(${top}px)`;
    hl.style.height = `${marked.offsetHeight}px`;
  };
  const mark = (a) => {
    marked = a;
    links.forEach((l) => l.classList.toggle("now", l === a));
    settle();
  };
  list.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a === links[at]) {                  // already on this paper: back to its top
      e.preventDefault();
      slide(false);
      scrollTo({ top: 0, behavior: calm.matches ? "auto" : "smooth" });
      return;
    }
    if (calm.matches) return;               // no sliding asked for: go straight there
    e.preventDefault();
    hl.classList.add("moves");
    mark(a);
    setTimeout(() => { location.href = a.href; }, SLIDE);
  });
  /* Coming back with the Back button can show this page as it was left. Put the mark back. */
  addEventListener("pageshow", (e) => { if (e.persisted) { hl.classList.remove("moves"); mark(links[at]); slide(false); } });

  const about = document.createElement("dialog");
  about.className = "series-about";
  about.setAttribute("aria-labelledby", "series-about-title");
  about.innerHTML = `
    <div class="series-about-bar">
      <span>About this project</span>
      <button type="button" class="series-close">${cross}Close</button>
    </div>
    <div class="series-about-in">
      <h2 id="series-about-title">Interactive Research Summaries</h2>
      <p class="lede">Six research papers, each explained in simple terms, with interactive visuals.</p>
      <h3>What it is</h3>
      <p>Each page takes one paper and explains it for a reader with no background in the field, in about ten minutes. It opens with the whole paper in three lines, and each line leads to a small experiment to run on the page.</p>
      <h3>The six papers</h3>
      <ul>${PAPERS.map((p) => `<li><a href="${href(p)}">${esc(p.title)}</a> <small>${esc(p.cite)}</small></li>`).join("")}</ul>
      <h3>What I did</h3>
      <ol>
        <li>Chose the papers.</li>
        <li>Read each one closely.</li>
        <li>Built something to try for each claim.</li>
        <li>Designed and shipped the series. It is hosted on GitHub Pages.</li>
      </ol>
    </div>`;

  const open = () => { slide(false); if (!about.open) about.showModal(); };
  nav.querySelector(".series-about-btn").addEventListener("click", open);
  about.querySelector(".series-close").addEventListener("click", () => about.close());
  about.addEventListener("click", (e) => { if (e.target === about) about.close(); });   // a click outside the words

  /* The page is drawn by its own script, which may redraw the body. Put everything back if that
     ever removes it. */
  const place = () => {
    if (!document.body) return;
    if (!style.isConnected) document.head.append(style);
    if (!nav.isConnected) document.body.append(nav);
    if (!shade.isConnected) document.body.append(shade);
    if (!opener.isConnected) document.body.append(opener);
    if (!about.isConnected) document.body.append(about);
    settle();
  };
  const start = () => {
    place();
    new MutationObserver(place).observe(document.body, { childList: true });
    new ResizeObserver(settle).observe(list);            // the papers' names wrap differently as the fonts load
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
    if (location.hash === "#about") open();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
