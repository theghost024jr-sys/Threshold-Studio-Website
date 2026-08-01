(function () {
      const seeds = document.querySelectorAll(".seed-glyph");
      const vines = document.querySelectorAll(".vine-line");
      const stars = document.querySelectorAll(".star");
      const sections = document.querySelectorAll("[data-fade-section]");
      const rooms = Array.from(document.querySelectorAll(".room"));
      const footer = document.querySelector(".housegarden-page footer");
      const hiddenHub = document.getElementById("hiddenHub");
      const gardenCanvas = document.getElementById("gardenCanvas");
      const vineCtx = gardenCanvas ? gardenCanvas.getContext("2d") : null;
      if (!gardenCanvas) {
        console.warn("No #gardenCanvas found on House & Garden page");
      } else if (!vineCtx) {
        console.warn("#gardenCanvas exists but 2d context is unavailable");
      }
      let pointerX = window.innerWidth * 0.5;
      let pointerY = window.innerHeight * 0.5;
      let rafId = 0;
      let harmonyStarScale = 1;
      let harmonyDriftScale = 1;
      let harmonyFadeLift = 0;
      let gardenSeason = "summer";
      let growthEnergyLive = 0;
      let vinePhase = 0;
      let vineDiagnosticBoostUntil = performance.now() + 10000;
      const growthStorageKey = "threshold.housegarden.growth.v1";
      const growthState = {
        startMs: Date.now(),
        presenceScore: 0,
        maxScroll: 0,
        hoverRooms: new Set(),
        openedRooms: new Set(),
        vineHoverHits: new Set(),
        vineInteractions: 0,
        footerHovered: false,
        returnScore: 0,
        memoryScore: 0,
        lastPersistMs: 0
      };
      const vineField = {
        dpr: Math.max(1, window.devicePixelRatio || 1),
        width: 0,
        height: 0,
        stems: [],
        whispers: []
      };
      const hiddenWords = ["tend", "stay", "listen", "return", "soil", "presence", "unfinishedness"];

      function seasonVineProfile(season) {
        if (season === "spring") {
          return { color: [132, 168, 94], speed: 1.22, branchBias: 0.13, alpha: 0.22 };
        }
        if (season === "summer") {
          return { color: [126, 150, 88], speed: 1.0, branchBias: 0.1, alpha: 0.2 };
        }
        if (season === "autumn") {
          return { color: [110, 132, 78], speed: 0.92, branchBias: 0.16, alpha: 0.21 };
        }
        return { color: [162, 178, 196], speed: 0.68, branchBias: 0.06, alpha: 0.16 };
      }

      function createStem(index, width) {
        const spread = width / 9;
        const offset = (Math.random() * 0.6 - 0.3) * spread;
        const baseX = ((index + 1) * width) / 9 + offset;
        const species = ["rootline", "tendril", "split-stem", "whisper-vine"][index % 4];
        return {
          id: index,
          species: species,
          baseX: baseX,
          sway: Math.random() * Math.PI * 2,
          heightSeed: 0.42 + (Math.random() * 0.2),
          thickness: Math.random() < 0.35 ? 4 : 3,
          branchOffset: 0.35 + (Math.random() * 0.34),
          hoverUntil: 0,
          clickUntil: 0,
          splitUntil: 0,
          sproutUntil: 0,
          tipX: baseX,
          tipY: 0
        };
      }

      function pointDistance(ax, ay, bx, by) {
        return Math.hypot(ax - bx, ay - by);
      }

      function findInteractiveStem(px, py, radius) {
        let bestStem = null;
        let bestDist = radius;
        vineField.stems.forEach(function (stem) {
          const tipDist = pointDistance(px, py, stem.tipX, stem.tipY);
          const trunkDist = pointDistance(px, py, stem.baseX, stem.tipY + ((vineField.height - stem.tipY) * 0.45));
          const dist = Math.min(tipDist, trunkDist);
          if (dist < bestDist) {
            bestDist = dist;
            bestStem = stem;
          }
        });
        return bestStem;
      }

      function revealWhisper(stem, nowMs) {
        const word = hiddenWords[Math.floor(Math.random() * hiddenWords.length)];
        vineField.whispers.push({
          word: word,
          x: stem.tipX + 8,
          y: stem.tipY - 8,
          startMs: nowMs,
          endMs: nowMs + 3000
        });
      }

      function registerVineHover(nowMs) {
        const stem = findInteractiveStem(pointerX, pointerY, 44);
        if (!stem) {
          return;
        }

        stem.hoverUntil = nowMs + 900;
        growthState.vineHoverHits.add(stem.id);
      }

      function registerVineClick(nowMs) {
        const stem = findInteractiveStem(pointerX, pointerY, 52);
        if (!stem) {
          return;
        }

        growthState.vineInteractions += 1;
        stem.clickUntil = nowMs + 2000;

        if (stem.species === "split-stem") {
          stem.splitUntil = nowMs + 2200;
        } else if (stem.species === "whisper-vine") {
          revealWhisper(stem, nowMs);
        } else if (stem.species === "rootline") {
          stem.sproutUntil = nowMs + 1800;
        }
      }

      function rebuildVineField() {
        if (!gardenCanvas || !vineCtx) {
          return;
        }

        vineField.dpr = Math.max(1, window.devicePixelRatio || 1);
        vineField.width = Math.max(1, Math.floor(window.innerWidth));
        vineField.height = Math.max(1, Math.floor(window.innerHeight));
        gardenCanvas.width = Math.floor(vineField.width * vineField.dpr);
        gardenCanvas.height = Math.floor(vineField.height * vineField.dpr);
        if (gardenCanvas.width === 0 || gardenCanvas.height === 0) {
          console.warn("#gardenCanvas resolved to zero size", { width: gardenCanvas.width, height: gardenCanvas.height });
        } else {
          console.info("#gardenCanvas ready", { width: gardenCanvas.width, height: gardenCanvas.height, dpr: vineField.dpr });
        }
        vineCtx.setTransform(1, 0, 0, 1, 0, 0);
        vineCtx.scale(vineField.dpr, vineField.dpr);

        vineField.stems = [];
        vineField.whispers = [];
        for (let i = 0; i < 8; i += 1) {
          vineField.stems.push(createStem(i, vineField.width));
        }
      }

      function drawBranch(x, y, len, angle, strokeStyle, alpha, widthPx) {
        vineCtx.save();
        vineCtx.globalAlpha = alpha;
        vineCtx.strokeStyle = strokeStyle;
        vineCtx.lineWidth = widthPx;
        vineCtx.beginPath();
        vineCtx.moveTo(x, y);
        vineCtx.quadraticCurveTo(
          x + (Math.cos(angle) * len * 0.5),
          y - (len * 0.56),
          x + (Math.cos(angle) * len),
          y - len
        );
        vineCtx.stroke();
        vineCtx.restore();
      }

      function drawLivingVines(nowMs) {
        if (!gardenCanvas || !vineCtx || vineField.width === 0 || vineField.height === 0) {
          return;
        }

        const profile = seasonVineProfile(gardenSeason);
        const energy = growthEnergyLive;
        const drawEnergy = Math.max(0.08, energy);
        const boost = nowMs < vineDiagnosticBoostUntil ? 1.75 : 1.15;
        const riseBase = vineField.height * (0.2 + (drawEnergy * 0.48));
        const branchChance = profile.branchBias + (drawEnergy * 0.12);
        const travel = (nowMs * 0.00018) * profile.speed;
        vinePhase += 0.00035 * profile.speed;

        vineCtx.clearRect(0, 0, vineField.width, vineField.height);

        const strokeStyle = "rgba(" + profile.color[0] + ", " + profile.color[1] + ", " + profile.color[2] + ", 1)";
        const baseAlpha = Math.min(0.56, (profile.alpha + (drawEnergy * 0.14)) * boost);

        vineField.stems.forEach(function (stem, idx) {
          const hoverStrength = stem.hoverUntil > nowMs ? (stem.hoverUntil - nowMs) / 900 : 0;
          const clickStrength = stem.clickUntil > nowMs ? (stem.clickUntil - nowMs) / 2000 : 0;
          let riseFactor = 1;
          let lateralBend = 1;

          if (stem.species === "rootline") {
            riseFactor += hoverStrength * 0.26;
          } else if (stem.species === "tendril") {
            riseFactor -= hoverStrength * 0.2;
            lateralBend = 1.4;
          } else if (stem.species === "split-stem") {
            riseFactor += hoverStrength * 0.12;
            lateralBend = 1.28;
          } else if (stem.species === "whisper-vine") {
            riseFactor += hoverStrength * 0.07;
            lateralBend = 0.86;
          }

          const wobble = Math.sin(travel + stem.sway) * (6 + (drawEnergy * 9));
          const baseX = stem.baseX + wobble;
          const baseY = vineField.height + 16;
          const topY = baseY - (riseBase * stem.heightSeed * riseFactor);
          const ctrl1x = baseX + Math.sin(vinePhase + (idx * 0.7)) * (8 + (drawEnergy * 11)) * lateralBend;
          const ctrl2x = baseX + Math.cos(vinePhase + stem.sway) * (11 + (drawEnergy * 14)) * lateralBend;
          const tipX = baseX + (Math.sin(vinePhase + idx) * 7 * lateralBend);
          stem.tipX = tipX;
          stem.tipY = topY;

          const localAlpha = stem.species === "whisper-vine"
            ? Math.max(0.16, baseAlpha * 0.8)
            : baseAlpha;

          vineCtx.save();
          vineCtx.globalAlpha = localAlpha;
          vineCtx.strokeStyle = strokeStyle;
          vineCtx.lineWidth = stem.thickness + (clickStrength * 0.7);
          vineCtx.beginPath();
          vineCtx.moveTo(baseX, baseY);
          vineCtx.bezierCurveTo(ctrl1x, baseY - (riseBase * 0.28), ctrl2x, baseY - (riseBase * 0.68), tipX, topY);
          vineCtx.stroke();
          vineCtx.restore();

          if (clickStrength > 0) {
            vineCtx.save();
            vineCtx.globalAlpha = 0.24 * clickStrength;
            vineCtx.strokeStyle = "rgba(107, 125, 74, 1)";
            vineCtx.lineWidth = stem.thickness + 2;
            vineCtx.beginPath();
            vineCtx.moveTo(baseX, baseY);
            vineCtx.bezierCurveTo(ctrl1x, baseY - (riseBase * 0.28), ctrl2x, baseY - (riseBase * 0.68), tipX, topY);
            vineCtx.stroke();
            vineCtx.restore();
          }

          if (stem.species === "rootline" && stem.sproutUntil > nowMs) {
            vineCtx.save();
            vineCtx.globalAlpha = 0.22;
            vineCtx.fillStyle = "rgba(125, 158, 90, 1)";
            vineCtx.beginPath();
            vineCtx.ellipse(tipX + 4, topY - 4, 7, 3.5, -0.5, 0, Math.PI * 2);
            vineCtx.fill();
            vineCtx.restore();
          }

          if (drawEnergy > 0.3 && Math.random() < branchChance) {
            const branchY = baseY - (riseBase * stem.branchOffset);
            const leftAngle = -0.9 - (Math.random() * 0.5);
            const rightAngle = 0.9 + (Math.random() * 0.5);
            const len = 18 + (drawEnergy * 26);
            drawBranch(baseX, branchY, len, leftAngle, strokeStyle, baseAlpha * 0.9, 1.3);
            if (drawEnergy > 0.5) {
              drawBranch(baseX, branchY - 4, len * 0.88, rightAngle, strokeStyle, baseAlpha * 0.86, 1.1);
            }
          }

          if (stem.species === "split-stem" && stem.splitUntil > nowMs) {
            const splitLen = 20 + (drawEnergy * 24);
            drawBranch(tipX, topY, splitLen, -1.15, strokeStyle, baseAlpha * 0.94, 1.35);
            drawBranch(tipX, topY, splitLen, 1.12, strokeStyle, baseAlpha * 0.9, 1.2);
          }
        });

        vineField.whispers = vineField.whispers.filter(function (whisper) {
          return whisper.endMs > nowMs;
        });

        vineField.whispers.forEach(function (whisper) {
          const life = Math.max(0, Math.min(1, (whisper.endMs - nowMs) / 3000));
          vineCtx.save();
          vineCtx.globalAlpha = 0.4 * life;
          vineCtx.fillStyle = "rgba(255, 255, 255, 1)";
          vineCtx.font = "italic 16px Cormorant Garamond";
          vineCtx.fillText(whisper.word, whisper.x, whisper.y - ((1 - life) * 6));
          vineCtx.restore();
        });
      }

      function canvasCoords(evt) {
        if (!gardenCanvas) {
          return { x: pointerX, y: pointerY };
        }

        const rect = gardenCanvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
      }

      function pulseSeed(seed) {
        seed.classList.add("pulse");
        setTimeout(function () {
          seed.classList.remove("pulse");
        }, 820);
      }

      seeds.forEach(function (seed) {
        seed.addEventListener("mouseenter", function () {
          pulseSeed(seed);
        });

        seed.addEventListener("click", function () {
          pulseSeed(seed);
        });
      });

      vines.forEach(function (vine) {
        vine.addEventListener("mouseenter", function () {
          vine.classList.add("sway");
        });
        vine.addEventListener("mouseleave", function () {
          vine.classList.remove("sway");
        });
      });

      function updateSectionFade() {
        const vh = window.innerHeight;
        sections.forEach(function (section) {
          const rect = section.getBoundingClientRect();
          const topRatio = rect.top / vh;
          const opacity = Math.max(0.6 + harmonyFadeLift, Math.min(1, 1.05 - (topRatio * 0.26)));
          section.style.opacity = String(opacity);
        });
      }

      function updateDepthVars() {
        const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, window.scrollY / scrollable);
        document.documentElement.style.setProperty("--soil-depth", String(progress));
        document.documentElement.style.setProperty("--cosmos-rise", String(1 - progress));
        growthState.maxScroll = Math.max(growthState.maxScroll, progress);
      }

      function detectGardenSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) {
          return "spring";
        }
        if (month >= 6 && month <= 8) {
          return "summer";
        }
        if (month >= 9 && month <= 11) {
          return "autumn";
        }
        return "winter";
      }

      function loadGrowthMemory() {
        let record = null;
        try {
          const raw = localStorage.getItem(growthStorageKey);
          record = raw ? JSON.parse(raw) : null;
        } catch (error) {
          record = null;
        }

        const visits = (record && Number(record.visits)) ? Number(record.visits) : 0;
        const memory = (record && Number(record.memory)) ? Number(record.memory) : 0;
        const nextVisits = visits + 1;
        growthState.returnScore = nextVisits > 1 ? 18 : 0;
        growthState.memoryScore = Math.min(22, memory + (nextVisits > 1 ? 4 : 1));

        try {
          localStorage.setItem(growthStorageKey, JSON.stringify({
            visits: nextVisits,
            memory: growthState.memoryScore,
            lastVisitAt: Date.now()
          }));
        } catch (error) {
          // Ignore storage restrictions.
        }
      }

      function persistGrowthMemory(nowMs) {
        if (nowMs - growthState.lastPersistMs < 14000) {
          return;
        }

        growthState.lastPersistMs = nowMs;
        try {
          const raw = localStorage.getItem(growthStorageKey);
          const record = raw ? JSON.parse(raw) : {};
          const nextMemory = Math.min(28, Number((record && record.memory) || 0) + 1);
          localStorage.setItem(growthStorageKey, JSON.stringify({
            visits: Number((record && record.visits) || 1),
            memory: nextMemory,
            lastVisitAt: Date.now()
          }));
        } catch (error) {
          // Ignore storage restrictions.
        }
      }

      function computeGrowthEnergy() {
        const elapsedSeconds = (Date.now() - growthState.startMs) / 1000;
        growthState.presenceScore = Math.min(26, elapsedSeconds / 6);

        const explorationScore = growthState.maxScroll * 24;
        const attentionScore = growthState.hoverRooms.size * 6;
        const engagementScore = growthState.openedRooms.size * 10;
        const vineAttention = growthState.vineHoverHits.size * 2;
        const vineEngagement = Math.min(18, growthState.vineInteractions * 3);
        const footerScore = growthState.footerHovered ? 6 : 0;
        const memoryScore = growthState.memoryScore;
        const returnScore = growthState.returnScore;

        const total = growthState.presenceScore + explorationScore + attentionScore + engagementScore + vineAttention + vineEngagement + footerScore + memoryScore + returnScore;
        return Math.min(1, total / 100);
      }

      function updateGrowthState(nowMs) {
        const energy = computeGrowthEnergy();
        growthEnergyLive = energy;
        document.documentElement.style.setProperty("--growth-energy", energy.toFixed(3));

        let state = "dormant";
        if (energy >= 0.8) {
          state = "blooming";
        } else if (energy >= 0.55) {
          state = "growing";
        } else if (energy >= 0.3) {
          state = "tending";
        }

        document.body.dataset.growthState = state;
        persistGrowthMemory(nowMs);
      }

      function registerRoomInteraction() {
        rooms.forEach(function (room, index) {
          const roomKey = room.querySelector("h2") ? room.querySelector("h2").textContent.trim() : "room-" + index;

          room.addEventListener("mouseenter", function () {
            growthState.hoverRooms.add(roomKey);
          });

          room.addEventListener("click", function () {
            growthState.openedRooms.add(roomKey);
            room.classList.add("is-opened");
          });
        });
      }

      function updateStarProximity() {
        stars.forEach(function (star) {
          const rect = star.getBoundingClientRect();
          const cx = rect.left + (rect.width * 0.5);
          const cy = rect.top + (rect.height * 0.5);
          const dist = Math.hypot(pointerX - cx, pointerY - cy);
          if (dist < (120 * harmonyStarScale)) {
            star.classList.add("is-near");
          } else {
            star.classList.remove("is-near");
          }
        });
      }

      function updateHiddenHub(nowMs) {
        if (!hiddenHub) {
          return;
        }

        const rect = hiddenHub.getBoundingClientRect();
        const cx = rect.left + (rect.width * 0.5);
        const cy = rect.top + (rect.height * 0.5);
        const dist = Math.hypot(pointerX - cx, pointerY - cy);
        const upperBand = pointerY < (window.innerHeight * 0.46);

        if (upperBand && dist < 180) {
          hiddenHub.classList.add("is-near");
        } else {
          hiddenHub.classList.remove("is-near");
        }

        const drift = Math.sin(nowMs * 0.00115) * 3 * harmonyDriftScale;
        hiddenHub.style.setProperty("--hub-drift", drift.toFixed(2) + "px");
      }

      function applyHarmony(detail) {
        const phase = detail && detail.phase ? detail.phase : (document.body.dataset.harmonyPhase || "seed");
        const coherence = detail && detail.coherence ? detail.coherence : (document.body.dataset.harmonyCoherence || "soft");

        harmonyStarScale = 1;
        harmonyDriftScale = 1;
        harmonyFadeLift = 0;

        if (phase === "seed") {
          harmonyStarScale = 0.92;
          harmonyDriftScale = 0.92;
        } else if (phase === "bloom") {
          harmonyStarScale = 1.1;
          harmonyDriftScale = 1.14;
          harmonyFadeLift = 0.03;
        } else if (phase === "resolve") {
          harmonyStarScale = 1.02;
          harmonyDriftScale = 1.04;
          harmonyFadeLift = 0.015;
        }

        if (coherence === "harmonic") {
          harmonyStarScale += 0.08;
          harmonyDriftScale += 0.08;
        }
      }

      function enterThresholdArchive(route, weather) {
        function invoke() {
          if (window.threshold && typeof window.threshold.enterArchive === "function") {
            window.threshold.enterArchive(route || weather || "fog", {
              route: route || "",
              weather: weather || "fog",
              page: "housegarden"
            });
          }
        }

        invoke();
        window.addEventListener("threshold:engine-ready", invoke, { once: true });
      }

      function applyHouseGardenRoute() {
        function invoke() {
          if (window.threshold && typeof window.threshold.enterHouseGarden === "function") {
            window.threshold.enterHouseGarden();
          }
        }

        invoke();
        window.addEventListener("threshold:engine-ready", invoke, { once: true });
      }

      function applyArchiveRoute() {
        const params = new URLSearchParams(window.location.search);
        const route = params.get("archiveRoute");
        const weather = params.get("archiveWeather");

        if (!route) {
          return;
        }

        writeArchiveReturnSignal("housegarden", route, weather || "fog");
  enterThresholdArchive(route, weather || "fog");
        document.body.dataset.archiveRoute = route;
        document.body.dataset.archiveWeather = weather || "fog";
        injectArchiveBanner("House & Garden Gate", "The Archive opened into a softer domestic threshold. Return path remembered.");
        hydrateArchiveBanner(route, "House & Garden Gate");
        harmonyFadeLift += 0.035;
        harmonyStarScale += 0.08;
        harmonyDriftScale += 0.08;
        if (hiddenHub) {
          hiddenHub.classList.add("is-near");
        }
      }

      function injectArchiveBanner(title, detail) {
        const banner = document.createElement("div");
        banner.id = "archiveRouteBanner";
        banner.style.maxWidth = "760px";
        banner.style.margin = "0 auto 1.2rem";
        banner.style.padding = "0.8rem 1rem";
        banner.style.border = "1px solid rgba(236, 223, 199, 0.22)";
        banner.style.borderRadius = "999px";
        banner.style.background = "rgba(248, 242, 231, 0.08)";
        banner.style.color = "rgba(246, 236, 220, 0.92)";
        banner.style.textAlign = "center";
        banner.style.fontFamily = "'Source Code Pro', monospace";
        banner.textContent = title + " Â· " + detail;
        const main = document.querySelector("main");
        if (main) {
          main.insertAdjacentElement("afterbegin", banner);
        }
      }

      function hydrateArchiveBanner(route, title) {
        fetch("data/vault-archive.json", { cache: "no-store" })
          .then(function (response) {
            if (!response.ok) {
              throw new Error("vault archive fetch failed");
            }
            return response.json();
          })
          .then(function (payload) {
            const routeMeta = payload && payload.archive && payload.archive.routes ? payload.archive.routes[route] : null;
            const banner = document.getElementById("archiveRouteBanner");
            if (!routeMeta || !banner) {
              return;
            }
            const selectedNote = selectRouteNote(routeMeta, "housegarden:" + route);
            const lore = selectedNote && selectedNote.excerpt ? selectedNote.excerpt : (routeMeta.lore || "The Archive opened into a softer domestic threshold.");
            banner.textContent = title + " Â· " + lore;
            const image = selectedNote && Array.isArray(selectedNote.assets) && selectedNote.assets[0] ? selectedNote.assets[0].webPath : "";
            const panel = document.createElement("div");
            panel.style.maxWidth = "760px";
            panel.style.margin = "0.9rem auto 0";
            panel.style.padding = "1rem";
            panel.style.border = "1px solid rgba(236, 223, 199, 0.18)";
            panel.style.borderRadius = "22px";
            panel.style.background = "rgba(248, 242, 231, 0.08)";
            panel.style.color = "rgba(246, 236, 220, 0.88)";
            panel.textContent = lore;
            banner.insertAdjacentElement("afterend", panel);
            if (image) {
              const img = document.createElement("img");
              img.src = image;
              img.alt = title;
              img.style.display = "block";
              img.style.width = "min(420px, 100%)";
              img.style.margin = "0.9rem auto 0";
              img.style.borderRadius = "18px";
              panel.appendChild(img);
            }
          })
          .catch(function () {
            // Keep fallback banner text.
          });
      }

      function selectRouteNote(routeMeta, key) {
        if (!routeMeta) {
          return null;
        }

        if (Array.isArray(routeMeta.notePool) && routeMeta.notePool.length > 0) {
          return rotateNotePool(routeMeta.notePool, key, routeMeta.note || null);
        }

        return routeMeta.note || null;
      }

      function rotateNotePool(pool, key, fallback) {
        const entries = Array.isArray(pool) ? pool.filter(function (entry) {
          return entry && typeof entry === "object";
        }) : [];
        if (entries.length === 0) {
          return fallback || null;
        }

        const storageKey = "threshold.route.notePoolRotation.v1";
        let map = {};
        try {
          const raw = localStorage.getItem(storageKey);
          map = raw ? JSON.parse(raw) : {};
          if (!map || typeof map !== "object") {
            map = {};
          }
        } catch (error) {
          map = {};
        }

        const current = Number(map[key] || 0);
        const index = Math.abs(current) % entries.length;
        map[key] = current + 1;

        try {
          localStorage.setItem(storageKey, JSON.stringify(map));
        } catch (error) {
          // Ignore storage restrictions.
        }

        return entries[index] || fallback || null;
      }

      function writeArchiveReturnSignal(pageKey, route, weather) {
        try {
          localStorage.setItem("threshold.archive.returnSignal.v1", JSON.stringify({
            page: pageKey,
            route: route,
            weather: weather,
            at: Date.now()
          }));
        } catch (error) {
          // Ignore storage restrictions.
        }
      }

      function animate(nowMs) {
        updateStarProximity();
        updateHiddenHub(nowMs);
        updateGrowthState(nowMs);
        drawLivingVines(nowMs);
        rafId = requestAnimationFrame(animate);
      }

      if (gardenCanvas) {
        gardenCanvas.addEventListener("mousemove", function (event) {
          const coords = canvasCoords(event);
          pointerX = coords.x;
          pointerY = coords.y;
          registerVineHover(performance.now());
        }, { passive: true });

        gardenCanvas.addEventListener("click", function (event) {
          const coords = canvasCoords(event);
          pointerX = coords.x;
          pointerY = coords.y;
          registerVineClick(performance.now());
        });
      }

      document.addEventListener("pointermove", function (event) {
        pointerX = event.clientX;
        pointerY = event.clientY;
        registerVineHover(performance.now());
      }, { passive: true });

      document.addEventListener("click", function () {
        registerVineClick(performance.now());
      });

      window.addEventListener("scroll", function () {
        updateSectionFade();
        updateDepthVars();
      }, { passive: true });

      window.addEventListener("resize", function () {
        updateSectionFade();
        updateDepthVars();
        rebuildVineField();
      });

      window.addEventListener("threshold:harmony-update", function (event) {
        applyHarmony(event.detail || {});
      });

      if (footer) {
        footer.addEventListener("mouseenter", function () {
          growthState.footerHovered = true;
        }, { once: true });
      }

      setInterval(function () {
        const list = Array.from(seeds);
        if (list.length === 0) {
          return;
        }
        pulseSeed(list[Math.floor(Math.random() * list.length)]);
      }, 3000);

      updateSectionFade();
      updateDepthVars();
      gardenSeason = detectGardenSeason();
      document.body.dataset.gardenSeason = gardenSeason;
      loadGrowthMemory();
      registerRoomInteraction();
      rebuildVineField();
      applyHarmony({});
      applyHouseGardenRoute();
      applyArchiveRoute();
      rafId = requestAnimationFrame(animate);

      window.addEventListener("beforeunload", function () {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      });
    })();
