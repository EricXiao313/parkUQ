const app = document.getElementById('app');

// Illustrative parking scenarios, not verified facilities or live local data.
const parkingData = [
  { id:'shops', name:'Local shops · short stay', location:'Hawken Drive area · illustrative option', price:3, priceText:'$3 / hour', limit:2, limitText:'2 hours max', distance:3, available:12, status:'green', color:'green', payment:'Card / meter (sample)', hours:'7:00 AM – 7:00 PM (sample)', notes:'Example for shopping and errands; check signs in a real visit.', x:33, y:27 },
  { id:'neighbourhood', name:'Neighbourhood · visitor parking', location:'St Lucia residential area · illustrative option', price:0, priceText:'Free', limit:2, limitText:'2 hours max', distance:8, available:5, status:'orange', color:'blue', payment:'Free (sample)', hours:'Daytime (sample)', notes:'Example for visiting friends; actual permit rules are not verified.', x:24, y:58 },
  { id:'recreation', name:'Recreation · longer stay', location:'St Lucia recreation area · illustrative option', price:0, priceText:'Free', limit:4, limitText:'4 hours max', distance:12, available:24, status:'green', color:'purple', payment:'Free (sample)', hours:'Daytime (sample)', notes:'Example for leisure visits; no real facility or availability is implied.', x:72, y:73 },
  { id:'services', name:'Local services · short visit', location:'St Lucia local services area · illustrative option', price:2, priceText:'$2 / hour', limit:1, limitText:'1 hour max', distance:7, available:3, status:'red', color:'blue', payment:'Card / meter (sample)', hours:'8:00 AM – 6:00 PM (sample)', notes:'Example for appointments and quick visits.', x:63, y:31 },
  { id:'work', name:'Workday · longer stay', location:'St Lucia neighbourhood centre · illustrative option', price:5, priceText:'$5 / hour', limit:8, limitText:'8 hours max', distance:15, available:18, status:'green', color:'purple', payment:'Card (sample)', hours:'7:00 AM – 7:00 PM (sample)', notes:'Example for local workers comparing price with walking distance.', x:83, y:45 }
];

const state = {
  page: 'home',
  destination: 'Hawken Drive shops',
  selected: parkingData[0].id,
  view: 'map',
  mapMode: 'map',
  filters: { cheap:false, long:false, near:false, available:false },
  settings: JSON.parse(localStorage.getItem('park-st-lucia-settings') || 'null') || {
    sort:'available', maxPrice:'any', minLimit:'any', onlyAvailable:true, includeFree:true
  }
};

function navMarkup(){
  const t = document.getElementById('nav-template');
  return t.innerHTML + '<div class="prototype-banner">Community prototype · All parking details and walking times are illustrative, not live. Map not to scale.</div>';
}

function mount(page){
  state.page = page;
  window.scrollTo(0,0);
  const views = {home:renderHome, map:renderMap, detail:renderDetail, settings:renderSettings, dashboard:renderDashboard, about:renderAbout};
  (views[page] || renderHome)();
}

function wireNav(){
  document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => mount(btn.dataset.nav)));
  const menu = document.querySelector('.mobile-menu');
  if (menu) menu.addEventListener('click', () => {
    const opened = document.querySelector('.nav-links').classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(opened));
  });
}

function renderHome(){
  app.innerHTML = `
    <div class="home-page">
      ${navMarkup()}
      <main class="hero">
        <section class="hero-copy">
          <h1>Find parking.<br>Explore St Lucia.</h1>
          <p>Parking for everyday life in St Lucia. Compare options for shopping, work, visiting friends and time outdoors.</p>
          <form class="search-box" id="home-search">
            <span class="icon">⌖</span>
            <input id="home-destination" value="${escapeHtml(state.destination)}" placeholder="Enter your destination (e.g. Hawken Drive shops)" aria-label="Destination" />
            <button class="primary-btn" type="submit">Search</button>
          </form>
          <div class="feature-row">
            <div class="feature"><div class="feature-icon">P</div><b>See availability</b><small>Sample availability</small></div>
            <div class="feature"><div class="feature-icon">$</div><b>Compare prices</b><small>Free and paid options</small></div>
            <div class="feature"><div class="feature-icon">◷</div><b>Check time limits</b><small>Avoid unsuitable spaces</small></div>
            <div class="feature"><div class="feature-icon">↟</div><b>Walking distance</b><small>Choose what works for you</small></div>
          </div>
        </section>
        <aside class="hero-visual" aria-label="Parking availability preview">
          <div class="hero-map-ring"></div>
          <div class="hero-pin p1"><span>P</span></div>
          <div class="hero-pin p2"><span>P</span></div>
          <div class="hero-pin p3"><span>P</span></div>
          <div class="hero-pin p4"><span>P</span></div>
          <div class="hero-status"><strong>Explore local parking options</strong><span>Shops, neighbourhood visits and recreation</span></div>
        </aside>
      </main>
    </div>`;
  wireNav();
  document.getElementById('home-search').addEventListener('submit', e => {
    e.preventDefault();
    state.destination = document.getElementById('home-destination').value.trim() || 'Hawken Drive shops';
    mount('map');
  });
}

