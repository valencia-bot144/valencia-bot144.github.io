// Logo: una sola copia en el archivo, reutilizada
document.getElementById('logo-f').src = document.getElementById('logo-n').src;

// Aparición al hacer scroll
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), {threshold:.08});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Contadores animados
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target, n = +el.dataset.n, pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now();
  (function f(t){ const p = Math.min((t - t0) / 1200, 1); el.textContent = pre + Math.round(n * p) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
}), {threshold:.6});
document.querySelectorAll('.stat b').forEach(b => cio.observe(b));

// Preselección desde servicios y planes
function elegir(campo, valor) {
  document.getElementById(campo).value = valor;
  document.getElementById('formulario').scrollIntoView({behavior:'smooth', block:'center'});
  setTimeout(() => document.getElementById('nombre').focus({preventScroll:true}), 500);
}
document.querySelectorAll('[data-serv]').forEach(b => b.onclick = () => elegir('servicio', b.dataset.serv));
document.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => elegir('plan', b.dataset.plan));

// Formulario → WhatsApp con el mensaje armado
const WA = '573176045712';
document.getElementById('lead').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (!f.checkValidity()) { f.reportValidity(); return; }
  const d = Object.fromEntries(new FormData(f));
  const txt = `Hola Your Perfect Design, soy ${d.nombre}${d.empresa ? ' (' + d.empresa + ')' : ''}. Me interesa: ${d.servicio}${d.plan ? ', plan ' + d.plan : ''}. ${d.mensaje || ''} Contacto: ${d.correo} / ${d.tel}. Autorizo el tratamiento de mis datos personales (Ley 1581 de 2012). Información comercial: ${d.mkt ? 'Sí' : 'No'}.`;
  const url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt);
  document.getElementById('wa-link').href = url;
  document.getElementById('ok').hidden = false;
  window.open(url, '_blank', 'noopener');
});

// Carrusel
const slides = [...document.querySelectorAll('.slide')], dots = [...document.querySelectorAll('.dot')];
let cur = 0, paused = false;
function go(i) {
  cur = (i + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle('on', k === cur));
  dots.forEach((d, k) => d.classList.toggle('on', k === cur));
  const s = slides[cur];
  ctag.textContent = s.dataset.tag; ctitle.textContent = s.dataset.title; cdesc.textContent = s.dataset.desc;
}
dots.forEach((d, k) => d.onclick = () => go(k));
const car = document.getElementById('car');
car.onmouseenter = () => paused = true; car.onmouseleave = () => paused = false;
setInterval(() => { if (!paused && !document.hidden) go(cur + 1); }, 4500);
go(0);

// Lightbox
function showLB() { const s = slides[cur]; document.getElementById('lightbox-img').src = s.querySelector('img').src; document.getElementById('lightbox-caption').textContent = s.dataset.title; }
document.getElementById('stage').onclick = () => { paused = true; showLB(); lightbox.classList.add('open'); document.body.style.overflow = 'hidden'; };
function closeLightbox() { lightbox.classList.remove('open'); document.body.style.overflow = ''; paused = false; }
function shiftLB(d) { go(cur + d); showLB(); }
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') shiftLB(-1);
  if (e.key === 'ArrowRight') shiftLB(1);
});

const POLICY_V='2026-09-27', KEY='ypd-consent-v2';
const HASHES={'#aviso-legal':'aviso','#terminos':'terminos','#privacidad':'privacidad','#uso-de-datos':'datos','#cookies':'cookies','#contenido':'contenido'};
function openLegal(tab){
  document.querySelectorAll('.legal-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.legal-pane').forEach(p=>p.classList.toggle('active',p.id==='legal-'+tab));
  document.querySelector('.legal-body').scrollTop=0;
  document.getElementById('legal-modal').classList.add('open'); document.body.style.overflow='hidden';
}
function closeLegal(){document.getElementById('legal-modal').classList.remove('open');document.body.style.overflow='';}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLegal();});
function showBanner(){document.getElementById('consent-banner').classList.add('show');document.body.classList.add('has-banner');}
function acceptConsent(){
  document.getElementById('consent-banner').classList.remove('show');document.body.classList.remove('has-banner');
  try{localStorage.setItem(KEY,JSON.stringify({v:POLICY_V,t:new Date().toISOString()}));}catch(e){}
}
function withdrawConsent(){try{localStorage.removeItem(KEY);localStorage.removeItem('ypd-consent');}catch(e){} closeLegal(); showBanner();}
(function(){let ok=false;try{const c=JSON.parse(localStorage.getItem(KEY)||'null');ok=!!c&&c.v===POLICY_V;}catch(e){} if(!ok)setTimeout(showBanner,900);})();
function fromHash(){const t=HASHES[location.hash];if(t)openLegal(t);}
addEventListener('hashchange',fromHash);fromHash();

