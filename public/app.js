const WISP = "wss://wisp.mercurywork.shop/";
const SEARCH = "https://www.google.com/search?q=%s";
const PANIC = "https://classroom.google.com";
const CLOAK_TITLE = "Untitled document - Google Docs";
const CLOAK_ICON = "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico";

const landing = document.getElementById("landing");
const bar = document.getElementById("bar");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const address = document.getElementById("address");

let scramjet = null;
let connection = null;
let frame = null;
let current = null;
let booted = false;

function toUrl(input) {
  try { return new URL(input).toString(); } catch {}
  try {
    const u = new URL(`http://${input}`);
    if (u.hostname.includes(".")) return u.toString();
  } catch {}
  return SEARCH.replace("%s", encodeURIComponent(input));
}

async function boot() {
  if (booted) return;
  booted = true;
  statusEl.textContent = "starting";

  const { ScramjetController } = $scramjetLoadController();
  scramjet = new ScramjetController({
    files: {
      wasm: "/scram/scramjet.wasm.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js",
    },
  });
  await scramjet.init();

  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  connection = new BareMux.BareMuxConnection("/baremux/worker.js");
  if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
    await connection.setTransport("/epoxy/index.mjs", [{ wisp: WISP }]);
  }
}

async function go(url) {
  try {
    await boot();
  } catch (err) {
    errorEl.textContent = `Could not start: ${err}`;
    booted = false;
    throw err;
  }

  current = url;
  document.body.classList.add("browsing");

  if (!frame) {
    frame = scramjet.createFrame();
    frame.frame.id = "sj-frame";
    document.body.appendChild(frame.frame);
  }
  frame.go(url);
  statusEl.textContent = new URL(url).hostname;
}

document.getElementById("go").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = address.value.trim();
  if (v) go(toUrl(v));
});

document.querySelectorAll(".chips button").forEach((b) => {
  b.addEventListener("click", () => go(b.dataset.url));
});

document.getElementById("home").addEventListener("click", () => {
  if (frame) { frame.frame.remove(); frame = null; }
  document.body.classList.remove("browsing");
  address.focus();
});

document.getElementById("reload").addEventListener("click", () => {
  if (frame && current) frame.go(current);
});

document.getElementById("cloaked").addEventListener("click", () => {
  const tab = window.open("about:blank", "_blank");
  if (!tab) return;
  tab.document.write(`<!doctype html><title>${CLOAK_TITLE}</title>
    <link rel="icon" href="${CLOAK_ICON}">
    <body style="margin:0;background:#fff">
    <iframe src="${location.origin}" style="border:0;width:100vw;height:100vh"></iframe>`);
  tab.document.close();
});

// panic key
addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
    location.replace(PANIC);
  }
  if (e.key === "/" && !document.body.classList.contains("browsing")) {
    e.preventDefault();
    address.focus();
  }
});

// spoof tab while on the landing page
function cloak() {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = CLOAK_ICON;
  document.title = CLOAK_TITLE;
  new MutationObserver(() => {
    if (document.title !== CLOAK_TITLE) document.title = CLOAK_TITLE;
  }).observe(document.querySelector("title") || document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

cloak();
address.focus();