function getFilteredParking(){
  let rows = [...parkingData];
  const f = state.filters;
  if (f.cheap) rows = rows.filter(p => p.price <= 3);
  if (f.long) rows = rows.filter(p => p.limit >= 3);
  if (f.near) rows = rows.filter(p => p.distance <= 8);
  if (f.available) rows = rows.filter(p => p.available >= 5);
  if (state.settings.onlyAvailable) rows = rows.filter(p => p.available > 0);
  if (!state.settings.includeFree) rows = rows.filter(p => p.price > 0);
  if (state.settings.maxPrice !== 'any') rows = rows.filter(p => p.price <= Number(state.settings.maxPrice));
  if (state.settings.minLimit !== 'any') rows = rows.filter(p => p.limit >= Number(state.settings.minLimit));
  const sort = state.settings.sort;
  if (sort === 'cheap') rows.sort((a,b)=>a.price-b.price || a.distance-b.distance);
  if (sort === 'close') rows.sort((a,b)=>a.distance-b.distance);
  if (sort === 'available') rows.sort((a,b)=>b.available-a.available);
  return rows;
}

function parkingCard(p){
  return `<article class="parking-card ${state.selected===p.id?'selected':''}" data-id="${p.id}">
    <div class="parking-card-head">
      <div class="p-icon p-${p.color}">P</div>
      <div class="parking-title"><h3>${p.name}</h3><p>${p.priceText}<br>${p.limitText} · ${p.distance} min walk</p></div>
      <div class="availability"><span class="dot ${p.status}"></span>${p.available}+ spaces</div>
    </div>
    <div class="card-actions"><button class="link-btn" data-mapfocus="${p.id}">Show on map</button><button class="link-btn" data-detail="${p.id}">Details →</button></div>
  </article>`;
}

function mapSvg(rows){
  const pins = rows.map(p => {
    const fill = p.color==='green' ? '#2da562' : p.color==='purple' ? '#7657d4' : p.status==='red' ? '#d84f43' : '#2767c7';
    return `<g class="map-pin" data-pin="${p.id}" transform="translate(${p.x*10},${p.y*7.2})">
      <path d="M0,-22 C-16,-22 -24,-10 -24,4 C-24,20 0,36 0,36 C0,36 24,20 24,4 C24,-10 16,-22 0,-22Z" fill="${fill}" stroke="white" stroke-width="3"/>
      <text x="0" y="8" text-anchor="middle" fill="white" font-size="19" font-weight="800">P</text>
    </g>`;
  }).join('');
  return `<svg class="map-svg" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Schematic St Lucia parking map — illustrative positions only">
    <rect width="1000" height="720" fill="#e7efe9"/>
    <path d="M700 -50 C600 110 640 250 805 360 C900 425 885 590 1050 760" fill="none" stroke="#b9d7e8" stroke-width="95" opacity=".8"/>
    <path d="M-80 180 C180 240 310 175 555 290 C710 365 735 515 1040 565" fill="none" stroke="#ffffff" stroke-width="20"/>
    <path d="M60 -20 C170 170 230 260 395 360 C550 455 675 520 820 770" fill="none" stroke="#ffffff" stroke-width="17"/>
    <path d="M-20 580 C240 500 360 535 510 625 C610 685 760 630 1000 640" fill="none" stroke="#ffffff" stroke-width="15"/>
    <path d="M80 70 L325 690 M250 20 L490 710 M450 20 L680 705" stroke="#d0dbd5" stroke-width="6" opacity=".9"/>
    <path d="M0 320 L610 80 M80 680 L870 120 M280 720 L930 245" stroke="#d0dbd5" stroke-width="5" opacity=".8"/>
    <path d="M535 165 C660 140 785 185 835 290 C874 370 827 455 735 485 C620 522 520 460 500 360 C483 280 492 210 535 165Z" fill="#d6eadb"/>
    <text x="605" y="348" class="map-label" font-size="22">St Lucia neighbourhoods</text>
    <text x="175" y="380" class="map-label" font-size="24">St Lucia</text>
    <g transform="translate(580 285)"><rect class="destination-label" x="-150" y="-24" width="300" height="42" rx="12"/><text x="0" y="4" text-anchor="middle" font-size="15" font-weight="700" fill="#283931">${escapeHtml(state.destination.length > 30 ? state.destination.slice(0,27) + "…" : state.destination)}</text></g>
    ${pins}
  </svg>`;
}

