const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BY = Object.fromEntries(ALGOS.map(a => [a.id, a]));
const app = $('#app');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const marr = a => `<span class="marr">${a.map(v => `<i>${v}</i>`).join('')}</span>`;
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('sortopia.' + k)); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('sortopia.' + k, JSON.stringify(v)); } catch (e) { } }
};

let LAB = null, HERO = null, RACE = null, PENDING = null;
const SCORE = { ok: 0, no: 0 };
const SPEEDS = [1700, 1150, 780, 480, 240, 90];

function toast(msg) {
  const t = $('#toast');
  t.innerHTML = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200);
}

function confetti(n = 90) {
  const fx = $('#fx');
  const cols = ['#12B5E0', '#FF4F9A', '#FFA41B', '#1FC37A', '#FF6A3D', '#8B5CF6', '#FFD43B'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i');
    d.className = 'conf';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.background = cols[i % cols.length];
    d.style.setProperty('--dx', rand(-160, 160) + 'px');
    d.style.setProperty('--rot', rand(-720, 720) + 'deg');
    d.style.animationDuration = (1.6 + Math.random() * 1.8) + 's';
    d.style.animationDelay = Math.random() * .35 + 's';
    if (Math.random() < .3) d.style.borderRadius = '50%';
    fx.appendChild(d);
    setTimeout(() => d.remove(), 4200);
  }
}

const Sound = {
  on: store.get('sound', false), ctx: null,
  beep(f, dur = .09, type = 'triangle', vol = .07, delay = 0) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g).connect(this.ctx.destination); o.start(t0); o.stop(t0 + dur + .02);
    } catch (e) { }
  },
  cmp(v) { this.beep(320 + (v % 60) * 9, .07, 'sine', .05); },
  swap() { this.beep(520, .07); this.beep(780, .09, 'triangle', .07, .07); },
  win() { [523, 659, 784, 1046].forEach((f, i) => this.beep(f, .16, 'triangle', .08, i * .1)); },
  ok() { this.beep(660, .1); this.beep(990, .14, 'triangle', .07, .09); },
  bad() { this.beep(200, .2, 'sawtooth', .05); }
};

function buildSky() {
  const sky = $('#sky');
  const toks = ['O(n log n)', 'swap', 'i++', 'pivot', '{ }', 'heapify', '<=', 'arr[j]', 'O(n²)', 'merge()', 'key', 'j--', '42', '7', '13', 'mid', 'return', 'n - 1', '2i + 1', 'for', 'while', '0', '99'];
  let html = '';
  toks.forEach((t, i) => {
    html += `<span style="left:${rand(0, 96)}%;font-size:${rand(14, 34)}px;animation-duration:${rand(26, 60)}s;animation-delay:-${rand(0, 60)}s">${esc(t)}</span>`;
  });
  const blobs = ['#12B5E0', '#FF4F9A', '#FFA41B', '#8B5CF6'];
  blobs.forEach((c, i) => {
    const s = rand(160, 300);
    html += `<span class="blob" style="width:${s}px;height:${s}px;background:${c};left:${[5, 80, 60, 15][i]}%;top:${[20, 10, 70, 80][i]}%;animation-duration:${rand(8, 14)}s"></span>`;
  });
  sky.innerHTML = html;
}

function buildNav() {
  $('#nav').innerHTML = `
    <a href="#/" data-r="home">${ic('home')} الرئيسية</a>
    <span class="sep"></span>
    ${ALGOS.map(a => `<a class="dot" href="#/algo/${a.id}" data-r="${a.id}" data-tip="${a.en}" style="--dc:${a.color}">${ic(a.icon)}</a>`).join('')}
    <span class="sep"></span>
    <a href="#/bank" data-r="bank">${ic('quiz')} بنك الأسئلة</a>
    <a href="#/race" data-r="race">${ic('flag')} السباق</a>
    <button id="sndBtn" title="الصوت">${ic(Sound.on ? 'vol' : 'mute')}</button>`;
  $('#sndBtn').onclick = () => {
    Sound.on = !Sound.on; store.set('sound', Sound.on);
    $('#sndBtn').innerHTML = ic(Sound.on ? 'vol' : 'mute');
    toast(Sound.on ? 'الصوت اشتغل' : 'الصوت اتقفل');
    Sound.ok();
  };
}
function setNav(r) { $$('#nav [data-r]').forEach(a => a.classList.toggle('on', a.dataset.r === r)); }

/* ================= C++ CODE ================= */
function parseCode(src, arr) {
  const tagmap = {}, lines = [];
  src.split('\n').forEach((ln, idx) => {
    const m = ln.match(/\s*@@([\w,]+)\s*$/);
    if (m) { ln = ln.slice(0, m.index); m[1].split(',').forEach(t => (tagmap[t] = tagmap[t] || []).push(idx)); }
    ln = ln.replace('{ARR}', '{' + arr.join(', ') + '}').replace('= N;', '= ' + arr.length + ';');
    lines.push(ln);
  });
  return { lines, tagmap };
}
const KW = new Set(['int', 'void', 'for', 'if', 'else', 'while', 'return', 'using', 'namespace', 'bool', 'true', 'false', 'break', 'sizeof']);
function hl(line) {
  if (/^\s*\/\//.test(line)) return `<span class="tk-c">${esc(line)}</span>`;
  if (/^\s*#/.test(line)) return `<span class="tk-pp">${esc(line)}</span>`;
  return line.replace(/("[^"]*")|(\b\d+\b)|(\b[A-Za-z_]\w*\b)(\s*\()?|([^"\w]+)/g, (m, str, num, id, paren, other) => {
    if (str) return `<span class="tk-s">${esc(str)}</span>`;
    if (num) return `<span class="tk-n">${num}</span>`;
    if (id) {
      if (KW.has(id)) return `<span class="tk-k">${id}</span>${paren ? esc(paren) : ''}`;
      if (paren) return `<span class="tk-f">${id}</span>${esc(paren)}`;
      if (['cout', 'endl', 'std'].includes(id)) return `<span class="tk-b">${id}</span>`;
      return `<span class="tk-v">${id}</span>`;
    }
    return `<span class="tk-o">${esc(other)}</span>`;
  });
}

