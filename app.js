// app.js - Offline USSD Helper (Lao primary / English secondary)

let packages = [];
let currentLang = localStorage.getItem('lang') || 'la';

// UI text in Lao and English (ensure prerequisite/noData keys exist)
const translations = {
  la: {
    title: "ຄັງແພັກເກັດ USSD ແບບອອບລາຍ",
    subtitle: "ຄົ້ນຫາແພັກເກັດ USSD ໄດ້ທຸກທີ່ໂດຍບໍ່ຕ້ອງໃຊ້ອິນເຕີເນັດ",
    searchPlaceholder: "ຄົ້ນຫາແພັກເກັດ/ຄຳສຳຄັນ",
    optAll: "ເບີທຸກປະເພດ",
    optMPhone: "ເບີຕັ້ງໂຕະ",
    optNetSim: "ເບີເນັດ",
    optGSM: "ເບີລາຍເດືອນ",
    clearBtn: "ລ້າງ",
    listTitle: "ລາຍການແພັກເກັດ",
    copy: "ຄັດລອກ",
    dial: "ໂທ",
    view: "ເບິ່ງ",
    price: "ລາຄາ",
    noData: "ບໍ່ມີແພັກເກັດ",
    helpTitle: "ເງື່ອນໄຂ ແລະ ວິທີໃນການໃຊ້",
    help1: "ເບີຂອງທ່ານຕ້ອງມີຄ່າໂທພຽງພໍກ່ອນສະໝັກແພັກເກັດ",
    help2: "ຫາກມີຄ່າໂທພຽງພໍ, ສາມາດຄົ້ນຫາແພັກເກັດຜ່ານຊ່ອງຄົ້ນຫາ ຫຼື ເລືອກຕາມປະເພດເບີ ຫຼື ຄົ້ນຫາຜ່ານຊ່ອງຄົ້ນຫາແລ້ວເລືອກປະເພດເບີເພື່ອໃຫ້ໄດ້ຜົນລັບທີ່ເຈາະຈົງກວ່າ",
    help3: "ເມື່ອພົບແພັກເກັດທີ່ຕ້ອງການແລ້ວ, ສາມາດກົດ ຄັດລອກ ແລ້ວວາງໃນແອັບໂທລະສັບ ຫຼື ກົດ ໂທ ເພື່ອສະໝັກທັນທີ",
    help4: "ສອບຖາມຂໍ້ມູນເພີ່ມເຕີມ ໂທ 101",
    footer: "ຕົວຢ່າງ · ອອບລາຍ"
  },
  en: {
    title: "Offline USSD Package Library",
    subtitle: "Access USSD packages anywhere — no internet needed",
    searchPlaceholder: "Search packages / keywords",
    optAll: "All number types",
    optMPhone: "M-Phone",
    optNetSim: "Net-Sim",
    optGSM: "GSM",
    clearBtn: "Clear",
    listTitle: "Package list",
    copy: "Copy",
    dial: "Dial",
    view: "View",
    price: "Price",
    noData: "No packages available.",
    helpTitle: "Conditions & How to Use",
    help1: "Your number types require sufficient balance before subscribing",
    help2: "Once balance is enough, you can search for packages using the search bar or filter by number type",
    help3: "When you find the package you want, tap Copy to paste into your phone dialer, or tap Dial to subscribe instantly, or use the search bar and choose the number type for more accurate results",
    help4: "Need help? Call 101",
    footer: "Demo · Offline-first"
  }
};

// helpers to apply language
function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(translations[lang] && translations[lang][key]) el.innerText = translations[lang][key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    if(translations[lang] && translations[lang][key]) el.placeholder = translations[lang][key];
  });

  document.querySelectorAll('[data-i18n-option]').forEach(opt=>{
    const key = opt.getAttribute('data-i18n-option');
    if(translations[lang] && translations[lang][key]) opt.innerText = translations[lang][key];
  });

  if(packages.length > 0) renderPackages(packages);
}

// UI references
const pkgListEl = document.getElementById('pkgList');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');

const detailModal = document.getElementById('detailModal');
const detailBody = document.getElementById('detailBody');
const closeDetailBtn = document.getElementById('closeDetail');

