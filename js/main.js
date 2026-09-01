// gorg/js/main.js — bouquet timeline, complete sunflowers, dynamic 45% butterflies
(function () {
    var sunGlow = document.getElementById("sunGlow");
    var messageBlock = document.getElementById("messageBlock");
    var replayBtn = document.getElementById("replayBtn");
    var petalsLayer = document.getElementById("petalsLayer");
    var petalRain = document.getElementById("petalRain");
    var ribbon = document.getElementById("ribbon");
    var sunflowers = document.querySelectorAll(".sunflower");
    var butterfliesRoot = document.getElementById("butterflies");

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function buildPetals() {
        document.querySelectorAll(".petals").forEach(function (layer) {
            if (layer.children.length > 0) return;
            var isBack = layer.classList.contains("petals-back");
            var offset = isBack ? 15 : 0;
            var delayBase = isBack ? 1680 : 1780;
            for (var i = 0; i < 12; i++) {
                var p = document.createElement("span");
                p.className = "petal-bloom";
                var rot = i * 30 + offset;
                p.style.setProperty("--rot", rot + "deg");
                p.style.animationDelay = (delayBase + i * 38) + "ms";
                layer.appendChild(p);
            }
        });
    }
    buildPetals();

    // ——— dynamic butterflies: fill 45% of viewport ———
    // heuristic: viewport area * 0.45 / unitFlightArea
    // unitFlightArea ~ avg 220x140 ≈ 30800, clamped 6..28 for readability
    function butterflyCountForViewport() {
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var area = vw * vh;
        var unit = 42000; // tuned so 1920x1080 → ~22, 390x844 → ~6
        var raw = Math.round(area * 0.45 / unit);
        return Math.max(6, Math.min(28, raw));
    }

    function createButterfly(index) {
        var el = document.createElement("span");
        el.className = "butterfly";
        // cycle flight variants 1..4
        var flight = "flight" + ((index % 4) + 1);
        el.classList.add(flight);
        // small variant every 3rd for depth
        if (index % 3 === 0) el.classList.add("small");

        // random anchor across viewport, avoiding extreme edges (8..92% / 12..78%)
        var left = (8 + Math.random() * 84).toFixed(1);
        var top = (10 + Math.random() * 68).toFixed(1);
        el.style.left = left + "%";
        el.style.top = top + "%";

        // randomize duration & delay for organic feel
        var durs = { flight1: 9.2, flight2: 10.5, flight3: 8.4, flight4: 11 };
        var base = durs[flight] || 9.5;
        var dur = (base * (0.88 + Math.random() * 0.32)).toFixed(2);
        var delay = (1.9 + Math.random() * 1.8 + index * 0.08).toFixed(2);
        el.style.setProperty("--dur", dur + "s");
        el.style.setProperty("--delay", delay + "s");

        el.innerHTML = '<span class="bf-wing left"></span><span class="bf-wing right"></span><span class="bf-body"></span>';
        return el;
    }

    function buildButterflies() {
        if (!butterfliesRoot) return;
        butterfliesRoot.innerHTML = "";
        var count = butterflyCountForViewport();
        for (var i = 0; i < count; i++) {
            butterfliesRoot.appendChild(createButterfly(i));
        }
        // expose for timeline
        // re-query live
    }

    function getButterflies() {
        return butterfliesRoot ? butterfliesRoot.querySelectorAll(".butterfly") : [];
    }

    // initial build + rebuild on resize (debounced) to keep 45% fill
    buildButterflies();
    var resizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            var wasFlying = document.querySelectorAll(".butterfly.is-flying").length > 0;
            buildButterflies();
            if (wasFlying && !prefersReduced) {
                getButterflies().forEach(function (bf) { bf.classList.add("is-flying"); });
            }
        }, 260);
    });

    // ——— petals rain — continuous background ———
    var rainInterval = null;
    var rainActive = false;
    function spawnRainPetal() {
        if (prefersReduced || !petalRain) return;
        var p = document.createElement("span");
        p.className = "petal";
        var r = Math.random();
        if (r > 0.72) p.classList.add("alt");
        if (r < 0.18) p.classList.add("tiny");
        var left = (Math.random() * 100).toFixed(1);
        var drift = (Math.random() * 120 - 60).toFixed(0) + "px";
        var sway = (Math.random() * 28 - 14).toFixed(0) + "px";
        var dur = (7.5 + Math.random() * 6.5).toFixed(2);
        var delay = (Math.random() * 0.6).toFixed(2);
        var rot0 = (Math.random() * 360).toFixed(0) + "deg";
        p.style.left = left + "%";
        p.style.setProperty("--drift", drift);
        p.style.setProperty("--sway", sway);
        p.style.animation = "rainFall " + dur + "s linear " + delay + "s forwards";
        p.style.transform = "rotate(" + rot0 + ")";
        petalRain.appendChild(p);
        // cleanup
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, (parseFloat(dur) + parseFloat(delay) + 0.5) * 1000);
    }
    function startPetalRain() {
        if (rainActive || prefersReduced) return;
        rainActive = true;
        // initial burst
        for (var i = 0; i < 10; i++) setTimeout(spawnRainPetal, i * 180);
        rainInterval = setInterval(function () {
            // 1–2 petals per tick, gentle density
            spawnRainPetal();
            if (Math.random() > 0.62) spawnRainPetal();
        }, 320);
    }
    function stopPetalRain() {
        // keep rain continuous even on replay — just clear and restart
        if (rainInterval) { clearInterval(rainInterval); rainInterval = null; }
        rainActive = false;
        if (petalRain) petalRain.innerHTML = "";
    }

    function runTimeline() {
        sunGlow.classList.remove("is-lit");
        messageBlock.classList.remove("is-visible");
        petalsLayer.innerHTML = "";
        if (ribbon) ribbon.classList.remove("is-visible");
        getButterflies().forEach(function (bf) { bf.classList.remove("is-flying"); void bf.offsetWidth; });

        sunflowers.forEach(function (sf) {
            sf.querySelector(".stem").classList.remove("is-grown");
            sf.querySelectorAll(".leaf").forEach(function (l) { l.classList.remove("is-visible"); });
            sf.querySelector(".flower-head").classList.remove("is-bloomed", "is-floating");
        });

        void sunGlow.offsetWidth;

        if (prefersReduced) {
            sunGlow.classList.add("is-lit");
            sunflowers.forEach(function (sf) {
                sf.querySelector(".stem").classList.add("is-grown");
                sf.querySelectorAll(".leaf").forEach(function (l) { l.classList.add("is-visible"); });
                sf.querySelector(".flower-head").classList.add("is-bloomed");
            });
            messageBlock.classList.add("is-visible");
            if (ribbon) ribbon.classList.add("is-visible");
            getButterflies().forEach(function (bf) { bf.style.opacity = "0.85"; });
            return;
        }

        var delays = [260, 380, 460, 620, 700];
        sunflowers.forEach(function (sf, idx) {
            var stem = sf.querySelector(".stem");
            var leaves = sf.querySelectorAll(".leaf");
            var head = sf.querySelector(".flower-head");
            var d = delays[idx] || 300;
            setTimeout(function () { stem.classList.add("is-grown"); }, d);
            leaves.forEach(function (leaf, li) {
                setTimeout(function () { leaf.classList.add("is-visible"); }, d + 520 + li * 140);
            });
            setTimeout(function () { head.classList.add("is-bloomed"); }, 680);
            if (sf.classList.contains("s1")) {
                setTimeout(function () { head.classList.add("is-floating"); }, 2650);
            }
        });

        setTimeout(function () { sunGlow.classList.add("is-lit"); }, 1720);
        setTimeout(function () { messageBlock.classList.add("is-visible"); }, 2920);
        if (ribbon) setTimeout(function () { ribbon.classList.add("is-visible"); }, 1400);
        setTimeout(function () { spawnPetals(); }, 3480);
        // start background petal rain shortly after bloom so it feels like bouquet shedding
        setTimeout(function () { startPetalRain(); }, 2600);
        getButterflies().forEach(function (bf, i) {
            setTimeout(function () { bf.classList.add("is-flying"); }, 2050 + i * 90);
        });
    }

    function spawnPetals() {
        if (prefersReduced) return;
        var count = 16;
        for (var i = 0; i < count; i++) {
            var p = document.createElement("span");
            p.className = "petal";
            var left = 36 + Math.random() * 28;
            var delay = (Math.random() * 1.4).toFixed(2);
            var dur = (5.2 + Math.random() * 2.6).toFixed(2);
            var xDrift = (Math.random() * 180 - 90).toFixed(0) + "px";
            var rot = (Math.random() * 360).toFixed(0);
            p.style.left = left + "%";
            p.style.top = "38%";
            p.style.setProperty("--delay", delay + "s");
            p.style.setProperty("--dur", dur + "s");
            p.style.setProperty("--x", xDrift);
            p.style.transform = "rotate(" + rot + "deg)";
            p.style.background = i % 3 === 0 ? "var(--sunflower-petal-deep)" : "var(--sunflower-petal)";
            petalsLayer.appendChild(p);
            (function (el) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () { el.classList.add("is-falling"); });
                });
            })(p);
        }
    }

    if (replayBtn) replayBtn.addEventListener("click", runTimeline);
    document.addEventListener("keydown", function (e) {
        if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) runTimeline();
    });
    document.addEventListener("click", function (e) {
        if (e.target === document.body || e.target.id === "bloom") runTimeline();
    });

    window.addEventListener("load", function () { setTimeout(runTimeline, 160); });
})();