/* ================= STAGE (animated bars) ================= */
class Stage {
  constructor(el, { compact = false, bounds = false } = {}) {
    this.el = el; this.compact = compact; this.useBounds = bounds;
    el.classList.add('stage'); if (compact) el.classList.add('compact');
    this.tiles = new Map(); this.ptrs = new Map(); this.idxEls = []; this.lastVals = new Map();
  }
  init(values) {
    this.el.innerHTML = ''; this.tiles.clear(); this.ptrs.clear(); this.lastVals.clear(); this.idxEls = [];
    this.n = values.length; this.min = Math.min(...values); this.max = Math.max(...values);
    if (!this.compact) for (let i = 0; i < this.n; i++) {
      const d = document.createElement('div'); d.className = 'idx'; d.textContent = i;
      this.el.appendChild(d); this.idxEls.push(d);
    }
    this.fresh = true;
    this.measure();
  }
  measure() {
    const W = this.el.clientWidth || 600, H = this.el.clientHeight || 300, n = this.n;
    const gap = this.compact ? Math.max(2, Math.min(6, W / n * .12)) : (W < 500 ? 6 : 10);
    const extra = this.useBounds ? (this.compact ? 5 : (W < 500 ? 8 : 20)) : 0;
    const pad = this.compact ? 8 : 18;
    const maxB = this.useBounds ? n - 1 : 0;
    this.w = Math.max(8, Math.min(this.compact ? 46 : 72, (W - 2 * pad - (n - 1) * gap - maxB * extra) / n));
    Object.assign(this, { W, H, gap, extra });
    this.maxH = this.compact ? H - 16 : H - 92 - 44;
    this.minH = this.compact ? 8 : 44;
  }
  height(v) { return this.minH + (this.max === this.min ? .6 : (v - this.min) / (this.max - this.min)) * (this.maxH - this.minH); }
  xOf(idx, bounds) {
    const cnt = bounds.filter(b => b < Math.floor(idx + 1e-9) || (idx % 1 !== 0 && b < idx)).length;
    const total = this.n * this.w + (this.n - 1) * this.gap + bounds.length * this.extra;
    return (this.W - total) / 2 + idx * (this.w + this.gap) + cnt * this.extra;
  }
  render(step, animate = true) {
    const bounds = this.useBounds ? step.bounds : [];
    const cls = new Map();
    const add = (i, c) => { if (!cls.has(i)) cls.set(i, []); cls.get(i).push(c); };
    step.sorted.forEach(i => add(i, 'done'));
    if (step.range) for (let i = 0; i < this.n; i++) if (i < step.range[0] || i > step.range[1]) add(i, 'dim');
    for (const [c, arr] of Object.entries(step.marks)) arr.forEach(i => add(i, c));
    const swaps = step.marks.swap || [];
    step.tiles.forEach((t, i) => {
      let el = this.tiles.get(t.id);
      if (!el) {
        el = document.createElement('div');
        el.innerHTML = '<div class="inner"><div class="badge"></div><div class="bar"><span class="val"></span></div></div>';
        el._inner = el.firstChild; el._badge = el._inner.firstChild; el._bar = el._inner.lastChild; el._val = el._bar.firstChild;
        this.el.appendChild(el); this.tiles.set(t.id, el);
      }
      const set = cls.get(i) || [];
      let c = 'tile' + (this.w < 40 ? ' sm' : '') + set.map(x => ' ' + x).join('') + (step.lifted === t.id ? ' lifted' : '');
      const changed = this.lastVals.has(t.id) && this.lastVals.get(t.id) !== t.v;
      if (animate && swaps.includes(i) && swaps.length === 2) c += i === Math.min(...swaps) ? ' hop' : ' hop2';
      if (animate && changed) c += ' pop';
      if (el.className !== c || c.includes('hop') || c.includes('pop')) {
        el.className = c.replace(/ (hop2?|pop)/g, '');
        if (/hop|pop/.test(c)) { void el.offsetWidth; el.className = c; }
      }
      el.style.width = this.w + 'px';
      el.style.transform = `translateX(${this.xOf(i, bounds)}px)`;
      el._bar.style.height = this.height(t.v) + 'px';
      el._val.textContent = t.v;
      const bd = set.includes('pivot') ? 'crown' : set.includes('min') ? 'target' : '';
      if (el._badge.dataset.i !== bd) { el._badge.dataset.i = bd; el._badge.innerHTML = bd ? ic(bd) : ''; }
      this.lastVals.set(t.id, t.v);
    });
    this.idxEls.forEach((d, i) => { d.style.width = this.w + 'px'; d.style.transform = `translateX(${this.xOf(i, bounds)}px)`; });
    if (!this.compact) {
      const seen = new Set(), stackAt = {};
      step.ptrs.forEach(p => {
        let el = this.ptrs.get(p.n);
        if (!el) { el = document.createElement('div'); el.innerHTML = '<span></span>'; this.el.appendChild(el); this.ptrs.set(p.n, el); }
        const key = Math.round(p.i * 10);
        const k = stackAt[key] = (stackAt[key] || 0) + 1;
        el.className = 'ptr ' + p.c;
        el.firstChild.textContent = p.label || p.n;
        el.style.transform = `translate(calc(${this.xOf(p.i, bounds) + this.w / 2}px - 50%), ${-62 + k * 30}px)`;
        seen.add(p.n);
      });
      this.ptrs.forEach((el, k) => { if (!seen.has(k)) el.classList.add('gone'); });
    }
    if (this.fresh) {
      this.fresh = false;
      const all = [...this.tiles.values(), ...this.idxEls];
      all.forEach(e => e.style.transition = 'none');
      void this.el.offsetWidth;
      all.forEach(e => e.style.transition = '');
    }
  }
}