// ─────────────────────────────────────────────
  // MUSIC ENGINE — Web Audio API (sin archivos externos)
  // Ambient corporativo: pad suave + arpeggio sutil + bajo lento
  // ─────────────────────────────────────────────
  let audioCtx = null, masterGain = null, musicPlaying = false;
  let padNodes = [], arpNodes = [], bassNodes = [], reverbNode = null;

  const NOTES = {
    // Escala pentatónica mayor en A — suena positiva y moderna
    pad:  [220, 277.18, 329.63, 369.99, 440, 554.37, 659.26],
    arp:  [440, 554.37, 659.26, 739.99, 880, 659.26, 554.37, 440],
    bass: [55, 55, 73.42, 55]
  };

  function createReverb(ctx) {
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2.5);
    }
    conv.buffer = buf;
    return conv;
  }

  function makePad(ctx, freq, gain) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 2.5);
    osc.connect(g);
    g.connect(reverbNode);
    osc.start();
    return { osc, g };
  }

  function playArp(ctx) {
    const notes = NOTES.arp;
    let step = 0;
    const interval = setInterval(() => {
      if (!musicPlaying) { clearInterval(interval); return; }
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = notes[step % notes.length];
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      step++;
    }, 420);
    arpNodes.push({ stop: () => clearInterval(interval) });
  }

  function playBass(ctx) {
    const notes = NOTES.bass;
    let step = 0;
    const interval = setInterval(() => {
      if (!musicPlaying) { clearInterval(interval); return; }
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[step % notes.length];
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 2);
      step++;
    }, 1680);
    bassNodes.push({ stop: () => clearInterval(interval) });
  }

  function startMusic() {
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = parseFloat(document.getElementById('music-vol-slider').value);
    masterGain.connect(audioCtx.destination);

    reverbNode = createReverb(audioCtx);
    reverbNode.connect(masterGain);

    // Pad: acordes suaves superpuestos
    const padFreqs = [220, 277.18, 329.63, 369.99];
    padFreqs.forEach((f, i) => {
      const node = makePad(audioCtx, f, 0.055 - i*0.005);
      padNodes.push(node);
    });

    playArp(audioCtx);
    playBass(audioCtx);
    musicPlaying = true;
  }

  function stopMusic() {
    if (!audioCtx) return;
    musicPlaying = false;

    padNodes.forEach(n => {
      n.g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
      setTimeout(() => { try { n.osc.stop(); } catch(e){} }, 1300);
    });
    arpNodes.forEach(n => n.stop());
    bassNodes.forEach(n => n.stop());
    padNodes = []; arpNodes = []; bassNodes = [];

    setTimeout(() => {
      try { audioCtx.close(); } catch(e){}
      audioCtx = null; masterGain = null; reverbNode = null;
    }, 1400);
  }

  function toggleMusic() {
    const btn    = document.getElementById('music-btn');
    const player = document.getElementById('music-player');
    const bars   = document.getElementById('music-bars');

    // Si ya está "sonando" pero el navegador aún lo tiene bloqueado, el clic lo desbloquea
    if (musicPlaying && audioCtx && audioCtx.state === 'suspended') { unlockAudio(); return; }

    if (!musicPlaying) {
      musicUserPaused = false;
      startMusic();
      unlockAudio();
      setMusicUI(true);
    } else {
      musicUserPaused = true;
      stopMusic();
      btn.textContent = '▶';
      bars.classList.remove('playing');
      document.getElementById('music-sub').textContent = 'Your Perfect Design · Ambient';
      setTimeout(() => player.classList.remove('expanded'), 1200);
    }
  }

  function setMusicUI(on) {
    const btn = document.getElementById('music-btn');
    const player = document.getElementById('music-player');
    const bars = document.getElementById('music-bars');
    const sub = document.getElementById('music-sub');
    if (on) {
      btn.textContent = '⏸';
      player.classList.add('expanded');
      const blocked = audioCtx && audioCtx.state === 'suspended';
      bars.classList.toggle('playing', !blocked);
      sub.textContent = blocked ? 'Toca la pantalla para activar el sonido' : 'Your Perfect Design · Ambient';
    }
  }

  function unlockAudio() {
    if (!audioCtx || audioCtx.state === 'running') { setMusicUI(true); return; }
    audioCtx.resume().then(() => setMusicUI(true)).catch(() => {});
  }

  // ── Música automática ──
  // Los navegadores bloquean el sonido hasta que la persona interactúa con la página,
  // así que se intenta iniciar al cargar y se activa con la primera interacción.
  let musicUserPaused = false;
  function autoStartMusic() {
    if (musicPlaying || musicUserPaused) return;
    try { startMusic(); setMusicUI(true); } catch (e) { return; }
    if (audioCtx && audioCtx.state === 'suspended') {
      const events = ['pointerdown', 'click', 'keydown', 'touchstart'];
      const unlock = (ev) => {
        if (ev && ev.target && ev.target.closest && ev.target.closest('#music-player')) return; // lo maneja el botón
        if (musicUserPaused) return;
        unlockAudio();
        if (audioCtx && audioCtx.state === 'running') events.forEach(n => document.removeEventListener(n, unlock, true));
      };
      events.forEach(n => document.addEventListener(n, unlock, true));
    }
  }
  window.addEventListener('load', () => setTimeout(autoStartMusic, 400));

  function setVolume(v) {
    if (masterGain) masterGain.gain.value = parseFloat(v);
  }

  // Expand player on hover cuando no está expandido
  document.getElementById('music-player').addEventListener('mouseenter', () => {
    if (musicPlaying) return;
    document.getElementById('music-player').classList.add('expanded');
  });
  document.getElementById('music-player').addEventListener('mouseleave', () => {
    if (musicPlaying) return;
    document.getElementById('music-player').classList.remove('expanded');
  });

  
