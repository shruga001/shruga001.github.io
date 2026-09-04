// gorg/js/main.js — three-act story: happy → wilted → revived + butterflies + 1:05 music
(function () {
    var sunGlow = document.getElementById("sunGlow");
    var soloFlower = document.getElementById("soloFlower");
    var soloStem = document.getElementById("soloStem");
    var soloHead = document.getElementById("soloHead");
    var leafA = document.getElementById("leafA");
    var leafB = document.getElementById("leafB");
    var act1 = document.getElementById("act1");
    var act2 = document.getElementById("act2");
    var act3 = document.getElementById("act3");
    var petalsLayer = document.getElementById("petalsLayer");
    var petalRain = document.getElementById("petalRain");
    var butterfliesRoot = document.getElementById("butterflies");
    var bgMusic = document.getElementById("bgMusic");
    var replayBtn = document.getElementById("replayBtn");
    var tapOverlay = document.getElementById("tapOverlay");

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var MUSIC_START = 65;
    var timers = [];

    function clearTimers() { timers.forEach(function (id) { clearTimeout(id); }); timers = []; }
    function delay(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

    // petals for solo flower
    function buildPetals() {
        document.querySelectorAll(".petals").forEach(function (layer) {
            if (layer.children.length > 0) return;
            var isBack = layer.classList.contains("petals-back");
            var offset = isBack ? 15 : 0;
            var delayBase = isBack ? 340 : 440;
            for (var i = 0; i < 12; i++) {
                var p = document.createElement("span");
                p.className = "petal-bloom";
                p.style.setProperty("--rot", (i * 30 + offset) + "deg");
                p.style.animationDelay = (delayBase + i * 38) + "ms";
                layer.appendChild(p);
            }
        });
    }
    buildPetals();

    // ——— music: play from 1:05, dim at ACT II, restore at ACT III ———
    var musicVol = 0.72;
    function seekToStart() {
        if (!bgMusic) return;
        if (!Number.isFinite(bgMusic.duration) || bgMusic.duration <= MUSIC_START) return;
        try { bgMusic.currentTime = MUSIC_START; } catch(e) {}
    }
    function playMusic() {
        if (!bgMusic) return;
        seekToStart();
        bgMusic.volume = musicVol;
        bgMusic.muted = false;
        var p = bgMusic.play();
        if (p && p.catch) p.catch(function(){});
    }
    function fadeVolume(to, dur) {
        if (!bgMusic) return;
        var from = bgMusic.volume;
        to = Math.max(0, Math.min(1, to));
        var start = performance.now();
        function tick(now) {
            var t = Math.min(1, (now - start) / dur);
            bgMusic.volume = from + (to - from) * t;
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }
    if (bgMusic) {
        bgMusic.volume = musicVol;
        bgMusic.addEventListener("loadedmetadata", seekToStart);
        bgMusic.addEventListener("ended", function(){ seekToStart(); bgMusic.play().catch(function(){}); });
        // tap to start — browser requires gesture
        var startOnTap = function(){
            playMusic();
            if (tapOverlay) tapOverlay.classList.add("is-hidden");
        };
        if (tapOverlay) {
            tapOverlay.addEventListener("click", startOnTap);
            tapOverlay.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" ") { e.preventDefault(); startOnTap(); } });
        }
        document.addEventListener("click", function(){ if (bgMusic.paused) playMusic(); }, { passive:true });
    }

    // butterflies — hidden until act 3, then fill 45%
    function butterflyCount() {
        var area = innerWidth * innerHeight;
        return Math.max(6, Math.min(28, Math.round(area * 0.45 / 42000)));
    }
    function createButterfly(i) {
        var el = document.createElement("span");
        el.className = "butterfly flight" + ((i % 4) + 1);
        if (i % 3 === 0) el.classList.add("small");
        el.style.left = (10 + Math.random() * 68).toFixed(1) + "%";
        el.style.top = (14 + Math.random() * 56).toFixed(1) + "%";
        var durs = { flight1: 9.2, flight2: 10.5, flight3: 8.4, flight4: 11 };
        var base = durs["flight" + ((i % 4)+1)] || 9.5;
        el.style.setProperty("--dur", (base * (0.9 + Math.random()*0.25)).toFixed(2) + "s");
        el.style.setProperty("--delay", (Math.random()*0.9).toFixed(2) + "s");
        el.innerHTML = '<span class="bf-wing left"></span><span class="bf-wing right"></span><span class="bf-body"></span>';
        return el;
    }
    function buildButterflies() {
        if (!butterfliesRoot) return;
        butterfliesRoot.innerHTML = "";
        var n = butterflyCount();
        for (var i=0;i<n;i++) butterfliesRoot.appendChild(createButterfly(i));
    }
    buildButterflies();
    var rT=null; window.addEventListener("resize", function(){ clearTimeout(rT); rT=setTimeout(function(){
        var vis = butterfliesRoot.classList.contains("is-visible");
        buildButterflies();
        if (vis) butterfliesRoot.querySelectorAll(".butterfly").forEach(function(b,i){ setTimeout(function(){ b.classList.add("is-flying"); }, i*60); });
    }, 260); });

    // petal rain helpers
    var rainInterval=null, rainActive=false;
    function spawnRainPetal() {
        if (prefersReduced || !petalRain) return;
        var p=document.createElement("span");
        p.className="petal";
        var r=Math.random();
        if (r>0.72) p.classList.add("alt");
        if (r<0.18) p.classList.add("tiny");
        p.style.left=(Math.random()*100).toFixed(1)+"%";
        p.style.setProperty("--drift",(Math.random()*120-60).toFixed(0)+"px");
        p.style.setProperty("--sway",(Math.random()*28-14).toFixed(0)+"px");
        var dur=(7.5+Math.random()*6.5).toFixed(2);
        p.style.animation="rainFall "+dur+"s linear forwards";
        petalRain.appendChild(p);
        setTimeout(function(){ if(p.parentNode) p.parentNode.removeChild(p); }, parseFloat(dur)*1000+800);
    }
    function startRain(light) {
        if (rainActive || prefersReduced) return;
        rainActive=true;
        var burst = light ? 6 : 12;
        for (var i=0;i<burst;i++) setTimeout(spawnRainPetal, i*90);
        rainInterval=setInterval(function(){ spawnRainPetal(); if(Math.random()>0.58) spawnRainPetal(); }, light?520:300);
    }
    function stopRain(){ if(rainInterval){ clearInterval(rainInterval); rainInterval=null; } rainActive=false; }

    function burstFromFlower(count) {
        if (prefersReduced || !petalsLayer) return;
        for (var i=0;i<count;i++){
            var p=document.createElement("span");
            p.className="petal";
            var left=44+Math.random()*12;
            var delay=(Math.random()*0.6).toFixed(2);
            var dur=(4.2+Math.random()*2.2).toFixed(2);
            var x=(Math.random()*160-80).toFixed(0)+"px";
            var rot=(Math.random()*360).toFixed(0);
            p.style.left=left+"%";
            p.style.top="42%";
            p.style.setProperty("--delay",delay+"s");
            p.style.setProperty("--dur",dur+"s");
            p.style.setProperty("--x",x);
            p.style.transform="rotate("+rot+"deg)";
            p.style.background=i%3===0?"var(--sunflower-petal-deep)":"var(--sunflower-petal)";
            petalsLayer.appendChild(p);
            (function(el){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add("is-falling"); }); }); })(p);
            (function(el, d, dl){ setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, (parseFloat(d)+parseFloat(dl)+0.6)*1000); })(p, dur, delay);
        }
    }

    function setAct(n) {
        [act1, act2, act3].forEach(function(a, idx){
            if (!a) return;
            a.classList.remove("is-active","is-exit");
            if (idx+1 === n) a.classList.add("is-active");
            else if (idx+1 < n) a.classList.add("is-exit");
        });
    }

    function runStory() {
        clearTimers();
        stopRain();
        if (petalRain) petalRain.innerHTML="";
        if (petalsLayer) petalsLayer.innerHTML="";
        butterfliesRoot.classList.add("is-hidden");
        butterfliesRoot.classList.remove("is-visible");
        butterfliesRoot.querySelectorAll(".butterfly").forEach(function(b){ b.classList.remove("is-flying"); });

        soloFlower.classList.remove("wilted","reviving");
        sunGlow.classList.remove("is-dimmed","is-bright","is-lit");
        soloStem.classList.remove("is-grown");
        soloHead.classList.remove("is-bloomed","is-floating");
        leafA.classList.remove("is-visible");
        leafB.classList.remove("is-visible");
        setAct(1);
        void soloStem.offsetWidth;

        if (prefersReduced) {
            sunGlow.classList.add("is-lit");
            soloStem.classList.add("is-grown");
            leafA.classList.add("is-visible"); leafB.classList.add("is-visible");
            soloHead.classList.add("is-bloomed");
            return;
        }

        // ACT I — happy (10s) — play from 1:05
        playMusic();
        delay(function(){ soloStem.classList.add("is-grown"); }, 280);
        delay(function(){ leafA.classList.add("is-visible"); }, 820);
        delay(function(){ leafB.classList.add("is-visible"); }, 1020);
        delay(function(){ soloHead.classList.add("is-bloomed"); }, 520);
        delay(function(){ sunGlow.classList.add("is-lit"); }, 620);
        delay(function(){ soloHead.classList.add("is-floating"); }, 2500);

        // ACT II — bad day at 10s — dim music + wilt + petal fall
        delay(function(){
            fadeVolume(0.18, 900);
            sunGlow.classList.add("is-dimmed");
            sunGlow.classList.remove("is-bright");
            burstFromFlower(22);
            startRain(false);
            soloFlower.classList.add("wilted");
            soloHead.classList.remove("is-floating");
            setAct(2);
        }, 10000);

        // ACT III — revival at 25s — butterflies + restore music
        delay(function(){
            butterfliesRoot.classList.remove("is-hidden");
            butterfliesRoot.classList.add("is-visible");
            buildButterflies();
            requestAnimationFrame(function(){
                butterfliesRoot.querySelectorAll(".butterfly").forEach(function(b,i){
                    setTimeout(function(){ b.classList.add("is-flying"); }, i*55);
                });
            });
            soloFlower.classList.remove("wilted");
            soloFlower.classList.add("reviving");
            sunGlow.classList.remove("is-dimmed");
            sunGlow.classList.add("is-bright");
            soloHead.classList.remove("is-bloomed");
            void soloHead.offsetWidth;
            soloHead.classList.add("is-bloomed");
            fadeVolume(0.72, 1200);
            setAct(3);
            delay(function(){ stopRain(); startRain(true); }, 800);
            delay(function(){ soloHead.classList.add("is-floating"); }, 900);
            delay(function(){ soloFlower.classList.remove("reviving"); }, 900);
        }, 25000);
    }

    if (replayBtn) replayBtn.addEventListener("click", runStory);
    document.addEventListener("keydown", function(e){ if(e.key.toLowerCase()==="r" && !e.metaKey && !e.ctrlKey) runStory(); });
    document.addEventListener("click", function(e){ if(e.target===document.body || e.target.id==="bloom") runStory(); });

    window.addEventListener("load", function(){ setTimeout(runStory, 180); });
})();