// small helpers for safe labels
const prereqLabel = () => (translations[currentLang] && translations[currentLang].prerequisite) ? translations[currentLang].prerequisite : (currentLang === 'la' ? 'ເງື່ອນໄຂ' : 'Prerequisite');
const noDataLabel = () => (translations[currentLang] && translations[currentLang].noData) ? translations[currentLang].noData : (currentLang === 'la' ? 'ບໍ່ມີແພັກ' : 'No data');

function copyText(text){
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=> alert(translations[currentLang].copy + ' ✓'));
  } else {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); alert(translations[currentLang].copy + ' ✓'); } catch(e){ alert('Copy failed') }
    ta.remove();
  }
}

function encodeForTel(code){
  return String(code).replace(/#/g, '%23');
}

function showDetail(pkg){
  const stepsHtml = (pkg.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
  const name = currentLang === 'la' ? (pkg.name_la || pkg.name_en) : (pkg.name_en || pkg.name_la);
  const desc = currentLang === 'la' ? (pkg.desc_la || pkg.desc_en) : (pkg.desc_en || pkg.desc_la);
  const prereqRaw = currentLang === 'la' ? (pkg.prereq_la || '') : (pkg.prereq_en || '');
  const prereqHtml = prereqRaw ? `<p><strong>${escapeHtml(prereqLabel())}:</strong> ${escapeHtml(prereqRaw)}</p>` : '';

  detailBody.innerHTML = `
    <h3>${escapeHtml(name)}</h3>
    <p>${escapeHtml(desc)}</p>
    ${prereqHtml}
    <h4>${escapeHtml(translations[currentLang] && translations[currentLang].view ? translations[currentLang].view : (currentLang==='la'?'ເບິ່ງ':'View'))} ${escapeHtml(prereqLabel())}</h4>
    <ol>${stepsHtml}</ol>
    <p class="hint">${escapeHtml(translations[currentLang] && translations[currentLang].help3 ? translations[currentLang].help3 : (currentLang==='la'?'ກົດຄັດລອກ ຫຼື ປຸ່ມໂທ':'Use copy or dial on package cards'))}</p>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button onclick="copyText('${String(pkg.code).replace(/'/g,"\\'")}')" class="small-btn">${escapeHtml(translations[currentLang] && translations[currentLang].copy ? translations[currentLang].copy : (currentLang==='la'?'ຄັດລອກ':'Copy'))}</button>
      <a href="tel:${encodeForTel(pkg.code)}"><button class="small-btn">${escapeHtml(translations[currentLang] && translations[currentLang].dial ? translations[currentLang].dial : (currentLang==='la'?'ໂທ':'Dial'))}</button></a>
    </div>
  `;
  detailModal.classList.remove('hidden');
}
closeDetailBtn?.addEventListener('click', ()=>{ detailModal.classList.add('hidden'); });

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// renderPackages: show prereq paragraph only if prereq exists (non-empty)
function renderPackages(list){
  if(!list || list.length === 0){
    pkgListEl.innerHTML = `<p>${escapeHtml(noDataLabel())}</p>`;
    return;
  }
  pkgListEl.innerHTML = '';
  list.forEach(pkg=>{
    const name = currentLang === 'la' ? (pkg.name_la || pkg.name_en) : (pkg.name_en || pkg.name_la);
    const desc = currentLang === 'la' ? (pkg.desc_la || pkg.desc_en) : (pkg.desc_en || pkg.desc_la);
    const prereqRaw = currentLang === 'la' ? (pkg.prereq_la || '') : (pkg.prereq_en || '');

      let metaHtml = `<h3>${escapeHtml(name)}</h3>
      <p>${escapeHtml(desc)}</p>
      <p><strong>${escapeHtml(translations[currentLang] && translations[currentLang].price ? translations[currentLang].price : (currentLang==='la'?'ລາຄາ':'Price'))}:</strong> ${pkg.price ? (Number(pkg.price).toLocaleString()) + ' LAK' : '-'}</p>
      <p><strong>USSD:</strong> <code class="code">${escapeHtml(pkg.code)}</code></p>`;

    if (prereqRaw) {
      metaHtml += `<p><em>${escapeHtml(prereqLabel())}:</em> ${escapeHtml(prereqRaw)}</p>`;
    }

    const card = document.createElement('div'); card.className = 'pkg-card';
    const meta = document.createElement('div'); meta.className = 'pkg-meta';
    meta.innerHTML = metaHtml;

    const ops = document.createElement('div'); ops.className = 'ops';
    const copyBtn = document.createElement('button'); copyBtn.className = 'small-btn'; copyBtn.textContent = translations[currentLang] && translations[currentLang].copy ? translations[currentLang].copy : (currentLang==='la'?'ຄັດລອກ':'Copy');
    copyBtn.onclick = ()=> copyText(pkg.code);

    const dialLink = document.createElement('a'); dialLink.href = `tel:${encodeForTel(pkg.code)}`;
    const dialBtn = document.createElement('button'); dialBtn.className = 'small-btn'; dialBtn.textContent = translations[currentLang] && translations[currentLang].dial ? translations[currentLang].dial : (currentLang==='la'?'ໂທ':'Dial');
    dialLink.appendChild(dialBtn);

    const detailBtn = document.createElement('button'); detailBtn.className = 'small-btn'; detailBtn.textContent = translations[currentLang] && translations[currentLang].view ? translations[currentLang].view : (currentLang==='la'?'ເບິ່ງ':'View');
    detailBtn.onclick = ()=> showDetail(pkg);

    ops.appendChild(copyBtn); ops.appendChild(dialLink); ops.appendChild(detailBtn);

    card.appendChild(meta);
    card.appendChild(ops);
    pkgListEl.appendChild(card);
  });
}

function filterPackages(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const catRaw = (categorySelect.value || '').trim();
  const cat = catRaw ? catRaw.toLowerCase() : ''; // normalize selection to lowercase

  const filtered = packages.filter(p=>{
    // build searchable text
    const nameAndDesc = ((p.name_en || '') + ' ' + (p.name_la || '') + ' ' + (p.desc_en || '') + ' ' + (p.desc_la || '')).toLowerCase();
    const tagsText = (p.tags || []).join(' ').toLowerCase();
    const text = (nameAndDesc + ' ' + tagsText);

    const matchQ = !q || text.includes(q);

    // --- normalize package categories (support: string, array, "categories" field) ---
    let pkgCats = [];
    if (Array.isArray(p.category)) {
      pkgCats = p.category.slice();
    } else if (Array.isArray(p.categories)) {
      pkgCats = p.categories.slice();
    } else if (typeof p.category === 'string' && p.category.length) {
      pkgCats = [p.category];
    } else if (typeof p.categories === 'string' && p.categories.length) {
      pkgCats = [p.categories];
    }

    pkgCats = pkgCats.map(x => String(x || '').trim().toLowerCase()).filter(Boolean);

    let matchCat = true;
    if (cat) {
      // require include
      matchCat = pkgCats.includes(cat);
    }

    return matchQ && matchCat;
  });

  renderPackages(filtered);
}

document.getElementById('clearFilter').addEventListener('click', ()=>{
  searchInput.value=''; categorySelect.value='';
  filterPackages();
});
searchInput.addEventListener('input', filterPackages);
categorySelect.addEventListener('change', filterPackages);

// load packages
fetch('packages.json')
.then(r=>r.json())
.then(data=>{
  packages = data;
  const saved = localStorage.getItem('lang') || currentLang;
  const langSelect = document.getElementById('langSelect');
  if(langSelect) langSelect.value = saved;
  applyLanguage(saved);
  renderPackages(packages);
})
.catch(err=>{
  console.error('load packages.json failed', err);
  pkgListEl.innerHTML = `<p>${escapeHtml(noDataLabel())}</p>`;
});

// language switcher
const langEl = document.getElementById('langSelect');
if (langEl) {
  langEl.addEventListener('change', (e)=>{
    applyLanguage(e.target.value);
  });
}

// register simple service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(()=> console.log('sw registered')).catch(()=> console.log('sw failed'));
}