class Tree {
  constructor(el) { this.el = el; el.className = 'tree'; this.nodes = new Map(); }
  init(n) {
    this.n = n; this.nodes.clear();
    this.el.innerHTML = '<svg></svg>';
    this.svg = this.el.firstChild;
    this.levels = Math.floor(Math.log2(n)) + 1;
    this.measure();
  }
  measure() {
    this.W = this.el.clientWidth || 600; this.H = this.el.clientHeight || 250;
    this.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    let s = '';
    for (let k = 1; k < this.n; k++) {
      const a = this.pos(Math.floor((k - 1) / 2)), b = this.pos(k);
      s += `<line data-k="${k}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    }
    this.svg.innerHTML = s;
    this.lines = $$('line', this.svg);
  }
  pos(k) {
    const lv = Math.floor(Math.log2(k + 1)), p = k - (2 ** lv - 1);
    const dy = this.levels > 1 ? (this.H - 76) / (this.levels - 1) : 0;
    return { x: (p + .5) / 2 ** lv * this.W, y: 44 + lv * dy };
  }
  render(step) {
    const size = step.heap == null ? this.n : step.heap;
    const cls = {};
    for (const [c, arr] of Object.entries(step.marks)) arr.forEach(i => (cls[i] = cls[i] || []).push(c));
    this.lines.forEach(l => l.classList.toggle('cut', +l.dataset.k >= size));
    step.tiles.forEach((t, i) => {
      let el = this.nodes.get(t.id);
      if (!el) { el = document.createElement('div'); this.el.appendChild(el); this.nodes.set(t.id, el); }
      const p = this.pos(i);
      el.className = 'tnode ' + (cls[i] || []).join(' ') + (i >= size ? ' out' : '') + (i === 0 && size > 0 ? ' root' : '');
      el.innerHTML = `<small>[${i}]</small>${t.v}`;
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });
  }
}

/* ================= ROUTER ================= */
function stopAll() {
  if (LAB) { clearTimeout(LAB.timer); LAB.playing = false; }
  if (HERO) clearTimeout(HERO.t);
  if (RACE) clearTimeout(RACE.t);
  LAB = HERO = RACE = null;
}
function route() {
  stopAll();
  const parts = (location.hash.slice(1) || '/').split('/');
  app.className = '';
  app.style.removeProperty('--c'); app.style.removeProperty('--cd');
  if (parts[1] === 'algo' && BY[parts[2]]) { renderAlgo(parts[2]); setNav(parts[2]); }
  else if (parts[1] === 'bank') { renderBank(); setNav('bank'); }
  else if (parts[1] === 'race') { renderRace(); setNav('race'); }
  else { renderHome(); setNav('home'); }
  void app.offsetWidth; app.className = 'view-enter';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ================= HOME ================= */
function cxClass(v) { return v.includes('²') ? 'cx-bad' : v.includes('log') ? 'cx-mid' : 'cx-good'; }
function renderHome() {
  app.innerHTML = `
  <section class="hero">
    <div>
      <span class="eyebrow">Algorithms Design &amp; Analysis · C++</span>
      <h1>الست خوارزميات<br><span class="hl">عايشين <em>قدامك</em></span></h1>
      <p class="lead">Bubble · Selection · Insertion · Merge · Quick · Heap — كل سطر <bdi>C++</bdi> من المنهج بيتنفّذ قدام عينك خطوة بخطوة:
      تشوف المقارنة والتبديل والـ recursion والشجرة، ومعاك تريسنج زي اللي بتكتبه في الامتحان، وأسئلة البنك والكويز في نفس المكان.</p>
      <div class="cta">
        <a class="btn big" href="#/algo/bubble" style="--c:#FFD43B">ابدأ الرحلة ${ic('arrow-left')}</a>
        <a class="btn big ghost" href="#/race">${ic('flag')} سباق الخوارزميات</a>
      </div>
      <div class="hero-stats">
        <div>6<small>خوارزميات بمعمل كامل</small></div>
        <div>${BANK.length}<small>سؤال بالإجابة والشرح</small></div>
        <div>∞<small>تحديات تريسنج</small></div>
      </div>
    </div>
    <div class="hero-viz">
      <div class="hv-card">
        <div class="hv-top"><span class="dots"><i></i><i></i><i></i></span><span class="hv-name" id="hvName">…</span><span class="hv-count" id="hvCount"></span></div>
        <div class="hv-stage" id="hvStage"></div>
      </div>
      <span class="hv-sticker s1">${ic('swap')} swap!</span>
      <span class="hv-sticker s2">O(n log n)</span>
      <span class="hv-sticker s3">i++</span>
    </div>
  </section>

  <section>
    <h2 class="sec" style="margin-top:40px">${hi('arrow-down')}اختار خوارزمية <small>كل واحدة عالم لوحدها: حكاية، معمل تريسنج، كود <bdi>C++</bdi> وأسئلة</small></h2>
    <div class="algo-grid">
      ${ALGOS.map((a, i) => `
      <a class="acard" href="#/algo/${a.id}" style="--c:${a.color};--cd:${a.deep}">
        <span class="num">0${i + 1}</span>
        <span class="mini-bars">${[5, 2, 4, 1, 3].map(h => `<i style="height:${h * 13}px" data-h="${h}"></i>`).join('')}</span>
        <div class="em">${ic(a.icon)}</div>
        <div class="en">${a.en}</div>
        <h3>خوارزمية ${a.ar}</h3>
        <p>${a.tagline}</p>
        <div class="chips"><span class="chip">${a.cx.avg}</span><span class="chip">${a.cx.paradigm}</span></div>
        <span class="go">←</span>
      </a>`).join('')}
    </div>
  </section>

  <section class="card">
    <h2 class="sec">${hi('scale')}مقارنة في نظرة واحدة <small>الجدول اللي الدكتورة بتحب تسأل منه</small></h2>
    <div class="cmp-wrap"><table class="cmp-table">
      <tr><th>Algorithm</th><th>Best</th><th>Average</th><th>Worst</th><th>Space</th><th>Stable</th><th>Paradigm</th></tr>
      ${ALGOS.map(a => `<tr style="--c:${a.color}"><td><span></span>${a.en}</td>
        <td class="${cxClass(a.cx.best)}">${a.cx.best}${a.cx.bestNote ? '*' : ''}</td><td class="${cxClass(a.cx.avg)}">${a.cx.avg}</td>
        <td class="${cxClass(a.cx.worst)}">${a.cx.worst}</td><td>${a.cx.space}</td><td>${ic(a.cx.stable ? 'check' : 'x')}</td><td>${a.cx.paradigm}</td></tr>`).join('')}
    </table></div>
    <p class="hint">* Bubble: O(n) بس في النسخة Optimized (بالـ swapped flag) — Insertion: O(n) لو الـ array مترتبة أصلاً.</p>
  </section>

  <section class="promo">
    <div class="card" style="background:#FFD43B">
      <h3>سباق الخوارزميات</h3>
      <p>الست خوارزميات بيرتبوا نفس الـ array في نفس الوقت — مين هيخلص الأول؟ جرّب array معكوسة أو شبه مترتبة وشوف النتيجة بتتقلب ازاي.</p>
      <a class="btn dark" href="#/race">يلا نتسابق</a>
      <span class="big-em">${ic('flag')}</span>
    </div>
    <div class="card" style="background:#C9F4DD">
      <h3>بنك الأسئلة</h3>
      <p>كل أسئلة البنك والكويز (MCQ، صح وغلط، مقالي، تريسنج) بالإجابة والشرح بالعربي، + تحدي تريسنج بيتولد لوحده كل مرة.</p>
      <a class="btn dark" href="#/bank">ادخل اختبر نفسك</a>
      <span class="big-em">${ic('cap')}</span>
    </div>
  </section>
  <p class="foot">مبني على محاضرات ومراجعات مادة Algorithms Design &amp; Analysis · الأكواد <bdi>C++</bdi> زي المنهج بالظبط</p>`;

  $$('.acard').forEach(c => {
    const bars = $$('.mini-bars i', c);
    c.addEventListener('mouseenter', () => [...bars].map(b => +b.dataset.h).sort((x, y) => x - y).forEach((h, i) => bars[i].style.height = h * 13 + 'px'));
    c.addEventListener('mouseleave', () => bars.forEach(b => b.style.height = b.dataset.h * 13 + 'px'));
  });

  const st = new Stage($('#hvStage'), { compact: true, bounds: true });
  HERO = { st, k: 0 };
  const runHero = () => {
    if (!HERO) return;
    const a = ALGOS[HERO.k++ % ALGOS.length];
    const arr = Array.from({ length: 14 }, () => rand(5, 99));
    const steps = trace(a.id, arr, 'opt').steps.filter((s, i, all) => s.kind || i === all.length - 1);
    $('#hvStage').style.setProperty('--c', a.color);
    $('#hvName').innerHTML = ic(a.icon) + ' ' + a.en;
    $('#hvName').style.setProperty('--hc', a.color);
    st.init(arr); st.render({ ...steps[0], marks: {}, sorted: [], range: null, bounds: [] });
    let i = 0, ops = 0;
    const tick = () => {
      if (!HERO) return;
      const s = steps[i++];
      st.render(s);
      if (s.kind) ops++;
      $('#hvCount').textContent = ops + ' ops';
      HERO.t = setTimeout(i < steps.length ? tick : runHero, i < steps.length ? 85 : 1600);
    };
    HERO.t = setTimeout(tick, 500);
  };
  runHero();
}

/* ================= ALGO PAGE ================= */
const LEGENDS = {
  bubble: [['--cmp', 'بنقارن'], ['--swap', 'بنبدّل'], ['--done', 'في مكانه النهائي']],
  selection: [['--min', 'أصغر رقم لحد دلوقتي'], ['--cmp', 'بنقارنه'], ['--swap', 'بنبدّل'], ['--done', 'اترتب']],
  insertion: [['--part', 'الجزء المترتب'], ['--cmp', 'key في الإيد / بنقارن'], ['--wl', 'اتزحزح يمين'], ['--done', 'اتحط في مكانه']],
  merge: [['--wl', 'اتكتب من L'], ['--wr', 'اتكتب من R'], ['--stale', 'قيمة قديمة لسه هيتكتب عليها'], ['--done', 'جزء مترتب'], ['--paper', 'باهت = برة الـ call الحالي']],
  quick: [['--pivot', 'الـ pivot'], ['--lt', 'أصغر من الـ pivot'], ['--cmp', 'بنقارن'], ['--swap', 'بنبدّل'], ['--done', 'في مكانه النهائي']],
  heap: [['--cmp', 'بنقارن الأب بالابن'], ['--done', 'largest / اترتب'], ['--swap', 'بنبدّل'], ['--min', 'شجرة = نفس الـ array']]
};
const KIND = { cmp: 'مقارنة', swap: 'تحريك', done: 'خلصنا' };

function renderAlgo(id) {
  const a = BY[id], i = ALGOS.indexOf(a);
  const prevA = ALGOS[(i + 5) % 6], nextA = ALGOS[(i + 1) % 6];
  app.style.setProperty('--c', a.color); app.style.setProperty('--cd', a.deep);
  const cx = a.cx;
  app.innerHTML = `
  <section class="algo-hero">
    <div class="ah-main">
      <div class="ah-emoji">${ic(a.icon)}</div>
      <div>
        <div class="ah-en">${a.en}</div>
        <h1 class="ah-ar">خوارزمية ${a.ar}</h1>
        <p class="ah-tag">${a.tagline}</p>
      </div>
    </div>
    <div class="cx-grid">
      <div class="cx"><small>Best</small><b>${cx.best}</b>${cx.bestNote ? `<i>${cx.bestNote}</i>` : ''}</div>
      <div class="cx"><small>Average</small><b>${cx.avg}</b></div>
      <div class="cx"><small>Worst</small><b>${cx.worst}</b></div>
      <div class="cx"><small>Space</small><b>${cx.space}</b></div>
      <div class="cx"><small>Stable</small><b>${cx.stable ? 'Yes' : 'No'}</b></div>
      <div class="cx"><small>Paradigm</small><b style="font-size:13px">${cx.paradigm}</b></div>
    </div>
  </section>
  <div class="ah-pager">
    <div class="jump"><a class="btn sm ghost" href="#story" data-j>${ic('book')} الحكاية</a><a class="btn sm ghost" href="#lab" data-j>${ic('flask')} المعمل</a><a class="btn sm ghost" href="#practice" data-j>${ic('quiz')} اختبر نفسك</a></div>
    <div class="jump"><a class="btn sm ghost" href="#/algo/${prevA.id}">→ ${ic(prevA.icon)} ${prevA.en}</a><a class="btn sm" href="#/algo/${nextA.id}">${nextA.en} ${ic(nextA.icon)} ←</a></div>
  </div>

  <section class="card story" id="story">
    <div>
      <h2 class="sec">${hi('book')}الحكاية</h2>
      <p class="story-txt">${icx(a.story)}</p>
      <ol class="steps-list">${a.steps.map(s => `<li>${icx(s)}</li>`).join('')}</ol>
    </div>
    <div class="tips"><h3>${ic('eye')} خلي بالك</h3><ul>${a.tips.map(t => `<li>${icx(t)}</li>`).join('')}</ul></div>
  </section>

  <section class="card lab" id="lab">
    <div class="lab-head">
      <h2 class="sec">${hi('flask')}المعمل <small>الكود بيتنفّذ سطر سطر</small></h2>
      <div class="in-row">
        <input class="arr-in" id="arrIn" spellcheck="false" aria-label="array">
        <button class="btn sm" id="runBtn">شغّل ▶</button>
        <button class="btn sm ghost" id="rndBtn" title="array عشوائية">${ic('dice')}</button>
        <button class="btn sm ghost" id="defBtn" title="مثال المادة">${ic('book')} مثال المادة</button>
      </div>
    </div>
    <div class="toggles" style="margin-top:12px">
      ${id === 'bubble' ? `<div class="seg" id="varSeg"><button data-v="basic" class="on">كود AllCode</button><button data-v="opt">Optimized (swapped flag)</button></div>` : ''}
      <button class="btn sm ghost" id="chalBtn">${ic('target')} وضع التحدي</button>
      <span class="chal-score" id="chalScore" hidden></span>
    </div>
    <div class="stack-bar" id="stack"></div>
    <div class="stage-box">
      ${id === 'heap' ? '<div id="tree"></div>' : ''}
      <div id="stage"></div>
      <div class="aux" id="aux"></div>
    </div>
    <div class="narrator">
      <div class="nar-av" id="narAv">${ic(a.icon)}</div>
      <div class="nar-bubble" id="nar"></div>
    </div>
    <div class="controls">
      <button class="ctl" id="cFirst" title="البداية">${ic('first')}</button>
      <button class="ctl" id="cPrev" title="خطوة لورا">${ic('prev')}</button>
      <button class="ctl play" id="cPlay" title="تشغيل">${ic('play')}</button>
      <button class="ctl" id="cNext" title="خطوة لقدام">${ic('next')}</button>
      <button class="ctl" id="cLast" title="النهاية">${ic('last')}</button>
      <div class="scrub"><div class="cnt"><span id="cCnt"></span><span id="cTag"></span></div><input type="range" id="cRange" min="0" value="0"></div>
      <div class="speed">${ic('slow')}<input type="range" id="cSpeed" min="0" max="5">${ic('fast')}</div>
    </div>
    <div class="legend">${LEGENDS[id].map(([v, t]) => `<span><i style="background:var(${v})"></i>${t}</span>`).join('')}</div>
    <div class="hint"><span class="kbd">Space</span> تشغيل/وقف <span class="kbd">→</span> <span class="kbd">←</span> خطوة · دوسي على أي صف في جدول التريسنج يرجعك للخطوة دي</div>
    <div class="lab-grid">
      <div class="code-panel">
        <div class="code-head"><span class="dots"><i></i><i></i><i></i></span>${id}.cpp<span class="sp"></span><button id="copyBtn">copy</button></div>
        <div class="code" id="code"></div>
      </div>
      <div class="side">
        <div class="panel"><h4>${ic('braces')} المتغيرات</h4><div class="vars" id="vars"></div></div>
        <div class="panel"><h4>${ic('table')} جدول التريسنج</h4><div class="log-wrap" id="log"></div></div>
        <div class="term" id="term"></div>
      </div>
    </div>
  </section>

  <section class="card" id="practice">
    <h2 class="sec">${hi('quiz')}اختبر نفسك <small>أسئلة البنك والكويز الخاصة بـ ${a.en} + تحدي تريسنج</small></h2>
    <div id="tgen"></div>
    <div class="qgrid" id="qs"></div>
  </section>
  <div class="ah-pager" style="margin-top:28px">
    <a class="btn ghost" href="#/algo/${prevA.id}">→ ${ic(prevA.icon)} ${prevA.en}</a>
    <a class="btn" href="#/algo/${nextA.id}" style="--c:${nextA.color}">الخوارزمية اللي بعدها: ${nextA.en} ${ic(nextA.icon)} ←</a>
  </div>`;

  $$('[data-j]').forEach(b => b.onclick = e => { e.preventDefault(); $(b.getAttribute('href')).scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  const stage = new Stage($('#stage'), { bounds: id === 'merge' || id === 'quick' });
  const tree = id === 'heap' ? new Tree($('#tree')) : null;
  LAB = { a, id, variant: 'basic', stage, tree, idx: 0, playing: false, timer: null, speed: store.get('speed', 2), challenge: false, answered: {}, sc: { ok: 0, n: 0 }, lastVars: {}, nlogs: -1 };
  $('#cSpeed').value = LAB.speed;

  const start = PENDING && PENDING.id === id ? PENDING.arr : a.arr;
  PENDING = null;
  loadRun(start);

  $('#runBtn').onclick = () => { const arr = parseArr($('#arrIn').value); if (arr) loadRun(arr); };
  $('#arrIn').onkeydown = e => { if (e.key === 'Enter') $('#runBtn').click(); };
  $('#rndBtn').onclick = () => loadRun(Array.from({ length: id === 'merge' ? 7 : 6 }, () => rand(1, 99)));
  $('#defBtn').onclick = () => loadRun(a.arr);
  if ($('#varSeg')) $$('#varSeg button').forEach(b => b.onclick = () => {
    $$('#varSeg button').forEach(x => x.classList.toggle('on', x === b));
    LAB.variant = b.dataset.v; loadRun(LAB.arr);
  });
  $('#chalBtn').onclick = () => {
    LAB.challenge = !LAB.challenge;
    $('#chalBtn').classList.toggle('on', LAB.challenge);
    $('#chalScore').hidden = !LAB.challenge;
    updScore();
    toast(LAB.challenge ? 'وضع التحدي: هسألك قبل كل قرار — توقّعي الصح!' : 'وضع التحدي اتقفل');
    renderStep(false);
  };
  $('#cFirst').onclick = () => { pause(); go(0, false); };
  $('#cLast').onclick = () => { pause(); go(LAB.res.steps.length - 1, true); };
  $('#cPrev').onclick = () => { pause(); go(LAB.idx - 1, false); };
  $('#cNext').onclick = () => { pause(); next(); };
  $('#cPlay').onclick = () => LAB.playing ? pause() : play();
  $('#cRange').oninput = e => { pause(); go(+e.target.value, false); };
  $('#cSpeed').oninput = e => { LAB.speed = +e.target.value; store.set('speed', LAB.speed); };
  $('#copyBtn').onclick = () => {
    const txt = LAB.code.lines.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(ic('check') + ' الكود اتنسخ'), () => toast('مقدرتش أنسخ'));
  };

  traceGen($('#tgen'), id);
  renderQs($('#qs'), BANK.filter(q => q.top.includes(id)));
}

function parseArr(s) {
  const parts = s.split(/[\s,،;]+/).filter(Boolean);
  const arr = parts.map(Number);
  const bad = msg => { toast(msg); const el = $('#arrIn'); el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); return null; };
  if (arr.some(x => !Number.isInteger(x))) return bad('اكتبي أرقام صحيحة بس، مفصولة بـ comma');
  if (arr.length < 2 || arr.length > 10) return bad('من 2 لـ 10 أرقام عشان الرسمة تبان حلوة');
  if (arr.some(x => x < -99 || x > 999)) return bad('الأرقام من -99 لـ 999');
  return arr;
}

function loadRun(arr) {
  pause();
  const L = LAB;
  L.arr = arr.slice();
  $('#arrIn').value = arr.join(', ');
  L.res = trace(L.id, arr, L.variant);
  const key = L.id === 'bubble' && L.variant === 'opt' ? 'bubbleOpt' : L.id;
  L.code = parseCode(CODES[key], arr);
  $('#code').innerHTML = L.code.lines.map((l, i) => `<div class="ln"><span class="no">${i + 1}</span><span>${hl(l) || ' '}</span></div>`).join('');
  L.lineEls = $$('.ln', $('#code'));
  L.onLines = [];
  L.stage.init(arr);
  if (L.tree) L.tree.init(arr.length);
  L.answered = {}; L.sc = { ok: 0, n: 0 }; updScore();
  L.lastVars = {}; L.nlogs = -1;
  $('#cRange').max = L.res.steps.length - 1;
  go(0, false);
}

function go(i, animate = true) {
  const L = LAB;
  L.idx = Math.max(0, Math.min(L.res.steps.length - 1, i));
  renderStep(animate);
}
function next() {
  const L = LAB, s = L.res.steps[L.idx];
  if (L.challenge && s.q && L.answered[L.idx] === undefined) {
    toast('جاوبي على السؤال الأول');
    const b = $('#nar'); b.classList.remove('shake'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = 'shake .4s';
    return false;
  }
  if (L.idx >= L.res.steps.length - 1) return false;
  go(L.idx + 1, true);
  return true;
}
function play() {
  const L = LAB;
  if (L.idx >= L.res.steps.length - 1) go(0, false);
  L.playing = true; $('#cPlay').innerHTML = ic('pause');
  const tick = () => {
    if (!LAB || !L.playing) return;
    const s = L.res.steps[L.idx];
    if ((L.challenge && s.q && L.answered[L.idx] === undefined) || L.idx >= L.res.steps.length - 1) { pause(); return; }
    next();
    L.timer = setTimeout(tick, SPEEDS[L.speed]);
  };
  L.timer = setTimeout(tick, 200);
}
function pause() {
  if (!LAB) return;
  LAB.playing = false; clearTimeout(LAB.timer);
  const b = $('#cPlay'); if (b) b.innerHTML = ic('play');
}
function updScore() {
  const el = $('#chalScore');
  if (el) el.innerHTML = `${ic('target')} ${LAB.sc.ok} / ${LAB.sc.n}`;
}

function renderStep(animate) {
  const L = LAB, s = L.res.steps[L.idx], N = L.res.steps.length;
  L.stage.render(s, animate);
  if (L.tree) L.tree.render(s);

  L.onLines.forEach(i => L.lineEls[i].classList.remove('on'));
  L.onLines = s.tags.flatMap(t => L.code.tagmap[t] || []);
  L.onLines.forEach(i => L.lineEls[i].classList.add('on'));
  if (L.onLines.length) {
    const box = $('#code'), el = L.lineEls[L.onLines[0]];
    box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + 30, behavior: animate ? 'smooth' : 'auto' });
  }

  renderNarr();

  const vb = $('#vars');
  const ents = Object.entries(s.vars);
  vb.innerHTML = ents.length ? ents.map(([k, v]) => `<div class="var${L.lastVars[k] !== undefined && L.lastVars[k] !== v ? ' flash' : ''}"><b>${k}</b><span>${v}</span></div>`).join('') : '<span class="log-empty">—</span>';
  L.lastVars = s.vars;

  $('#stack').innerHTML = `<span class="lbl">Call stack:</span><span class="fr">main()</span>` + s.stack.map(f => `<span class="arrow">›</span><span class="fr">${f}</span>`).join('');

  const aux = $('#aux');
  if (s.aux && s.aux.type === 'merge') {
    const row = (nm, arr, p, pn) => `<div class="aux-arr aux-${nm}"><b>${nm}</b>${arr.map((v, k) => `<div class="aux-cell${k < p ? ' used' : ''}${k === p ? ' cur' : ''}" data-p="${pn}">${v}</div>`).join('')}</div>`;
    aux.classList.add('on');
    aux.innerHTML = row('L', s.aux.L, s.aux.i, 'i') + row('R', s.aux.R, s.aux.j, 'j');
  } else { aux.classList.remove('on'); aux.innerHTML = ''; }

  if (s.nlogs !== L.nlogs) {
    L.nlogs = s.nlogs;
    const logs = L.res.logs.slice(0, s.nlogs);
    $('#log').innerHTML = logs.length ? `<table class="log-t">${logs.map((g, k) => `<tr data-at="${g.at}" class="${k === logs.length - 1 ? 'last' : ''}"><td class="lb">${esc(g.label)}</td><td>${marr(g.arr)}</td><td>${esc(g.note)}</td></tr>`).join('')}</table>`
      : `<p class="log-empty">الجدول هيتملي مع كل ${L.id === 'merge' ? 'merge' : L.id === 'quick' ? 'partition' : 'pass'} بتخلص…</p>`;
    $$('#log tr').forEach(tr => tr.onclick = () => { pause(); go(+tr.dataset.at, false); });
    const lw = $('#log'); lw.scrollTop = lw.scrollHeight;
  }

  $('#term').innerHTML = `<span class="pr">$ g++ ${L.id}.cpp -o sort &amp;&amp; ./sort</span><br>${esc(s.out)}<span class="cur"></span>`;

  const r = $('#cRange'); r.value = L.idx; r.style.setProperty('--p', (L.idx / Math.max(1, N - 1) * 100) + '%');
  $('#cCnt').textContent = `خطوة ${L.idx + 1} / ${N}`;
  $('#cTag').textContent = s.tags.join(' · ');

  if (animate) {
    if (s.kind === 'cmp') Sound.cmp(s.tiles[(s.marks.cmp || [0])[0]] ? s.tiles[(s.marks.cmp || [0])[0]].v : 40);
    if (s.kind === 'swap') Sound.swap();
    if (s.kind === 'done') { Sound.win(); confetti(); }
  }
}

function renderNarr() {
  const L = LAB, s = L.res.steps[L.idx], N = L.res.steps.length;
  const box = $('#nar');
  const meta = `<div class="nar-meta"><span>خطوة ${L.idx + 1} من ${N}</span>${s.kind ? `<span class="k ${s.kind}">${KIND[s.kind]}</span>` : ''}</div>`;
  if (L.challenge && s.q && L.answered[L.idx] === undefined) {
    box.innerHTML = meta + `<div class="msg quiz-q">${ic('question')} ${s.q.text}<div class="opts">${s.q.opts.map((o, k) => `<button class="btn sm ghost" data-k="${k}">${o}</button>`).join('')}</div></div>`;
    $$('button', box).forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === s.q.ans;
      L.answered[L.idx] = k; L.sc.n++; if (ok) L.sc.ok++;
      updScore();
      if (ok) { Sound.ok(); confetti(24); } else Sound.bad();
      renderNarr();
    });
  } else {
    let fb = '';
    if (L.challenge && s.q && L.answered[L.idx] !== undefined) {
      const ok = L.answered[L.idx] === s.q.ans;
      fb = `<div class="fb ${ok ? 'ok' : 'no'}">${ok ? ic('check') + ' برافو! توقّع صح' : ic('x') + ' لأ المرة دي، بصي ليه:'}</div>`;
    }
    box.innerHTML = meta + `<div class="msg">${fb}${icx(s.msg)}</div>`;
  }
  const av = $('#narAv'); av.classList.remove('talk'); void av.offsetWidth; av.classList.add('talk');
}

/* ================= QUESTIONS ================= */
function bumpScore(ok) {
  ok ? SCORE.ok++ : SCORE.no++;
  ok ? Sound.ok() : Sound.bad();
  if ($('#sOk')) { $('#sOk').innerHTML = ic('check') + ' ' + SCORE.ok; $('#sNo').innerHTML = ic('x') + ' ' + SCORE.no; }
}
function renderQs(box, items) {
  box.innerHTML = '';
  items.forEach(it => box.appendChild(qCard(it)));
  if (!items.length) box.innerHTML = '<p class="log-empty">مفيش أسئلة بالفلتر ده</p>';
}
function qCard(it) {
  const el = document.createElement('div');
  el.className = 'q';
  const typ = { mcq: 'اختيار من متعدد', tf: 'صح ولا غلط', essay: 'مقالي', fill: 'أكمل الكود' }[it.t];
  const ar = /[؀-ۿ]/.test(it.q);
  el.innerHTML = `<div class="q-top"><span class="tag" style="--tc:#FFD43B">${typ}</span>${it.top.map(t => `<span class="tag" style="--tc:${TOPICS[t].color}40">${ic(TOPICS[t].icon)} ${TOPICS[t].name}</span>`).join('')}<span class="tag src">${it.src}</span></div>
    <div class="q-text${ar ? ' ar' : ''}">${esc(it.q)}</div>`;
  const why = () => { const w = document.createElement('div'); w.className = 'why'; w.innerHTML = ic('bulb') + ' ' + icx(it.why); el.appendChild(w); };
  if (it.t === 'mcq' || it.t === 'tf') {
    const opts = it.t === 'mcq' ? it.o : ['True — صح', 'False — غلط'];
    const ans = it.t === 'mcq' ? it.a : (it.a ? 0 : 1);
    const wrap = document.createElement('div');
    wrap.className = it.t === 'mcq' ? 'opts' : 'tf-row';
    wrap.innerHTML = opts.map((o, k) => `<button class="opt" data-k="${k}">${it.t === 'mcq' ? `<i>${'ABCD'[k]}</i>` : ''}<span>${esc(o)}</span></button>`).join('');
    el.appendChild(wrap);
    $$('.opt', wrap).forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === ans;
      $$('.opt', wrap).forEach(x => x.disabled = true);
      wrap.children[ans].classList.add('ok');
      if (!ok) b.classList.add('no');
      el.classList.add(ok ? 'right' : 'wrong');
      if (ok) confetti(18);
      bumpScore(ok); why();
    });
  } else if (it.t === 'essay') {
    const b = document.createElement('button');
    b.className = 'btn sm ghost'; b.style.marginTop = '10px'; b.innerHTML = ic('eye') + ' اظهر الإجابة';
    const ans = document.createElement('div'); ans.className = 'ans'; ans.innerHTML = icx(it.ans); ans.hidden = true;
    b.onclick = () => { ans.hidden = !ans.hidden; b.innerHTML = ans.hidden ? ic('eye') + ' اظهر الإجابة' : ic('eye-off') + ' اخفي الإجابة'; };
    el.append(b, ans);
  } else if (it.t === 'fill') {
    const code = document.createElement('div'); code.className = 'fill-code';
    code.innerHTML = it.lines.map(seg => {
      const m = seg.match(/^\[\[(.*)\]\]$/);
      return m ? `<input data-a="${esc(m[1])}" size="${m[1].length + 1}" spellcheck="false">` : hl(seg);
    }).join('');
    const row = document.createElement('div'); row.className = 'tf-row';
    row.innerHTML = '<button class="btn sm">' + ic('check') + ' صحّحي</button><button class="btn sm ghost">اظهر الحل</button>';
    const norm = s => s.replace(/\s+/g, '').replace(/^--j$|^j-=1$|^j=j-1$/, 'j--');
    row.children[0].onclick = () => {
      let good = 0; const ins = $$('input', code);
      ins.forEach(x => { const ok = norm(x.value) === norm(x.dataset.a); x.className = ok ? 'ok' : 'no'; if (ok) good++; });
      const all = good === ins.length;
      toast(all ? ic('sparkles') + ' كله صح!' : `${good} من ${ins.length} صح — حاولي تاني`);
      if (all) { confetti(); Sound.win(); } else Sound.bad();
    };
    row.children[1].onclick = () => $$('input', code).forEach(x => { x.value = x.dataset.a; x.className = 'ok'; });
    el.append(code, row);
  }
  return el;
}

function traceGen(box, fixedId) {
  let cur = fixedId || 'bubble';
  const chooser = fixedId ? '' : `<div class="filters" id="tgPick">${ALGOS.map(a => `<button class="fchip${a.id === cur ? ' on' : ''}" data-id="${a.id}">${ic(a.icon)} ${a.en}</button>`).join('')}</div>`;
  box.innerHTML = `<div class="tgen"><h3>${ic('dice')} تحدي التريسنج <small style="font-family:var(--f-ar);font-size:13px;color:var(--ink2)">سؤال جديد كل مرة — زي سؤال الامتحان بالظبط</small></h3>${chooser}<div id="tgBody"></div></div>`;
  if (!fixedId) $$('#tgPick .fchip', box).forEach(b => b.onclick = () => {
    cur = b.dataset.id; $$('#tgPick .fchip', box).forEach(x => x.classList.toggle('on', x === b)); make();
  });
  const make = () => {
    const a = BY[cur];
    const n = cur === 'merge' ? 6 : 5;
    let arr;
    do { arr = Array.from({ length: n }, () => rand(1, 60)); } while (new Set(arr).size < n);
    const res = trace(cur, arr, 'basic');
    const logs = res.logs;
    const g = logs[rand(0, Math.max(0, logs.length - 2))];
    const key = x => x.join(',');
    const right = key(g.arr);
    const pool = new Map([[right, g.arr]]);
    shuffle([...logs.map(l => l.arr), arr, arr.slice().sort((x, y) => x - y)]).forEach(x => { if (pool.size < 4 && !pool.has(key(x))) pool.set(key(x), x); });
    while (pool.size < 4) { const x = g.arr.slice(); const p = rand(0, n - 2); [x[p], x[p + 1]] = [x[p + 1], x[p]]; if (!pool.has(key(x))) pool.set(key(x), x); }
    const opts = shuffle([...pool.values()]);
    const what = g.label === 'Max Heap' ? 'بناء الـ Max Heap' : `<code>${esc(g.label)}</code>`;
    $('#tgBody', box).innerHTML = `<p class="tq">${ic(a.icon)} <b>${a.en}</b> على ${marr(arr)} — إيه شكل الـ array بعد ${what}؟</p>
      <div class="topts">${opts.map(o => `<button class="topt" data-k="${key(o)}">${marr(o)}</button>`).join('')}</div>
      <div class="tfoot"><button class="btn sm" id="tgNew">${ic('dice')} سؤال تاني</button><button class="btn sm ghost" id="tgLab">${ic('flask')} افتحيه في المعمل</button><span id="tgMsg"></span></div>`;
    $$('.topt', box).forEach(b => b.onclick = () => {
      const ok = b.dataset.k === right;
      $$('.topt', box).forEach(x => { x.disabled = true; if (x.dataset.k === right) x.classList.add('ok'); });
      if (!ok) b.classList.add('no'); else confetti(30);
      bumpScore(ok);
      $('#tgMsg', box).innerHTML = ok ? ic('check') + ' مظبوط!' : ic('x') + ' مش دي — افتحيها في المعمل وشوفي الخطوات';
    });
    $('#tgNew', box).onclick = make;
    $('#tgLab', box).onclick = () => {
      if (LAB && LAB.id === cur) {
        if (LAB.variant !== 'basic' && $('#varSeg')) $('#varSeg button[data-v=basic]').click();
        loadRun(arr); $('#lab').scrollIntoView({ behavior: 'smooth' });
      } else { PENDING = { id: cur, arr }; location.hash = '#/algo/' + cur; }
    };
  };
  make();
}

/* ================= BANK ================= */
function renderBank() {
  app.innerHTML = `
  <section class="card">
    <h2 class="sec">${hi('quiz')}بنك الأسئلة <small>بنك الأسئلة + كويز 2 + أسئلة إضافية — كله بالإجابة والشرح</small></h2>
    <div class="scoreboard" style="margin-top:10px">
      <span class="score-pill" id="sOk" style="background:var(--part)">${ic('check')} ${SCORE.ok}</span>
      <span class="score-pill" id="sNo" style="background:#FFD1DF">${ic('x')} ${SCORE.no}</span>
      <button class="btn sm ghost" id="resetQ">${ic('reset')} ابدأ من الأول</button>
    </div>
    <div class="filters" id="fType">
      ${[['all', 'الكل'], ['mcq', 'اختيار من متعدد'], ['tf', 'صح ولا غلط'], ['essay', 'مقالي وتريسنج'], ['fill', 'أكمل الكود']].map(([k, t], i) => `<button class="fchip${i ? '' : ' on'}" data-k="${k}">${t}</button>`).join('')}
    </div>
    <div class="filters" id="fTop">
      <button class="fchip on" data-k="all">كل المواضيع</button>
      ${Object.entries(TOPICS).map(([k, t]) => `<button class="fchip" data-k="${k}">${ic(t.icon)} ${t.name}</button>`).join('')}
    </div>
  </section>
  <section class="card" id="tgenWrap"></section>
  <div class="qgrid" id="qs"></div>`;
  let ft = 'all', fp = 'all';
  const apply = () => renderQs($('#qs'), BANK.filter(q => (ft === 'all' || q.t === ft) && (fp === 'all' || q.top.includes(fp))));
  const bind = (sel, set) => $$(sel + ' .fchip').forEach(b => b.onclick = () => { $$(sel + ' .fchip').forEach(x => x.classList.toggle('on', x === b)); set(b.dataset.k); apply(); });
  bind('#fType', k => ft = k); bind('#fTop', k => fp = k);
  $('#resetQ').onclick = () => { SCORE.ok = SCORE.no = 0; $('#sOk').innerHTML = ic('check') + ' 0'; $('#sNo').innerHTML = ic('x') + ' 0'; apply(); };
  traceGen($('#tgenWrap'));
  apply();
}

/* ================= RACE ================= */
function renderRace() {
  app.innerHTML = `
  <section class="card" style="background:#FFD43B">
    <h2 class="sec">${hi('flag')}سباق الخوارزميات <small style="color:var(--ink)">نفس الـ array للست — كل تِك = عملية واحدة (مقارنة أو تبديل/كتابة)</small></h2>
    <div class="race-ctl">
      <div class="seg" id="rSize">${[8, 14, 24].map((s, i) => `<button data-v="${s}" class="${i === 1 ? 'on' : ''}">${s} عنصر</button>`).join('')}</div>
      <div class="seg" id="rPat">${[['rand', 'عشوائي'], ['rev', 'معكوس'], ['near', 'شبه مترتب'], ['sorted', 'مترتب']].map(([k, t], i) => `<button data-v="${k}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div>
      <div class="speed">${ic('slow')}<input type="range" id="rSpeed" min="0" max="4" value="3">${ic('fast')}</div>
      <button class="btn dark" id="rGo">${ic('play')} انطلق!</button>
      <button class="btn ghost" id="rNew">array جديدة</button>
    </div>
  </section>
  <div class="lanes" id="lanes"></div>
  <section class="card race-sum" id="rSum" hidden></section>`;
  let size = 14, pat = 'rand';
  const segs = (sel, set) => $$(sel + ' button').forEach(b => b.onclick = () => { $$(sel + ' button').forEach(x => x.classList.toggle('on', x === b)); set(b.dataset.v); setup(); });
  segs('#rSize', v => size = +v); segs('#rPat', v => pat = v);
  const RS = [140, 70, 35, 14, 4];
  const setup = () => {
    if (RACE) clearTimeout(RACE.t);
    let arr = Array.from({ length: size }, () => rand(3, 99));
    if (pat === 'rev') arr.sort((x, y) => y - x);
    if (pat === 'sorted' || pat === 'near') arr.sort((x, y) => x - y);
    if (pat === 'near') for (let k = 0; k < Math.max(1, size / 7); k++) { const p = rand(0, size - 2); [arr[p], arr[p + 1]] = [arr[p + 1], arr[p]]; }
    $('#lanes').innerHTML = ALGOS.map(a => `<div class="lane" style="--c:${a.color}" id="ln-${a.id}">
      <span class="medal"></span>
      <div class="lane-h"><span class="em">${ic(a.icon)}</span><b>${a.en}</b></div>
      <div class="stage-mini" id="rs-${a.id}"></div>
      <div class="lane-stats"><span>cmp <b class="c">0</b></span><span>moves <b class="m">0</b></span><span>total <b class="t">0</b></span></div></div>`).join('');
    $('#rSum').hidden = true;
    const lanes = ALGOS.map(a => {
      const steps = trace(a.id, arr, 'opt').steps.filter((s, i, all) => s.kind || i === all.length - 1);
      const st = new Stage($('#rs-' + a.id), { compact: true });
      st.init(arr); st.render({ ...steps[0], marks: {}, sorted: [], range: null, bounds: [] }, false);
      return { a, steps, st, i: 0, c: 0, m: 0, done: false, el: $('#ln-' + a.id) };
    });
    RACE = { lanes, place: 0, t: null, running: false };
    $('#rGo').innerHTML = ic('play') + ' انطلق!';
  };
  const run = () => {
    if (!RACE || RACE.running) return;
    if (RACE.lanes.every(l => l.done)) setup();
    RACE.running = true; $('#rGo').innerHTML = ic('pause') + ' بيجروا…';
    const tick = () => {
      if (!RACE) return;
      let alive = 0;
      RACE.lanes.forEach(l => {
        if (l.done) return;
        const s = l.steps[l.i++];
        l.st.render(s);
        if (s.kind === 'cmp') l.c++; else if (s.kind === 'swap') l.m++;
        $('.c', l.el).textContent = l.c; $('.m', l.el).textContent = l.m; $('.t', l.el).textContent = l.c + l.m;
        if (l.i >= l.steps.length) {
          l.done = true; RACE.place++;
          l.place = RACE.place;
          const md = $('.medal', l.el); md.dataset.p = RACE.place; md.innerHTML = ic('trophy') + '<b>' + RACE.place + '</b>';
          l.el.classList.add('fin');
          if (RACE.place === 1) Sound.win();
        } else alive++;
      });
      if (alive) RACE.t = setTimeout(tick, RS[+$('#rSpeed').value]);
      else finish();
    };
    tick();
  };
  const finish = () => {
    RACE.running = false; $('#rGo').innerHTML = ic('reset') + ' تاني!';
    confetti(60);
    const order = RACE.lanes.slice().sort((x, y) => x.place - y.place);
    const notes = {
      rand: 'في الـ array العشوائية الـ O(n log n) (Merge و Quick و Heap) بيسبقوا — وكل ما الـ n تكبر الفرق بيبقى أوضح.',
      rev: 'المعكوسة هي الـ worst case لـ Bubble و Insertion: كل مقارنة تقريباً بتعمل swap/shift.',
      near: 'شبه مترتبة؟ Insertion و Bubble (Optimized) بيطيروا — ده بالظبط ليه Insertion ممتاز للـ data اللي قربت تترتب.',
      sorted: 'مترتبة أصلاً: Bubble (Optimized) و Insertion بيخلصوا في O(n)، بينما Quick (pivot = آخر عنصر) بيقع في الـ worst case O(n²)!'
    };
    const s = $('#rSum'); s.hidden = false;
    s.innerHTML = `<h2 class="sec">${hi('trophy')}النتيجة</h2><ol>${order.map(l => `<li><b>${ic(l.a.icon)} ${l.a.en}</b> — ${l.c + l.m} عملية (${l.c} مقارنة + ${l.m} تحريك)</li>`).join('')}</ol>
      <p class="tips" style="margin-top:16px;transform:none">${ic('bulb')} ${notes[pat]}</p>`;
  };
  $('#rGo').onclick = run;
  $('#rNew').onclick = setup;
  setup();
}

/* ================= GLOBAL ================= */
document.addEventListener('keydown', e => {
  if (!LAB || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); LAB.playing ? pause() : play(); }
  if (e.key === 'ArrowRight') { e.preventDefault(); pause(); next(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); pause(); go(LAB.idx - 1, false); }
});
let rzT;
window.addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    if (LAB) { LAB.stage.measure(); if (LAB.tree) LAB.tree.measure(); renderStep(false); }
    if (RACE) RACE.lanes.forEach(l => { l.st.measure(); l.st.render(l.steps[Math.max(0, l.i - 1)], false); });
    if (HERO) HERO.st.measure();
  }, 120);
});
window.addEventListener('hashchange', () => {
  const h = location.hash;
  if (h.startsWith('#/') || h === '') route();
});

buildSky();
buildNav();
route();