function renderMap(){
  const rows = getFilteredParking();
  app.innerHTML = `<div class="page">${navMarkup()}<main class="map-shell">
    <section class="results-panel">
      <div class="results-search">
        <div class="search-input"><span class="left-icon">⌕</span><input id="map-search" value="${escapeHtml(state.destination)}" aria-label="Search destination"><button class="clear" id="clear-search">×</button></div>
        <button class="square-btn" id="apply-search">⌕</button>
      </div>
      <p class="results-note">Sample options for ${escapeHtml(state.destination)}. Search changes the destination label; routes and distances are not calculated.</p>
      <div class="filters">
        <button class="filter-chip ${state.filters.cheap?'active':''}" data-filter="cheap">Price ≤ $3</button>
        <button class="filter-chip ${state.filters.long?'active':''}" data-filter="long">3h+ limit</button>
        <button class="filter-chip ${state.filters.near?'active':''}" data-filter="near">≤ 8 min walk</button>
        <button class="filter-chip ${state.filters.available?'active':''}" data-filter="available">5+ spaces</button>
      </div>
      <div class="view-toggle"><button class="${state.view==='map'?'active':''}" data-view="map">Map View</button><button class="${state.view==='list'?'active':''}" data-view="list">List View</button></div>
      <div class="parking-list">${rows.length ? rows.map(parkingCard).join('') : '<div class="panel">No parking options match these filters.</div>'}</div>
    </section>
    <section class="map-stage" ${state.view==='list'?'style="background:#f5f8f6"':''}>
      ${state.view==='map' ? `${mapSvg(rows)}
        <div class="map-controls"><button class="${state.mapMode==='map'?'active':''}" data-mapmode="map">Map</button><button class="${state.mapMode==='satellite'?'active':''}" data-mapmode="satellite">Satellite</button></div>
        <div class="map-legend"><div class="legend-row"><span class="dot green"></span>Many spaces</div><div class="legend-row"><span class="dot orange"></span>Some spaces</div><div class="legend-row"><span class="dot red"></span>Few spaces</div></div>
        <div class="map-zoom"><button id="zoom-in">+</button><button id="zoom-out">−</button></div>` : renderListTable(rows)}
    </section>
  </main></div>`;
  wireNav();
  wireMapInteractions();
}

