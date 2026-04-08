/* ===== CONFIG ===== */
const REWARDS_LOOKUP_URL = "https://www.toasttab.com/blackbird-cafee-inc/rewardsLookup";
const MENU_FRONT_URL = "https://cdn.prod.website-files.com/64aa957da446d8dc44869f81/695a71d7576c42dc836b3550_menu_front.png";
const MENU_BACK_URL = "https://cdn.prod.website-files.com/64aa957da446d8dc44869f81/695a71d71a2c4314249fa60c_menu_back.png";
const LUNCH_MENU_FRONT_URL = MENU_FRONT_URL;
const LUNCH_MENU_BACK_URL = MENU_BACK_URL;
const BEAN_WARS_MASCOT_URL = "";

const MENU_SETS = {
  breakfast: { front: MENU_FRONT_URL, back: MENU_BACK_URL, label: "Breakfast" },
  lunch: { front: LUNCH_MENU_FRONT_URL, back: LUNCH_MENU_BACK_URL, label: "Lunch" }
};

/* ===== INIT ===== */
(function () {
  "use strict";

  // Swap Bean Wars mascot if URL provided
  const mascotEl = document.getElementById("beanWarsMascot");
  if (mascotEl && BEAN_WARS_MASCOT_URL) mascotEl.src = BEAN_WARS_MASCOT_URL;

  /* ===== MENU MODAL ===== */
  const modal = document.getElementById("menuModal");
  const mvStage = document.getElementById("mvStage");
  const mvCard = document.getElementById("mvCard");
  const mvReset = document.getElementById("mvReset");
  const zoomReadout = document.getElementById("zoomReadout");
  const mvFrontImg = document.getElementById("mvFrontImg");
  const mvBackImg = document.getElementById("mvBackImg");

  let activeMenu = "breakfast";
  let s = 1, tx = 0, ty = 0;
  let dragging = false, moved = false, lastX = 0, lastY = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function setMenu(kind) {
    if (!MENU_SETS[kind]) kind = "breakfast";
    activeMenu = kind;
    mvFrontImg.src = MENU_SETS[kind].front;
    mvBackImg.src = MENU_SETS[kind].back;

    const titleEl = document.getElementById("menuModalTitle");
    if (titleEl) titleEl.textContent = "Menu \u2022 " + MENU_SETS[kind].label;

    document.querySelectorAll("[data-menu-tab]").forEach(function (t) {
      var isActive = t.getAttribute("data-menu-tab") === kind;
      t.classList.toggle("is-active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function bounds() {
    var rect = mvStage.getBoundingClientRect();
    var maxX = (rect.width * (s - 1)) / 2;
    var maxY = (rect.height * (s - 1)) / 2;
    return { maxX: maxX, maxY: maxY };
  }

  function applyTransform() {
    mvCard.querySelectorAll(".mv-inner").forEach(function (el) {
      el.style.setProperty("--s", s.toFixed(3));
      el.style.setProperty("--tx", tx.toFixed(1) + "px");
      el.style.setProperty("--ty", ty.toFixed(1) + "px");
    });
    mvStage.classList.toggle("is-zoomed", s > 1.02);
    zoomReadout.textContent = Math.round(s * 100) + "%";
  }

  function setZoom(next) {
    s = clamp(next, 1, 4);
    var b = bounds();
    tx = clamp(tx, -b.maxX, b.maxX);
    ty = clamp(ty, -b.maxY, b.maxY);
    applyTransform();
  }

  function resetView() {
    s = 1; tx = 0; ty = 0;
    applyTransform();
  }

  function setSide(side) {
    mvCard.classList.toggle("is-flipped", side === "back");
  }

  function openMenu(opts) {
    var side = (opts && opts.side) || "front";
    var menu = (opts && opts.menu) || "breakfast";
    setMenu(menu);
    setSide(side);
    resetView();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { mvCard.focus(); });
  }

  function closeMenu() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  // Default load
  setMenu("breakfast");
  applyTransform();

  // Open menu buttons
  document.querySelectorAll("[data-menu-open]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var side = btn.getAttribute("data-menu-open") || "front";
      var menu = btn.getAttribute("data-menu") || "breakfast";
      if (btn.tagName === "A") e.preventDefault();
      openMenu({ side: side, menu: menu });
    });
  });

  // Menu tabs
  document.querySelectorAll("[data-menu-tab]").forEach(function (t) {
    t.addEventListener("click", function () {
      var kind = t.getAttribute("data-menu-tab") || "breakfast";
      setMenu(kind);
      setSide("front");
      resetView();
    });
  });

  // Close
  document.getElementById("menuClose").addEventListener("click", closeMenu);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (!modal.hidden && e.key === "Escape") closeMenu(); });

  // Flip on click
  mvCard.addEventListener("click", function () {
    if (moved) return;
    mvCard.classList.toggle("is-flipped");
  });
  mvCard.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      mvCard.classList.toggle("is-flipped");
    }
  });

  // Wheel zoom
  mvStage.addEventListener("wheel", function (e) {
    e.preventDefault();
    var dir = e.deltaY < 0 ? 1 : -1;
    setZoom(s * (dir > 0 ? 1.12 : 0.89));
  }, { passive: false });

  // Drag to pan
  mvStage.addEventListener("pointerdown", function (e) {
    if (s <= 1.02) return;
    dragging = true; moved = false;
    lastX = e.clientX; lastY = e.clientY;
    mvStage.setPointerCapture(e.pointerId);
  });
  mvStage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    tx += dx; ty += dy;
    var b = bounds();
    tx = clamp(tx, -b.maxX, b.maxX);
    ty = clamp(ty, -b.maxY, b.maxY);
    applyTransform();
  });
  mvStage.addEventListener("pointerup", function () {
    dragging = false;
    setTimeout(function () { moved = false; }, 0);
  });
  mvStage.addEventListener("pointercancel", function () { dragging = false; moved = false; });
  mvStage.addEventListener("dblclick", function (e) { e.preventDefault(); resetView(); });
  mvReset.addEventListener("click", resetView);

  // Zoom buttons
  document.getElementById("zoomIn").addEventListener("click", function () { setZoom(s + 0.15); });
  document.getElementById("zoomOut").addEventListener("click", function () { setZoom(s - 0.15); });

  /* ===== REWARDS LOOKUP ===== */
  document.getElementById("rewardsLookupBtn").addEventListener("click", function () {
    window.open(REWARDS_LOOKUP_URL, "_blank", "noopener");
  });

  /* ===== ORDER MAP (Leaflet + location finder) ===== */
  var mapEl = document.getElementById("orderMap");
  var pillWrap = document.getElementById("locPills");
  var pills = Array.from(document.querySelectorAll("#locPills .loc-pill[data-lat][data-lng]"));

  // Sort alphabetically
  if (pillWrap && pills.length) {
    pills.sort(function (a, b) {
      var an = (a.querySelector(".loc-name") || {}).textContent || "";
      var bn = (b.querySelector(".loc-name") || {}).textContent || "";
      return an.trim().toLowerCase().localeCompare(bn.trim().toLowerCase());
    });
    pills.forEach(function (p) { pillWrap.appendChild(p); });
  }

  if (mapEl && pills.length) {
    pills.forEach(function (p) {
      p.setAttribute("role", "button");
      p.setAttribute("tabindex", "0");
      p.setAttribute("aria-selected", p.classList.contains("is-active") ? "true" : "false");
    });

    var map = L.map(mapEl, { scrollWheelZoom: false, dragging: true, tap: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    var normalIcon = L.divIcon({
      className: "bb-marker-wrap",
      html: '<span class="bb-marker"></span>',
      iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10]
    });
    var activeIcon = L.divIcon({
      className: "bb-marker-wrap",
      html: '<span class="bb-marker active"></span>',
      iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12]
    });

    var markers = new Map();
    var boundsArr = [];
    var locs = [];

    pills.forEach(function (p) {
      var lat = parseFloat(p.dataset.lat);
      var lng = parseFloat(p.dataset.lng);
      var key = p.dataset.loc;
      var name = (p.querySelector(".loc-name") || {}).textContent || "Location";
      name = name.trim();

      locs.push({ key: key, name: name, lat: lat, lng: lng, el: p });
      boundsArr.push([lat, lng]);

      var marker = L.marker([lat, lng], { icon: normalIcon })
        .addTo(map)
        .bindPopup("<strong>" + name + "</strong>");
      markers.set(key, marker);
      marker.on("click", function () { activateLoc(key, { openPopup: true, zoom: true }); });
    });

    var allBounds = null;
    if (boundsArr.length) {
      allBounds = L.latLngBounds(boundsArr).pad(-0.08);
      map.fitBounds(allBounds, { padding: [18, 18], maxZoom: 14 });
      setTimeout(function () { map.invalidateSize(); }, 60);
    }

    var activeKey = null;
    try { activeKey = localStorage.getItem("bb_active_loc"); } catch (e) { }
    if (activeKey && !pills.some(function (p) { return p.dataset.loc === activeKey; })) activeKey = null;
    if (!activeKey) {
      activeKey = (pills.find(function (p) { return p.classList.contains("is-active"); }) || pills[0]).dataset.loc;
    }

    function setMarkerState(key) {
      markers.forEach(function (m, k) { m.setIcon(k === key ? activeIcon : normalIcon); });
    }

    function activateLoc(key, opts) {
      opts = opts || {};
      activeKey = key;
      try { localStorage.setItem("bb_active_loc", key); } catch (e) { }

      pills.forEach(function (p) {
        var isActive = p.dataset.loc === key;
        p.classList.toggle("is-active", isActive);
        p.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      setMarkerState(key);

      var marker = markers.get(key);
      if (marker) {
        var ll = marker.getLatLng();
        if (opts.zoom) {
          var targetZoom = Math.min(Math.max(map.getZoom() + 2, 12), 14);
          map.flyTo(ll, targetZoom, { duration: 0.7 });
        } else {
          map.panTo(ll, { animate: true });
        }
        if (opts.openPopup) marker.openPopup();
      }
    }

    function onPillPick(p) {
      activateLoc(p.dataset.loc, { openPopup: true, zoom: true });
    }

    pills.forEach(function (p) {
      p.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function (e) { e.stopPropagation(); }); });
      p.addEventListener("click", function () { onPillPick(p); });
      p.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPillPick(p); }
      });
    });

    if (allBounds) map.fitBounds(allBounds, { padding: [18, 18], maxZoom: 14 });
    if (activeKey) {
      setMarkerState(activeKey);
      activateLoc(activeKey, { openPopup: false, zoom: true });
    }

    /* ===== ZIP + GEOLOCATION FINDER ===== */
    var zipInput = document.getElementById("zipInput");
    var zipBtn = document.getElementById("zipFindBtn");
    var geoBtn = document.getElementById("geoBtn");
    var statusEl = document.getElementById("locStatus");

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.style.color = isError ? "rgba(160,20,20,.86)" : "rgba(17,17,20,.68)";
    }

    function haversineKm(aLat, aLng, bLat, bLng) {
      var R = 6371;
      var toRad = function (d) { return d * Math.PI / 180; };
      var dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
      var s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
      var aa = s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(aa)));
    }

    function nearestTo(lat, lng) {
      var best = null;
      locs.forEach(function (loc) {
        var km = haversineKm(lat, lng, loc.lat, loc.lng);
        if (!best || km < best.km) best = { loc: loc, km: km };
      });
      return best;
    }

    function goNearest(lat, lng, label) {
      var best = nearestTo(lat, lng);
      if (!best) { setStatus("No locations available.", true); return; }
      activateLoc(best.loc.key, { openPopup: true, zoom: true });
      var miles = best.km * 0.621371;
      var dist = miles >= 1 ? miles.toFixed(1) + " mi" : Math.max(50, Math.round(miles * 5280)) + " ft";
      setStatus((label ? label + " \u2014 " : "") + "Nearest: " + best.loc.name + " (" + dist + " away).");
    }

    async function lookupZip(zip) {
      var raw = (zip || "").trim();
      var match = raw.match(/^(\d{5})(-\d{4})?$/);
      if (!match) { setStatus("Enter a valid 5-digit ZIP code.", true); return; }
      var zip5 = match[1];
      setStatus("Finding the nearest cafe\u2026");
      try {
        var resp = await fetch("https://api.zippopotam.us/us/" + zip5);
        if (!resp.ok) throw new Error("ZIP not found");
        var data = await resp.json();
        var place = data && data.places && data.places[0];
        var lat = parseFloat(place && place.latitude);
        var lng = parseFloat(place && place.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("Bad ZIP");
        goNearest(lat, lng, "ZIP " + zip5);
      } catch (err) {
        setStatus("Couldn\u2019t look up that ZIP. Try another, or use \u201cUse my location.\u201d", true);
      }
    }

    if (zipBtn) zipBtn.addEventListener("click", function () { lookupZip(zipInput && zipInput.value); });
    if (zipInput) zipInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); lookupZip(zipInput.value); }
    });

    if (geoBtn) {
      geoBtn.addEventListener("click", function () {
        if (!navigator.geolocation) { setStatus("Geolocation not supported.", true); return; }
        setStatus("Requesting your location\u2026");
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            var lat = pos && pos.coords && pos.coords.latitude;
            var lng = pos && pos.coords && pos.coords.longitude;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) { setStatus("Couldn\u2019t read your location.", true); return; }
            goNearest(lat, lng, "Your location");
          },
          function () { setStatus("Location denied or unavailable. Try ZIP instead.", true); },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      });
    }

    // Auto-nearest if already granted
    (async function () {
      if (!navigator.geolocation) return;
      try {
        if (navigator.permissions && navigator.permissions.query) {
          var perm = await navigator.permissions.query({ name: "geolocation" });
          if (perm.state !== "granted") return;
        }
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            var lat = pos && pos.coords && pos.coords.latitude;
            var lng = pos && pos.coords && pos.coords.longitude;
            if (Number.isFinite(lat) && Number.isFinite(lng)) goNearest(lat, lng, "Your location");
          },
          function () { },
          { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
        );
      } catch (e) { }
    })();
  }

  /* ===== SOCIALS CAROUSEL AUTO-SCROLL ===== */
  (function () {
    var track = document.getElementById("carTrack");
    if (!track) return;
    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    var dir = 1;
    function step() {
      if (track.scrollWidth <= track.clientWidth + 8) { requestAnimationFrame(step); return; }
      track.scrollLeft += dir * 0.9;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) dir = -1;
      if (track.scrollLeft <= 0) dir = 1;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();

  /* ===== NAV ACTIVE LINK + BACK TO TOP ===== */
  (function () {
    var nav = document.querySelector(".links");
    var navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
    var sections = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    if (sections.length && navLinks.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return (b.intersectionRatio || 0) - (a.intersectionRatio || 0); })[0];
        if (!visible) return;
        var id = visible.target.id;
        navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + id); });
      }, { threshold: [0.18, 0.35, 0.5, 0.65] });
      sections.forEach(function (s) { io.observe(s); });
    }

    var topBtn = document.getElementById("toTop");
    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (topBtn) topBtn.classList.toggle("show", y > 700);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (topBtn) topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  })();

})();
