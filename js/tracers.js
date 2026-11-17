const nb = x => `<b class="n">${x}</b>`;
const la = a => `<span class="al">[${a.join(', ')}]</span>`;
const rng = (a, b) => { const r = []; for (let x = a; x <= b; x++) r.push(x); return r; };

class Rec {
  constructor(arr) {
    this.n = arr.length;
    this.tiles = arr.map((v, i) => ({ id: i, v }));
    this.steps = []; this.vars = {}; this.sorted = new Set(); this.stack = []; this.bounds = new Set();
    this.logs = []; this.out = ''; this.lifted = null; this.aux = null; this.range = null; this.heap = null;
  }
  v(i) { return this.tiles[i].v; }
  vals(a = 0, b = this.n - 1) { return this.tiles.slice(a, b + 1).map(t => t.v); }
  swap(a, b) { const t = this.tiles[a]; this.tiles[a] = this.tiles[b]; this.tiles[b] = t; }
  set(k, v) { this.tiles[k] = { id: this.tiles[k].id, v }; }
  log(label, note) { this.logs.push({ label, note, arr: this.vals(), at: this.steps.length }); }
  snap(tag, msg, o = {}) {
    this.steps.push({
      tiles: this.tiles.map(t => ({ id: t.id, v: t.v })),
      tags: Array.isArray(tag) ? tag : [tag],
      msg, vars: { ...this.vars }, sorted: [...this.sorted], stack: [...this.stack], bounds: [...this.bounds],
      marks: this.aux && this.aux.k != null ? { stale: rng(this.aux.k, this.aux.r), ...(o.marks || {}) } : (o.marks || {}),
      ptrs: o.ptrs || [], lifted: this.lifted,
      aux: this.aux ? JSON.parse(JSON.stringify(this.aux)) : null,
      range: this.range ? [...this.range] : null, heap: this.heap,
      kind: o.kind || null, q: o.q || null, out: this.out, nlogs: this.logs.length
    });
  }
  intro(fn, frame = true) {
    this.vars = { n: this.n };
    if (frame) this.stack.push(fn.replace(/\(.*\)/, '(arr, n)'));
    this.snap('init', `عندنا array فيها ${nb(this.n)} أرقام ${la(this.vals())} — عايزين نرتبها تصاعدي`);
    this.snap('call', `<code>main</code> بتنادي على <code>${fn}</code> — يلا نبدأ`);
    if (!frame) this.stack = [];
  }
  finish(prefix = '') {
    this.range = null; this.aux = null; this.bounds.clear(); this.lifted = null; this.heap = null; this.stack = [];
    rng(0, this.n - 1).forEach(i => this.sorted.add(i));
    this.vars = { n: this.n };
    this.snap(prefix ? 'print' : 'call2', `[[i:sparkles]] الـ array اترتبت! ${la(this.vals())} نرجع لـ <code>main</code> ونطبع النتيجة`);
    this.out = prefix + this.vals().join(' ');
    this.snap('print', `الـ Output على الشاشة: <code>${this.out}</code> [[i:sparkles]] خلصنا!`, { kind: 'done' });
    return { steps: this.steps, logs: this.logs };
  }
}

const YES = 'أيوه [[i:check]]', NO = 'لأ [[i:x]]';