function renderListTable(rows){
  return `<div class="container" style="max-width:none;padding:26px;overflow:auto"><div class="panel"><h2 style="margin-top:0">Parking options near ${escapeHtml(state.destination)}</h2><table style="width:100%;border-collapse:collapse;min-width:720px"><thead><tr>${['Name','Price','Time limit','Walk','Availability'].map(x=>`<th style="text-align:left;padding:13px;border-bottom:1px solid #dfe7e3;color:#68766f;font-size:12px">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(p=>`<tr data-detail="${p.id}" style="cursor:pointer"><td style="padding:16px 13px;border-bottom:1px solid #edf1ef;font-weight:700">${p.name}</td><td style="padding:16px 13px;border-bottom:1px solid #edf1ef">${p.priceText}</td><td style="padding:16px 13px;border-bottom:1px solid #edf1ef">${p.limitText}</td><td style="padding:16px 13px;border-bottom:1px solid #edf1ef">${p.distance} min</td><td style="padding:16px 13px;border-bottom:1px solid #edf1ef"><span class="dot ${p.status}"></span> ${p.available}+ spaces</td></tr>`).join('')}</tbody></table></div></div>`;
}

function wireMapInteractions(){
  const searchInput = document.getElementById('map-search');
  document.getElementById('apply-search').addEventListener('click', ()=>{ state.destination = searchInput.value.trim() || 'Hawken Drive shops'; renderMap(); });
  searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ state.destination=searchInput.value.trim() || 'Hawken Drive shops'; renderMap(); }});
  document.getElementById('clear-search').addEventListener('click', ()=>{ searchInput.value=''; searchInput.focus(); });
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', ()=>{ state.filters[b.dataset.filter]=!state.filters[b.dataset.filter]; renderMap(); }));
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', ()=>{ state.view=b.dataset.view; renderMap(); }));
  document.querySelectorAll('[data-detail]').forEach(b => b.addEventListener('click', ()=>{ state.selected=b.dataset.detail; mount('detail'); }));
  document.querySelectorAll('[data-mapfocus], [data-pin]').forEach(b => b.addEventListener('click', ()=>{ state.selected=b.dataset.mapfocus || b.dataset.pin; showToast(`${parkingData.find(p=>p.id===state.selected).name} selected`); renderMap(); }));
  document.querySelectorAll('[data-mapmode]').forEach(b => b.addEventListener('click', ()=>{ state.mapMode=b.dataset.mapmode; showToast(state.mapMode==='satellite'?'Satellite view simulated for prototype':'Map view'); }));
  const zIn=document.getElementById('zoom-in'), zOut=document.getElementById('zoom-out');
  if(zIn) zIn.addEventListener('click',()=>showToast('Zoom in — prototype interaction'));
  if(zOut) zOut.addEventListener('click',()=>showToast('Zoom out — prototype interaction'));
}

function renderDetail(){
  const p = parkingData.find(x=>x.id===state.selected) || parkingData[0];
  app.innerHTML = `<div class="page">${navMarkup()}<main class="container">
    <button class="back-link" id="back-results">← Back to results</button>
    <section class="detail-grid">
      <div class="parking-photo" aria-label="Stylised parking photo placeholder"></div>
      <div class="detail-copy">
        <div style="display:flex;align-items:center;gap:14px"><div class="p-icon p-${p.color}" style="width:48px;height:48px">P</div><div><h1>${p.name}</h1><div class="detail-location">${p.location}</div></div></div>
        <div class="availability" style="font-size:14px;margin-top:8px"><span class="dot ${p.status}"></span>${p.available}+ spaces currently shown</div>
        <div class="detail-stats">
          <div class="stat-box"><small>Price</small><strong>${p.priceText}</strong></div>
          <div class="stat-box"><small>Time limit</small><strong>${p.limitText}</strong></div>
          <div class="stat-box"><small>Walk</small><strong>${p.distance} min</strong></div>
          <div class="stat-box"><small>Data</small><strong>Sample data</strong></div>
        </div>
        <div class="detail-actions"><button class="primary-btn" id="directions">Get Directions</button><button class="secondary-btn" id="view-map">View on Map</button></div>
        <div class="info-table">
          <div class="info-row"><span>Operating hours</span><strong>${p.hours}</strong></div>
          <div class="info-row"><span>Payment method</span><strong>${p.payment}</strong></div>
          <div class="info-row"><span>Notes</span><strong>${p.notes}</strong></div>
          <div class="info-row"><span>Data source</span><strong>Prototype data — live integration not connected</strong></div>
        </div>
      </div>
    </section>
  </main></div>`;
  wireNav();
  document.getElementById('back-results').addEventListener('click', ()=>mount('map'));
  document.getElementById('view-map').addEventListener('click', ()=>{state.view='map'; mount('map');});
  document.getElementById('directions').addEventListener('click', ()=>showToast(`Directions to ${p.name} would open here.`));
}

function renderSettings(){
  const s=state.settings;
  app.innerHTML = `<div class="page">${navMarkup()}<main class="container narrow">
    <h1 class="section-title">Preferences</h1><p class="section-subtitle">Customise how Park St Lucia ranks and displays parking options.</p>
    <section class="panel">
      <div class="form-group"><label>Sort by</label><div class="radio-row">
        ${[['cheap','Cheapest'],['close','Closest'],['available','Most available']].map(([v,l])=>`<label><input type="radio" name="sort" value="${v}" ${s.sort===v?'checked':''}> ${l}</label>`).join('')}
      </div></div>
      <div class="form-group"><label for="max-price">Maximum price</label><select class="select-field" id="max-price"><option value="any">Any price</option><option value="0">Free only</option><option value="3">$3 / hour</option><option value="5">$5 / hour</option></select></div>
      <div class="form-group"><label for="min-limit">Minimum time limit</label><select class="select-field" id="min-limit"><option value="any">Any</option><option value="2">2+ hours</option><option value="3">3+ hours</option><option value="4">4+ hours</option></select></div>
      <div class="switch-row"><span><strong>Show only available spaces</strong><br><small style="color:var(--muted)">Hide options with no reported spaces</small></span><button class="switch ${s.onlyAvailable?'on':''}" data-switch="onlyAvailable" aria-label="Toggle available spaces"></button></div>
      <div class="switch-row"><span><strong>Include free parking</strong><br><small style="color:var(--muted)">Include illustrative free local options</small></span><button class="switch ${s.includeFree?'on':''}" data-switch="includeFree" aria-label="Toggle free parking"></button></div>
      <button class="primary-btn full-btn" id="save-settings">Save Preferences</button><div class="success-note" id="settings-success">Preferences saved. Your results will now use these settings.</div>
    </section>
  </main></div>`;
  wireNav();
  document.getElementById('max-price').value=s.maxPrice;
  document.getElementById('min-limit').value=s.minLimit;
  document.querySelectorAll('[data-switch]').forEach(b=>b.addEventListener('click',()=>{ state.settings[b.dataset.switch]=!state.settings[b.dataset.switch]; b.classList.toggle('on'); }));
  document.getElementById('save-settings').addEventListener('click',()=>{
    state.settings.sort=document.querySelector('input[name="sort"]:checked').value;
    state.settings.maxPrice=document.getElementById('max-price').value;
    state.settings.minLimit=document.getElementById('min-limit').value;
    localStorage.setItem('park-st-lucia-settings', JSON.stringify(state.settings));
    document.getElementById('settings-success').classList.add('show');
  });
}

function renderDashboard(){
  app.innerHTML = `<div class="page">${navMarkup()}<main class="container">
    <h1 class="section-title">Your Dashboard</h1><p class="section-subtitle">Try a local destination or revisit your parking preferences.</p>
    <div class="dashboard-grid">
      <section class="dashboard-card"><h2>Explore St Lucia</h2><div class="row-list">
        ${[['Hawken Drive shops','Shopping'],['St Lucia neighbourhood visit','Visiting friends'],['Local recreation','Time outdoors']].map(([n,t])=>`<div class="row-item"><div class="row-main"><div class="row-icon">⌕</div><div><strong>${n}</strong><br><small>${t}</small></div></div><button class="link-btn recent-search" data-place="${n}">Explore →</button></div>`).join('')}
      </div></section>
      <section class="dashboard-card dashboard-highlight"><div><h2>Local parking example</h2><p>Compare a sample short-stay option near local shops. Adjust your preferences to explore other options.</p></div><div class="metric">12+ <span>sample spaces</span></div><button class="primary-btn" style="background:white;color:var(--green-900);width:max-content" id="dash-open">View parking</button></section>
      <section class="dashboard-card"><h2>Example saved places</h2><div class="row-list"><div class="row-item"><div class="row-main"><div class="row-icon">★</div><strong>Home (St Lucia)</strong></div><span>›</span></div><div class="row-item"><div class="row-main"><div class="row-icon">★</div><strong>Local shops</strong></div><span>›</span></div></div></section>
      <section class="dashboard-card"><h2>Prototype note</h2><p style="color:var(--muted);line-height:1.7">Availability numbers in this website are simulated to demonstrate the interaction. A working service would need verified data from the council and local parking providers.</p></section>
    </div>
  </main></div>`;
  wireNav();
  document.querySelectorAll('.recent-search').forEach(b=>b.addEventListener('click',()=>{state.destination=b.dataset.place;mount('map');}));
  document.getElementById('dash-open').addEventListener('click',()=>{state.selected='shops';mount('detail');});
}

function renderAbout(){
  app.innerHTML = `<div class="page">${navMarkup()}<main class="container">
    <h1 class="section-title">About the prototype</h1><p class="section-subtitle">A community parking concept for people who live, work, shop and visit in St Lucia.</p>
    <div class="about-grid">
      <section class="about-card"><h3>What problem does it address?</h3><p>Drivers can face difficulty finding parking that is available, affordable, close enough and valid for the length of their visit. Existing tools often focus on payment, permits or restrictions rather than combining these decisions in one place.</p></section>
      <section class="about-card"><h3>Core design idea</h3><ul><li>Search by destination</li><li>Compare availability, price, time limit and walking distance</li><li>Filter or rank options by personal preferences</li><li>Compare options for short visits and longer stays</li></ul></section>
      <section class="about-card"><h3>Prototype limitations</h3><p>This is an interactive demonstration, not a live parking service. Availability, prices and operating details are sample values used to test the user flow.</p></section>
      <section class="about-card"><h3>Who is it for?</h3><p>St Lucia residents, local workers, shoppers and visitors. The concept supports everyday trips across the suburb, from visiting friends to local errands and recreation.</p></section>
    </div>
  </main></div>`;
  wireNav();
}

function showToast(text){
  let toast=document.querySelector('.toast');
  if(!toast){ toast=document.createElement('div'); toast.className='toast'; document.body.appendChild(toast); }
  toast.textContent=text; toast.classList.add('show');
  clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);
}
function escapeHtml(str=''){ return String(str).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

mount('home');
