// MacroData maps and numbers, built at site build time.
// Hero map: the workshop sites (macrodataEvents.json).
// Participants page: city-level counts per workshop (macrodataParticipants.json).
// Nothing here needs editing. Change the JSON files in MacroData > Data and settings.
const events = require('./macrodataEvents.json').events || [];
const participants = require('./macrodataParticipants.json');
const geo = require('./macrodataGeo.json');

const GREEN = '#2f7a5c';
const AMBER = '#e0a82e';
const INK = '#2b3a32';
const MUTED = '#5f7167';
const PALETTE = ['#2f7a5c', '#d99a1c', '#3a8eb5', '#8a5fb0', '#c4556b'];

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => Number(n).toFixed(1);

function project(S, x0, y0) {
  return (lat, lng) => [(lng - x0) * S, (y0 - lat) * S];
}
function path(rings, proj) {
  return rings.map((r) => 'M' + r.map(([lng, lat]) => proj(lat, lng).map(num).join(',')).join(' L') + 'Z').join(' ');
}
function haversine(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function mixWhite(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- hero map
function heroMap(v) {
  const phone = v === 'm';
  const S = 34, wDeg = phone ? 24 : 32, x0 = phone ? -84.2 : -90, y0 = 13.8;
  const W = Math.round(wDeg * S), H = Math.round(20.6 * S);
  const r = 58, F = phone ? 1.3 : 1;
  const P = project(S, x0, y0);
  const id = (s) => `mdh${v}-${s}`;

  // Photo circles: west sites on the left, the rest on the right, stacked by latitude
  const sites = events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number').map((e) => ({ e, p: P(e.lat, e.lng) }));
  const gap = 2 * r + 105 * F;
  const left = phone ? 112 : 136, right = phone ? W - 116 : W - 156;
  const place = (group, cx) => {
    group.sort((a, b) => a.p[1] - b.p[1]);
    let last = -Infinity;
    group.forEach((s) => { s.cy = Math.max(s.p[1], last + gap, r + 10); last = s.cy; });
    const over = last - (H - r - 70 * F);
    if (over > 0) group.forEach((s) => { s.cy -= over; });
    group.forEach((s) => { s.cx = cx; });
  };
  place(sites.filter((s) => s.e.lng < -75.5), left);
  place(sites.filter((s) => s.e.lng >= -75.5), right);

  let grid = '';
  for (let lat = -5; lat <= 15; lat += 5) { const y = P(lat, 0)[1]; grid += `<line x1="0" x2="${W}" y1="${num(y)}" y2="${num(y)}"/>`; }
  for (let lng = -85; lng <= -55; lng += 5) { const x = P(0, lng)[0]; grid += `<line y1="0" y2="${H}" x1="${num(x)}" x2="${num(x)}"/>`; }

  let defs = `<radialGradient id="${id('f')}" cx=".5" cy=".5" r=".62"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${id('m')}"><rect width="${W}" height="${H}" fill="url(#${id('f')})"/></mask>` +
    `<linearGradient id="${id('g')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#74c29c"/><stop offset="1" stop-color="#2f7a5c"/></linearGradient>` +
    `<filter id="${id('s')}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#1f503c" flood-opacity=".35"/></filter>` +
    `<filter id="${id('p')}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#1f3a30" flood-opacity=".3"/></filter>`;
  let out = '';
  sites.forEach((s, i) => {
    const e = s.e, upcoming = e.status !== 'completado';
    const col = upcoming ? AMBER : GREEN;
    const [x, y] = s.p;
    const dx = s.cx - x, dy = s.cy - y, len = Math.hypot(dx, dy) || 1;
    const ex = s.cx - (dx / len) * r, ey = s.cy - (dy / len) * r;
    defs += `<clipPath id="${id('c' + i)}"><circle cx="${num(s.cx)}" cy="${num(s.cy)}" r="${r}"/></clipPath>`;
    out += `<line x1="${num(x)}" y1="${num(y)}" x2="${num(ex)}" y2="${num(ey)}" stroke="${col}" stroke-width="2" ${upcoming ? 'stroke-dasharray="6 5"' : ''}/>`;
    out += `<circle class="md-pulse" cx="${num(x)}" cy="${num(y)}" r="9" fill="none" stroke="${col}" stroke-width="2"/><circle cx="${num(x)}" cy="${num(y)}" r="8" fill="${col}" stroke="#fff" stroke-width="3"/>`;
    if (e.photo) {
      out += `<g filter="url(#${id('p')})"><circle cx="${num(s.cx)}" cy="${num(s.cy)}" r="${r + 4}" fill="#fff"/></g>` +
        `<image href="${esc(e.photo)}" x="${num(s.cx - r)}" y="${num(s.cy - r)}" width="${2 * r}" height="${2 * r}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id('c' + i)})"/>`;
    } else {
      out += `<circle cx="${num(s.cx)}" cy="${num(s.cy)}" r="${r}" fill="#fff8e4" stroke="${AMBER}" stroke-width="2.5" stroke-dasharray="6 5"/>` +
        `<text x="${num(s.cx)}" y="${num(s.cy + 6)}" text-anchor="middle" font-size="${18 * F}" font-weight="700" fill="#7a5600">Pronto</text>`;
    }
    const ty = s.cy + r + 22 + 5 * F;
    out += `<text x="${num(s.cx)}" y="${num(ty)}" text-anchor="middle" font-size="${26 * F}" font-weight="700" fill="${INK}">${esc(e.city)}</text>`;
    if (e.region) out += `<text x="${num(s.cx)}" y="${num(ty + 21 * F)}" text-anchor="middle" font-size="${16 * F}" font-weight="700" fill="${GREEN}">${esc(e.region)}</text>`;
    out += `<text x="${num(s.cx)}" y="${num(ty + (e.region ? 40 : 21) * F)}" text-anchor="middle" font-size="${16 * F}" fill="${MUTED}">${esc(e.dates)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de Colombia con las sedes de los talleres"><defs>${defs}</defs>` +
    `<g mask="url(#${id('m')})"><path d="${path(geo.neighbors, P)}" fill="rgba(43,58,50,.05)" stroke="rgba(43,58,50,.16)" stroke-width="1"/></g>` +
    `<path d="${path(geo.colombia, P)}" fill="url(#${id('g')})" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" filter="url(#${id('s')})"/>` +
    out + '</svg>';
}

// ------------------------------------------------------- participants data
const rows = (participants.rows || []).filter((r) => r.students > 0 && typeof r.lat === 'number' && typeof r.lng === 'number');
const byEvent = events.map((e, i) => ({ e, color: PALETTE[i % PALETTE.length], rows: rows.filter((r) => r.workshop === e.name) })).filter((g) => g.rows.length);
const total = rows.reduce((a, r) => a + r.students, 0);
const eventOf = (name) => events.find((e) => e.name === name);
const dist = (r) => { const e = eventOf(r.workshop); return e && r.city !== e.city ? haversine([r.lat, r.lng], [e.lat, e.lng]) : 0; };
const expanded = [];
rows.forEach((r) => { for (let i = 0; i < r.students; i++) expanded.push(dist(r)); });
const travelers = expanded.filter((d) => d > 0).sort((a, b) => a - b);
const median = travelers.length ? (travelers.length % 2 ? travelers[(travelers.length - 1) / 2] : (travelers[travelers.length / 2 - 1] + travelers[travelers.length / 2]) / 2) : 0;
const cityTotals = {};
rows.forEach((r) => { cityTotals[r.city] = (cityTotals[r.city] || 0) + r.students; });

const stats = {
  students: total,
  workshops: byEvent.length,
  cities: Object.keys(cityTotals).length,
  travelPct: total ? Math.round((100 * travelers.length) / total) : 0,
  medianKm: Math.round(median),
};
const bins = [
  { label: 'Misma ciudad', test: (d) => d === 0 },
  { label: 'Hasta 250 km', test: (d) => d > 0 && d <= 250 },
  { label: '250 a 500 km', test: (d) => d > 250 && d <= 500 },
  { label: 'Más de 500 km', test: (d) => d > 500 },
].map((b) => { const n = expanded.filter(b.test).length; return { label: b.label, n, pct: total ? Math.round((100 * n) / total) : 0 }; });
const cities = Object.entries(cityTotals).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([city, students]) => ({ city, students }));

const mix = byEvent.map((g) => {
  const n = g.rows.reduce((a, r) => a + r.students, 0);
  const sorted = g.rows.slice().sort((a, b) => (b.city === g.e.city) - (a.city === g.e.city) || b.students - a.students);
  const segs = sorted.map((r, i) => {
    const local = r.city === g.e.city;
    return { city: r.city, students: r.students, pct: (100 * r.students) / n, color: local ? '#2f6b52' : mixWhite(g.color, Math.min(0.12 + i * 0.12, 0.8)), showName: (100 * r.students) / n > 16, showNum: (100 * r.students) / n > 5 };
  });
  const trav = g.rows.filter((r) => r.city !== g.e.city).reduce((a, r) => a + r.students, 0);
  return { name: g.e.name, city: g.e.city, students: n, travelPct: Math.round((100 * trav) / n), segs };
});

// ------------------------------------------------------------ movement map
function flowMap() {
  const S = 42, x0 = -80.2, y0 = 13, W = Math.round(15.2 * S), H = Math.round(16.6 * S);
  const P = project(S, x0, y0);
  let grid = '';
  for (let lat = -4; lat <= 13; lat += 4) { const y = P(lat, 0)[1]; grid += `<line x1="0" x2="${W}" y1="${num(y)}" y2="${num(y)}"/>`; }
  let arcs = '', dots = '';
  const labels = [];
  byEvent.forEach((g) => {
    const e = g.e, [hx, hy] = P(e.lat, e.lng);
    g.rows.forEach((r) => {
      if (r.city === e.city) return;
      const [x, y] = P(r.lat, r.lng), mx = (x + hx) / 2, my = (y + hy) / 2, d = Math.hypot(hx - x, hy - y);
      arcs += `<path d="M${num(x)},${num(y)} Q${num(mx - d * 0.18)},${num(my - d * 0.28)} ${num(hx)},${num(hy)}" fill="none" stroke="${g.color}" stroke-opacity=".85" stroke-width="${num(1.2 + r.students * 1.1)}" stroke-linecap="round"/>`;
      dots += `<circle cx="${num(x)}" cy="${num(y)}" r="${num(3.5 + r.students * 1.1)}" fill="${g.color}" stroke="#fff" stroke-width="1.8"/>`;
      const west = x < hx;
      labels.push({ x: x + (west ? -10 : 10), y: y + 4, anchor: west ? 'end' : 'start', text: r.city, n: r.students });
    });
  });
  // Nudge labels that would sit on top of each other
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = labels[j], b = labels[i];
      if (a.anchor === b.anchor && Math.abs(a.y - b.y) < 14) b.y = a.y + 14;
    }
  }
  const lab = labels.map((l) => `<text x="${num(l.x)}" y="${num(l.y)}" text-anchor="${l.anchor}" font-size="13.5" fill="${INK}">${esc(l.text)} <tspan fill="${MUTED}">${l.n}</tspan></text>`).join('');
  let hosts = '';
  events.forEach((e) => {
    if (typeof e.lat !== 'number') return;
    const [x, y] = P(e.lat, e.lng), g = byEvent.find((b) => b.e === e);
    if (g) {
      // Put the name on the side with fewer origin dots nearby
      const others = g.rows.filter((r) => r.city !== e.city).map((r) => P(r.lat, r.lng));
      const crowd = (sign) => others.filter((o) => (o[0] - x) * sign > 0 && (o[0] - x) * sign < 120 && Math.abs(o[1] - y) < 22).length;
      const leftSide = crowd(-1) < crowd(1);
      hosts += `<circle cx="${num(x)}" cy="${num(y)}" r="13" fill="#fff" stroke="${g.color}" stroke-width="5"/><text x="${num(x + (leftSide ? -19 : 19))}" y="${num(y - 12)}" text-anchor="${leftSide ? 'end' : 'start'}" font-size="17" font-weight="700" fill="${INK}">${esc(e.city)}</text>`;
    } else {
      hosts += `<circle cx="${num(x)}" cy="${num(y)}" r="10" fill="#fff8e4" stroke="${AMBER}" stroke-width="2.5" stroke-dasharray="4 3"/><text x="${num(x - 17)}" y="${num(y + 5)}" text-anchor="end" font-size="14" font-weight="700" fill="#7a5600">${esc(e.city)}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de las ciudades de origen de los estudiantes y las sedes"><g stroke="rgba(43,58,50,.07)" fill="none">${grid}</g>` +
    `<path d="${path(geo.neighbors, P)}" fill="#e3ece6" stroke="#cbdad0"/><path d="${path(geo.colombia, P)}" fill="#cfe5d8" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>` +
    arcs + dots + lab + hosts + '</svg>';
}

module.exports = {
  isExample: !!participants.isExample,
  hero: { d: heroMap('d'), m: heroMap('m') },
  flow: byEvent.length ? flowMap() : '',
  legend: byEvent.map((g) => ({ name: g.e.name, city: g.e.city, color: g.color })),
  stats,
  bins,
  cities,
  mix,
};