const TRACERS = {
  bubble(arr, variant) {
    const T = new Rec(arr), n = T.n, opt = variant === 'opt';
    T.intro('bubbleSort(arr, ' + n + ')');
    for (let i = 0; i < n - 1; i++) {
      T.vars = { n, i };
      T.snap('outer', `<b>Pass ${i + 1}</b> (i = ${i}) — هنقارن من index 0 لحد ${n - 2 - i} ونطلّع أكبر رقم للآخر`);
      let swapped = false;
      if (opt) { T.vars.swapped = 'false'; T.snap('flag', `<code>swapped = false</code> — لسه محصلش ولا تبديل في الـ pass دي`); }
      for (let j = 0; j < n - 1 - i; j++) {
        T.vars.j = j;
        const a = T.v(j), b = T.v(j + 1), big = a > b;
        const ptrs = [{ n: 'j', i: j, c: 'p2' }, { n: 'j+1', i: j + 1, c: 'p3' }];
        T.snap(['inner', 'cmp'], `بنقارن <code>arr[${j}] = ${a}</code> مع <code>arr[${j + 1}] = ${b}</code> — هل ${a} &gt; ${b}؟ ${big ? YES + ' الكبير لازم يروح يمين' : NO + ' مترتبين، مفيش تبديل'}`,
          { marks: { cmp: [j, j + 1] }, ptrs, kind: 'cmp', q: { text: `هل ${a} و ${b} هيتبدلوا؟`, opts: ['أيوه هيتبدلوا', 'لأ مكانهم صح'], ans: big ? 0 : 1 } });
        if (big) {
          T.swap(j, j + 1); swapped = true;
          if (opt) T.vars.swapped = 'true';
          T.snap('swap', `بدّلنا [[i:swap]] دلوقتي <code>arr[${j}] = ${b}</code> و <code>arr[${j + 1}] = ${a}</code>`, { marks: { swap: [j, j + 1] }, ptrs, kind: 'swap' });
        }
      }
      T.sorted.add(n - 1 - i);
      T.log(`Pass ${i + 1}`, swapped ? `${T.v(n - 1 - i)} وصل لمكانه` : 'مفيش ولا swap');
      let extra = '';
      if (!swapped && !opt) extra = ' — لاحظ: مفيش ولا swap يعني الـ array مترتبة، بس الكود ده (من غير flag) هيكمل يلف. جرّب نسخة <b>Optimized</b>!';
      T.vars = opt ? { n, i, swapped: String(swapped) } : { n, i };
      T.snap('outer', `خلصت Pass ${i + 1} [[i:sparkles]] الرقم ${nb(T.v(n - 1 - i))} وصل لمكانه النهائي (index ${n - 1 - i})${extra}`, { marks: { done: [n - 1 - i] } });
      if (opt && !swapped) {
        rng(0, n - 1).forEach(x => T.sorted.add(x));
        T.snap('brk', `<code>!swapped</code> = true → <b>break</b> مفيش ولا swap في الـ pass دي يبقى الـ array مترتبة خلاص — ده اللي بيخلي الـ Best case = O(n)`);
        break;
      }
    }
    return T.finish();
  },

  selection(arr) {
    const T = new Rec(arr), n = T.n;
    T.intro('selectionSort(arr, ' + n + ')');
    for (let i = 0; i < n - 1; i++) {
      let mi = i;
      T.vars = { n, i, minIndex: mi };
      const P = () => [{ n: 'i', i, c: 'p1' }, { n: 'min', i: mi, c: 'p4' }];
      T.snap(['outer', 'minInit'], `<b>Pass ${i + 1}</b>: بنفترض إن أصغر رقم هو <code>arr[${i}] = ${T.v(i)}</code> → <code>minIndex = ${i}</code> [[i:target]]`, { marks: { min: [mi] }, ptrs: P() });
      for (let j = i + 1; j < n; j++) {
        T.vars.j = j;
        const a = T.v(j), m = T.v(mi), less = a < m;
        T.snap(['inner', 'cmp'], `j = ${j}: هل <code>arr[${j}] = ${a}</code> أصغر من <code>arr[minIndex] = ${m}</code>؟ ${less ? YES + ' لقينا أصغر!' : NO + ' الـ min زي ما هو'}`,
          { marks: { cmp: [j], min: [mi] }, ptrs: [...P(), { n: 'j', i: j, c: 'p2' }], kind: 'cmp', q: { text: `هل ${a} أصغر من الـ min الحالي (${m})؟`, opts: ['أيوه أصغر', 'لأ'], ans: less ? 0 : 1 } });
        if (less) {
          mi = j; T.vars.minIndex = mi;
          T.snap('newMin', `<code>minIndex = ${j}</code> — الأصغر الجديد هو ${nb(a)} [[i:target]]`, { marks: { min: [mi] }, ptrs: [...P(), { n: 'j', i: j, c: 'p2' }] });
        }
      }
      delete T.vars.j;
      if (mi !== i) {
        const a = T.v(i), b = T.v(mi);
        T.swap(i, mi);
        T.snap('swap', `نبدّل <code>arr[${i}]</code> مع <code>arr[${mi}]</code> [[i:swap]] → ${nb(b)} راح أول الجزء المش مترتب و ${a} راح مكان ${mi}`, { marks: { swap: [i, mi] }, ptrs: P(), kind: 'swap' });
      } else {
        T.snap('swap', `<code>minIndex = i</code> — ${nb(T.v(i))} أصلاً هو الأصغر، التبديل مع نفسه مش هيغير حاجة`, { marks: { min: [i] }, ptrs: P() });
      }
      T.sorted.add(i);
      T.log(`Pass ${i + 1}`, `min = ${T.v(i)} → index ${i}`);
      T.snap('outer', `خلصت Pass ${i + 1} [[i:check]] الجزء المترتب دلوقتي ${la(T.vals(0, i))}`);
    }
    T.sorted.add(n - 1);
    T.snap('outer', `i وصلت ${n - 1} = n - 1 فالـ loop وقفت — آخر عنصر بيبقى في مكانه أوتوماتيك`);
    return T.finish();
  },

  insertion(arr) {
    const T = new Rec(arr), n = T.n;
    T.intro('insertionSort(arr, ' + n + ')');
    T.snap('outer', `أول عنصر ${nb(T.v(0))} لوحده يعتبر مترتب — نبدأ من <code>i = 1</code>`, { marks: { part: [0] } });
    for (let i = 1; i < n; i++) {
      const key = T.v(i);
      T.lifted = T.tiles[i].id;
      T.vars = { n, i, key };
      T.snap(['outer', 'key'], `i = ${i}: نشيل <code>key = ${key}</code> في إيدنا وندوّر له على مكان في الجزء المترتب ${la(T.vals(0, i - 1))}`,
        { marks: { part: rng(0, i - 1) }, ptrs: [{ n: 'i', i, c: 'p1' }] });
      let j = i - 1;
      T.vars.j = j;
      T.snap('jinit', `<code>j = i - 1 = ${j}</code> — هنبص على اللي على الشمال`, { marks: { part: rng(0, i - 1) }, ptrs: [{ n: 'j', i: j, c: 'p2' }] });
      while (true) {
        if (j < 0) {
          T.snap('while', `<code>j = -1</code> ← مش <code>&gt;= 0</code>، خرجنا برة الـ array — يعني ${key} أصغر من الكل ومكانه أول الـ array`, { marks: { part: rng(0, i - 1) } });
          break;
        }
        const a = T.v(j), big = a > key;
        T.snap('while', `<code>j = ${j} &gt;= 0</code> [[i:check]] — هل <code>arr[${j}] = ${a}</code> &gt; <code>key = ${key}</code>؟ ${big ? YES + ' نزحزحه يمين' : NO + ' لقينا المكان!'}`,
          { marks: { cmp: [j], part: rng(0, i - 1) }, ptrs: [{ n: 'j', i: j, c: 'p2' }], kind: 'cmp', q: { text: `هل ${a} هيتزحزح يمين؟`, opts: ['أيوه أكبر من key', 'لأ وقفنا'], ans: big ? 0 : 1 } });
        if (!big) break;
        T.swap(j, j + 1);
        j--; T.vars.j = j;
        T.snap('shift', `<code>arr[${j + 2}] = arr[${j + 1}]</code> → ${nb(a)} اتزحزح خطوة يمين و <code>j--</code> بقت ${j}`,
          { marks: { shift: [j + 2], part: rng(0, i) }, ptrs: j >= 0 ? [{ n: 'j', i: j, c: 'p2' }] : [], kind: 'swap' });
      }
      T.lifted = null;
      T.log(`i = ${i}`, `key ${key} → index ${j + 1}`);
      T.snap('place', `<code>arr[j + 1] = key</code> → حطينا ${nb(key)} في index ${j + 1} [[i:check]] الجزء المترتب بقى ${la(T.vals(0, i))}`, { marks: { part: rng(0, i), placed: [j + 1] } });
    }
    return T.finish();
  },

  merge(arr) {
    const T = new Rec(arr), n = T.n;
    T.intro('mergeSort(arr, 0, ' + (n - 1) + ')', false);
    const merge = (l, m, r) => {
      T.stack.push(`merge(${l}, ${m}, ${r})`);
      const n1 = m - l + 1, n2 = r - m;
      T.range = [l, r];
      T.vars = { left: l, mid: m, right: r, n1, n2 };
      T.snap(['mCall', 'sizes'], ` <b>merge</b>: ندمج ${la(T.vals(l, m))} و ${la(T.vals(m + 1, r))} — <code>n1 = ${n1}</code>, <code>n2 = ${n2}</code>`);
      const Ls = T.vals(l, m), Rs = T.vals(m + 1, r);
      T.aux = { type: 'merge', L: Ls, R: Rs, i: 0, j: 0 };
      T.snap('copy', `ننسخ النص الشمال في <code>L = [${Ls.join(', ')}]</code> واليمين في <code>R = [${Rs.join(', ')}]</code>`);
      let i = 0, j = 0, k = l;
      Object.assign(T.vars, { i, j, k });
      T.snap('ptrs', `<code>i = 0, j = 0, k = ${l}</code> — i على L، و j على R، و k المكان اللي هنكتب فيه في arr`, { ptrs: [{ n: 'k', i: k, c: 'p3' }] });
      const upd = () => { T.aux.i = i; T.aux.j = j; T.aux.k = k; T.aux.r = r; Object.assign(T.vars, { i, j, k }); };
      upd();
      while (i < n1 && j < n2) {
        upd();
        const a = Ls[i], b = Rs[j], left = a <= b;
        T.snap(['mloop', 'mcmp'], `نقارن <code>L[${i}] = ${a}</code> مع <code>R[${j}] = ${b}</code> — هل ${a} &lt;= ${b}؟ ${left ? YES + ` ياخد ${a} من L` : NO + ` ياخد ${b} من R`}`,
          { ptrs: [{ n: 'k', i: k, c: 'p3' }], kind: 'cmp', q: { text: `مين هيتكتب في arr[${k}]؟`, opts: [`${a} من L`, `${b} من R`], ans: left ? 0 : 1 } });
        if (left) { T.set(k, a); i++; k++; upd(); T.snap('takeL', `<code>arr[${k - 1}] = L[${i - 1}] = ${a}</code> [[i:pencil]] وبعدين <code>k++</code> و <code>i++</code>`, { marks: { wl: [k - 1] }, ptrs: [{ n: 'k', i: k <= r ? k : r, c: 'p3' }], kind: 'swap' }); }
        else { T.set(k, b); j++; k++; upd(); T.snap('takeR', `<code>arr[${k - 1}] = R[${j - 1}] = ${b}</code> [[i:pencil]] وبعدين <code>k++</code> و <code>j++</code>`, { marks: { wr: [k - 1] }, ptrs: [{ n: 'k', i: k <= r ? k : r, c: 'p3' }], kind: 'swap' }); }
      }
      while (i < n1) { const a = Ls[i]; T.set(k, a); i++; k++; upd(); T.snap('restL', `R خلص — ننسخ الباقي من L: <code>arr[${k - 1}] = ${a}</code>`, { marks: { wl: [k - 1] }, kind: 'swap' }); }
      while (j < n2) { const b = Rs[j]; T.set(k, b); j++; k++; upd(); T.snap('restR', `L خلص — ننسخ الباقي من R: <code>arr[${k - 1}] = ${b}</code>`, { marks: { wr: [k - 1] }, kind: 'swap' }); }
      T.aux = null; T.bounds.delete(m);
      T.log(`merge(${l},${m},${r})`, `[${T.vals(l, r).join(', ')}]`);
      T.vars = { left: l, mid: m, right: r };
      T.snap('mCall', `الدمج خلص [[i:check]] الجزء من ${l} لـ ${r} بقى مترتب ${la(T.vals(l, r))}`, { marks: { merged: rng(l, r) } });
      T.stack.pop();
    };
    const ms = (l, r) => {
      T.stack.push(`mergeSort(${l}, ${r})`);
      T.range = [l, r];
      T.vars = { left: l, right: r };
      if (l < r) {
        T.snap(['msCall', 'msIf'], `<code>mergeSort(${l}, ${r})</code> على ${la(T.vals(l, r))} — <code>left &lt; right</code> [[i:check]] فيه أكتر من عنصر، يبقى نقسم`);
        const m = l + Math.floor((r - l) / 2);
        T.bounds.add(m); T.vars.mid = m;
        T.snap('mid', `<code>mid = ${l} + (${r} - ${l}) / 2 = ${m}</code> قسمنا لـ ${la(T.vals(l, m))} و ${la(T.vals(m + 1, r))}`);
        T.snap('recL', `نرتب النص الشمال الأول: <code>mergeSort(arr, ${l}, ${m})</code>`);
        ms(l, m);
        T.range = [l, r]; T.vars = { left: l, right: r, mid: m };
        T.snap('recR', `الشمال اترتب. دلوقتي النص اليمين: <code>mergeSort(arr, ${m + 1}, ${r})</code>`);
        ms(m + 1, r);
        T.range = [l, r]; T.vars = { left: l, right: r, mid: m };
        T.snap('doMerge', `النصين مترتبين ${la(T.vals(l, m))} ${la(T.vals(m + 1, r))} — وقت الدمج: <code>merge(arr, ${l}, ${m}, ${r})</code>`);
        merge(l, m, r);
      } else {
        T.snap(['msCall', 'msIf'], `<code>mergeSort(${l}, ${r})</code> — <code>left = right</code> يعني عنصر واحد (${nb(T.v(l))}) — base case، مترتب لوحده [[i:check]]`, { marks: { merged: [l] } });
      }
      T.stack.pop();
    };
    ms(0, n - 1);
    return T.finish();
  },

  quick(arr) {
    const T = new Rec(arr), n = T.n;
    T.intro('quickSort(arr, 0, ' + (n - 1) + ')', false);
    const part = (low, high) => {
      T.stack.push(`partition(${low}, ${high})`);
      const pivot = T.v(high);
      T.vars = { low, high, pivot };
      T.snap(['pCall', 'pivot'], `<code>pivot = arr[${high}] = ${pivot}</code> [[i:crown]] (آخر عنصر في الجزء)`, { marks: { pivot: [high] } });
      let i = low - 1;
      T.vars.i = i;
      const P = (j) => [{ n: 'i', i: Math.max(i, low - 0.6), c: 'p1', label: i < low ? `i=${i}` : null }, ...(j !== undefined ? [{ n: 'j', i: j, c: 'p2' }] : [])];
      T.snap('iinit', `<code>i = low - 1 = ${i}</code> — i بيشاور على آخر عنصر أصغر من الـ pivot (لسه مفيش)`, { marks: { pivot: [high] }, ptrs: P() });
      for (let j = low; j < high; j++) {
        T.vars.j = j;
        const a = T.v(j), less = a < pivot;
        const lt = i >= low ? rng(low, i) : [];
        T.snap(['ploop', 'pcmp'], `j = ${j}: هل <code>arr[${j}] = ${a}</code> &lt; <code>pivot = ${pivot}</code>؟ ${less ? YES + ' يروح ناحية الشمال' : NO + ' يفضل مكانه (ناحية اليمين)'}`,
          { marks: { cmp: [j], pivot: [high], lt }, ptrs: P(j), kind: 'cmp', q: { text: `هل ${a} أصغر من الـ pivot ${pivot}؟`, opts: ['أيوه → شمال', 'لأ → يمين'], ans: less ? 0 : 1 } });
        if (less) {
          i++; T.vars.i = i;
          T.swap(i, j);
          T.snap('pswap', i === j ? `<code>i++</code> → i = ${i}، و i = j فالتبديل مع نفسه (مفيش تغيير)` : `<code>i++</code> → i = ${i} ونبدّل <code>arr[${i}]</code> مع <code>arr[${j}]</code> [[i:swap]]`,
            { marks: { swap: i === j ? [] : [i, j], pivot: [high], lt: rng(low, i) }, ptrs: P(j), kind: i === j ? null : 'swap' });
        }
      }
      delete T.vars.j;
      T.swap(i + 1, high);
      const p = i + 1;
      T.sorted.add(p);
      if (p - 1 >= low) T.bounds.add(p - 1);
      if (p < high) T.bounds.add(p);
      T.snap('pfinal', `نحط الـ pivot في مكانه: نبدّل <code>arr[${p}]</code> مع <code>arr[${high}]</code> [[i:pin]] كده ${nb(pivot)} في index ${p} — كل اللي شماله أصغر، وكل اللي يمينه أكبر أو يساوي`,
        { marks: { pivot: [p], lt: p > low ? rng(low, p - 1) : [] }, kind: 'swap' });
      T.log(`partition(${low},${high})`, `pivot ${pivot} → index ${p}`);
      T.vars = { low, high, p };
      T.snap('pret', `<code>return ${p}</code>`, { marks: { pivot: [p] } });
      T.stack.pop();
      return p;
    };
    const qs = (low, high) => {
      T.stack.push(`quickSort(${low}, ${high})`);
      T.range = [Math.max(low, 0), Math.min(high, n - 1)];
      T.vars = { low, high };
      if (low < high) {
        T.snap(['qsCall', 'qsIf'], `<code>quickSort(${low}, ${high})</code> على ${la(T.vals(low, high))} — <code>low &lt; high</code> [[i:check]] نعمل partition`);
        T.snap('callP', `<code>p = partition(arr, ${low}, ${high})</code>`);
        const p = part(low, high);
        T.range = [low, high]; T.vars = { low, high, p };
        T.snap('recL', `الـ pivot ثابت في مكانه [[i:pin]] نرتب الشمال: <code>quickSort(arr, ${low}, ${p - 1})</code>`);
        qs(low, p - 1);
        T.range = [low, high]; T.vars = { low, high, p };
        T.snap('recR', `نرتب اليمين: <code>quickSort(arr, ${p + 1}, ${high})</code>`);
        qs(p + 1, high);
      } else if (low === high) {
        T.sorted.add(low);
        T.snap(['qsCall', 'qsIf'], `<code>quickSort(${low}, ${high})</code> — عنصر واحد (${nb(T.v(low))}) — base case، مترتب لوحده [[i:check]]`);
      } else {
        T.range = null;
        T.snap(['qsCall', 'qsIf'], `<code>quickSort(${low}, ${high})</code> — <code>low &gt; high</code> جزء فاضي، مفيش شغل`);
      }
      T.stack.pop();
    };
    qs(0, n - 1);
    return T.finish();
  },

  heap(arr) {
    const T = new Rec(arr), n = T.n;
    T.heap = n;
    T.intro('heapSort(arr, ' + n + ')');
    const heapify = (size, i) => {
      T.stack.push(`heapify(arr, ${size}, ${i})`);
      let largest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      T.vars = { n: size, i, largest, left: l, right: r };
      const P = () => [{ n: 'i', i, c: 'p1' }, { n: 'L', i: largest, c: 'p4', label: 'largest' }];
      T.snap(['hCall', 'hinit'], `heapify عند index ${i} (${nb(T.v(i))}): <code>largest = ${i}</code>، <code>left = ${l}</code>${l < size ? ` (${T.v(l)})` : ' (مش موجود)'}، <code>right = ${r}</code>${r < size ? ` (${T.v(r)})` : ' (مش موجود)'}`,
        { marks: { cur: [i] }, ptrs: P() });
      if (l < size) {
        const big = T.v(l) > T.v(largest);
        T.snap('hl', `<code>left &lt; n</code> [[i:check]] — هل <code>arr[${l}] = ${T.v(l)}</code> &gt; <code>arr[largest] = ${T.v(largest)}</code>؟ ${big ? YES : NO}`,
          { marks: { cmp: [l, largest] }, ptrs: P(), kind: 'cmp', q: { text: `هل الابن الشمال ${T.v(l)} أكبر من ${T.v(largest)}؟`, opts: ['أيوه أكبر', 'لأ'], ans: big ? 0 : 1 } });
        if (big) { largest = l; T.vars.largest = largest; T.snap('hlset', `<code>largest = left = ${l}</code>`, { marks: { big: [l] }, ptrs: P() }); }
      } else T.snap('hl', `<code>left = ${l}</code> مش أقل من <code>n = ${size}</code> → مفيش ابن شمال (ورقة)`, { marks: { cur: [i] }, ptrs: P() });
      if (r < size) {
        const big = T.v(r) > T.v(largest);
        T.snap('hr', `<code>right &lt; n</code> [[i:check]] — هل <code>arr[${r}] = ${T.v(r)}</code> &gt; <code>arr[largest] = ${T.v(largest)}</code>؟ ${big ? YES : NO}`,
          { marks: { cmp: [r, largest] }, ptrs: P(), kind: 'cmp', q: { text: `هل الابن اليمين ${T.v(r)} أكبر من ${T.v(largest)}؟`, opts: ['أيوه أكبر', 'لأ'], ans: big ? 0 : 1 } });
        if (big) { largest = r; T.vars.largest = largest; T.snap('hrset', `<code>largest = right = ${r}</code>`, { marks: { big: [r] }, ptrs: P() }); }
      } else if (l < size) T.snap('hr', `<code>right = ${r}</code> مش أقل من <code>n = ${size}</code> → مفيش ابن يمين`, { ptrs: P() });
      if (largest !== i) {
        T.snap('hcheck', `<code>largest (${largest}) != i (${i})</code> → الابن ${T.v(largest)} أكبر من الأب ${T.v(i)}، لازم نبدّل`, { marks: { cmp: [i, largest] }, ptrs: P() });
        T.swap(i, largest);
        T.snap('hswap', `<code>swap(arr[${i}], arr[${largest}])</code> [[i:swap]] الكبير ${nb(T.v(i))} طلع لفوق`, { marks: { swap: [i, largest] }, kind: 'swap' });
        T.snap('hrec', `${T.v(largest)} نزل لـ index ${largest} — نكمل لتحت: <code>heapify(arr, ${size}, ${largest})</code> عشان نتأكد إن مفيش حاجة باظت تحته`);
        heapify(size, largest);
      } else {
        T.snap('hcheck', `<code>largest == i</code> → الأب ${nb(T.v(i))} أكبر من ولاده، كله تمام [[i:check]]`, { marks: { big: [i] } });
      }
      T.stack.pop();
    };
    T.snap('callBuild', `أول خطوة: نحوّل الـ array لـ <b>Max Heap</b> [[i:crown]] — بص على الشجرة: الأب في i وولاده في 2i+1 و 2i+2`);
    const start = Math.floor(n / 2) - 1;
    T.stack.push(`buildHeap(arr, ${n})`);
    T.vars = { n };
    T.snap('build', `<code>buildHeap</code>: نبدأ من آخر أب (non-leaf) = <code>n / 2 - 1 = ${start}</code> ونطلع لحد الـ root — الأوراق (من ${start + 1} لـ ${n - 1}) أصلاً heap لوحدها`);
    for (let i = start; i >= 0; i--) {
      T.vars = { n, i };
      T.snap('bloop', `i = ${i}: <code>heapify(arr, ${n}, ${i})</code> للعقدة ${nb(T.v(i))}`, { marks: { cur: [i] } });
      heapify(n, i);
    }
    T.stack.pop();
    T.log('Max Heap', 'الشجرة جاهزة [[i:crown]]');
    T.vars = { n };
    T.snap('callBuild', `الـ Max Heap جاهزة! [[i:crown]] ${la(T.vals())} — أكبر رقم ${nb(T.v(0))} قاعد في الـ root`, { marks: { big: [0] } });
    for (let i = n - 1; i > 0; i--) {
      T.vars = { n, i };
      T.snap('xloop', `i = ${i}: الـ root ${nb(T.v(0))} هو أكبر رقم — نبدّله مع آخر عنصر في الـ heap <code>arr[${i}] = ${T.v(i)}</code>`, { marks: { cmp: [0, i] } });
      T.swap(0, i); T.sorted.add(i); T.heap = i;
      T.snap('xswap', `<code>swap(arr[0], arr[${i}])</code> [[i:swap]] ${nb(T.v(i))} راح مكانه النهائي في index ${i} — الـ heap صغرت لـ ${i} عناصر`, { marks: { swap: [0, i] }, kind: 'swap' });
      T.snap('xheap', `الـ root الجديد ${nb(T.v(0))} ممكن يكون بايظ الـ heap → <code>heapify(arr, ${i}, 0)</code>`, { marks: { cur: [0] } });
      heapify(i, 0);
      T.log(`i = ${i}`, `${T.v(i)} اتثبت`);
    }
    T.sorted.add(0);
    return T.finish('Sorted array: ');
  }
};

function trace(id, arr, variant) {
  const r = TRACERS[id](arr.slice(), variant);
  return r;
}
