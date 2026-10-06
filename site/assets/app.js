(() => {
  "use strict";

  const body = document.body;
  const page = body.dataset.page || "public";
  const rootUrl = new URL(body.dataset.root || "./", document.baseURI);
  const frameIoUrl = "https://f.io/ridx8b_y";
  const routePaths = {
    home: "",
    broadcast: "broadcast/",
    coldwell: "coldwell/",
    contact: "contact/"
  };

  function routeUrl(route) {
    return new URL(routePaths[route] || "", rootUrl).href;
  }

  document.querySelectorAll("[data-route]").forEach((link) => {
    const route = link.dataset.route;
    if (Object.hasOwn(routePaths, route)) link.href = routeUrl(route);
  });

  const nav = document.querySelector(".nav-links");
  const navToggle = document.querySelector(".nav-toggle");
  if (nav && navToggle) {
    navToggle.hidden = false;
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open", !expanded);
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }

  const dialog = document.querySelector(".video-dialog");
  const player = dialog?.querySelector(".video-player");
  const dialogTitle = dialog?.querySelector("#video-dialog-title");
  const closeButton = dialog?.querySelector(".dialog-close");
  const frameFallback = dialog ? element("a", "frame-fallback", "Open in Frame.io ↗") : null;
  if (frameFallback) {
    frameFallback.target = "_blank";
    frameFallback.rel = "noopener noreferrer";
    frameFallback.hidden = true;
    dialog.append(frameFallback);
  }
  let framePlayer = null;
  let opener = null;

  function closeVideo() {
    if (!dialog?.open) return dialog?.close();
    dialog.close();
  }

  function stopVideo() {
    framePlayer?.remove();
    framePlayer = null;
    if (frameFallback) {
      frameFallback.hidden = true;
      frameFallback.removeAttribute("href");
    }
    if (player) {
      player.pause();
      player.removeAttribute("src");
      player.load();
    }
    const previousOpener = opener;
    opener = null;
    if (previousOpener?.isConnected) previousOpener.focus();
  }

  if (dialog && player) {
    closeButton?.addEventListener("click", closeVideo);
    dialog.addEventListener("close", stopVideo);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeVideo();
    });
  }

  function safeUrl(value, base = rootUrl) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim(), base);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function safeFrameUrl(value) {
    const href = safeUrl(value);
    if (!href) return null;
    const url = new URL(href);
    return url.protocol === "https:" &&
      ["next.frame.io", "frame.io", "f.io"].includes(url.hostname) ? href : null;
  }

  function applyLogo(manifest) {
    if (typeof manifest?.logo !== "string") return;
    const logoUrl = safeUrl(manifest.logo);
    if (!logoUrl) return;
    document.querySelectorAll(".brand").forEach((brand) => {
      const image = element("img", "brand-logo");
      image.src = logoUrl;
      image.alt = "filmstarr";
      brand.replaceChildren(image);
    });
  }

  async function loadBrandLogo() {
    try {
      const response = await fetch(new URL("assets/portfolio.json", rootUrl), { cache: "no-store" });
      if (!response.ok) return;
      applyLogo(await response.json());
    } catch {
      // Text wordmark remains the fallback when the manifest is unavailable.
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const broadcastTitles = [
    "The Counterfeiter",
    "Super League: The War for Football",
    "Dude Perfect: A Very Long Shot",
    "The B1G Moment",
    "MEL"
  ];

  function fallbackTitle(collection, index) {
    if (collection === "broadcast") return broadcastTitles[index] || `Editorial card ${index + 1}`;
    const prefix = collection === "coldwell" ? "Video" : "Film";
    return `${prefix} ${String(index + 1).padStart(2, "0")}`;
  }

  function appendMedia(visual, entry, title, canPlay) {
    const posterUrl = safeUrl(entry.poster);
    if (posterUrl) {
      const image = element("img", "work-image");
      image.src = posterUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.setAttribute("aria-hidden", "true");
      image.addEventListener("error", () => {
        image.remove();
        if (!visual.querySelector(".empty-media")) {
          visual.append(element("span", "empty-media", "✳"));
        }
      }, { once: true });
      visual.append(image);
    } else {
      visual.append(element("span", "empty-media", "✳"));
    }

    if (!canPlay && !posterUrl && !entry.sourceUrl && !entry.image) {
      visual.classList.add("work-visual--empty");
    }
    if (page === "broadcast") visual.classList.add("work-visual--artwork");
    if (page === "coldwell") visual.classList.add("work-visual--coldwell");
    if (!title) visual.setAttribute("aria-label", "Portfolio item");
  }

  function buildVideoCard(entry, index, collection) {
    const title = typeof entry.title === "string" && entry.title.trim()
      ? entry.title.trim()
      : fallbackTitle(collection, index);
    const source = safeUrl(entry.src);
    const frameUrl = safeFrameUrl(entry.frameUrl);
    const sourcePage = frameUrl || safeUrl(entry.sourceUrl);
    const canPlay = Boolean(frameUrl || source);
    const card = element("article", "work-card");
    const visualTag = canPlay ? "button" : (sourcePage ? "a" : "div");
    const visual = element(visualTag, "work-visual");

    if (canPlay) {
      visual.type = "button";
      visual.setAttribute("aria-label", `Play ${title}`);
      visual.addEventListener("click", () => {
        if (!dialog || !player || !dialogTitle) return;
        opener = visual;
        dialogTitle.textContent = title;
        player.hidden = Boolean(frameUrl);
        if (frameFallback) {
          frameFallback.hidden = !sourcePage;
          if (sourcePage) frameFallback.href = sourcePage;
        }
        if (frameUrl) {
          framePlayer = element("iframe", "frame-player");
          framePlayer.title = `Frame.io player: ${title}`;
          framePlayer.allow = "autoplay; fullscreen; picture-in-picture";
          framePlayer.allowFullscreen = true;
          framePlayer.referrerPolicy = "strict-origin-when-cross-origin";
          framePlayer.src = frameUrl;
          player.after(framePlayer);
        } else {
          player.src = source;
          player.load();
        }
        dialog.showModal();
        if (frameUrl) closeButton?.focus();
        else {
          player.focus();
          player.play().catch(() => {});
        }
      });
    } else if (sourcePage) {
      visual.href = sourcePage;
      visual.target = "_blank";
      visual.rel = "noopener noreferrer";
      visual.setAttribute("aria-label", `Open ${title} on Frame.io`);
    } else {
      visual.setAttribute("aria-label", `${title}; media link pending`);
    }

    appendMedia(visual, entry, title, canPlay);
    card.append(visual);

    const caption = element("div", "work-caption");
    caption.append(element("h3", "work-title", title));
    const detail = canPlay
      ? "Play film"
      : (sourcePage ? "Review on Frame.io" : "Source link pending");
    caption.append(element("p", "work-meta", detail));
    card.append(caption);
    return card;
  }

  function buildBroadcastCard(entry, index) {
    const title = typeof entry.title === "string" && entry.title.trim()
      ? entry.title.trim()
      : fallbackTitle("broadcast", index);
    const imageUrl = safeUrl(entry.image);
    const card = element("article", "work-card work-card--editorial");
    const visual = element("div", "work-visual work-visual--artwork");
    visual.setAttribute("aria-label", `${title} supplied artwork`);
    if (imageUrl) {
      const image = element("img", "work-image");
      image.src = imageUrl;
      image.alt = `Supplied artwork for ${title}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        image.remove();
        if (!visual.querySelector(".empty-media")) {
          visual.append(element("span", "empty-media", "Artwork unavailable"));
        }
      }, { once: true });
      visual.append(image);
    } else {
      visual.append(element("span", "empty-media", "Artwork unavailable"));
    }
    card.append(visual);
    const caption = element("div", "work-caption");
    caption.append(element("h3", "work-title", title));
    caption.append(element("p", "work-meta", "Supplied work card"));
    card.append(caption);
    return card;
  }

  function showUnavailable(grid, collection) {
    const message = collection === "broadcast"
      ? "The supplied work-card list is temporarily unavailable in this preview."
      : "The selected video list is temporarily unavailable in this preview.";
    grid.replaceChildren(element("p", "empty-media", message));
    const sourceLink = element("a", "text-link", "Open supplied Frame.io source");
    sourceLink.href = frameIoUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    grid.append(sourceLink);
  }

  async function loadPortfolio() {
    const grid = document.querySelector("[data-collection]");
    if (!grid) return;
    const collection = grid.dataset.collection;
    try {
      const response = await fetch(new URL("assets/portfolio.json", rootUrl), { cache: "no-store" });
      if (!response.ok) throw new Error(`Manifest request failed (${response.status})`);
      const manifest = await response.json();
      const items = Array.isArray(manifest[collection]) ? manifest[collection] : [];
      applyLogo(manifest);
      if (!items.length) {
        showUnavailable(grid, collection);
      } else {
        grid.replaceChildren(...items.map((entry, index) =>
          collection === "broadcast"
            ? buildBroadcastCard(entry, index)
            : buildVideoCard(entry, index, collection)
        ));
      }
    } catch {
      showUnavailable(grid, collection);
    } finally {
      grid.setAttribute("aria-busy", "false");
    }
  }

  if (["public", "broadcast", "coldwell"].includes(page)) void loadPortfolio();
  else if (page === "contact") void loadBrandLogo();
})();
