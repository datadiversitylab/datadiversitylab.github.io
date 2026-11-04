// Data for the Our work page, available there as `ourWork`.
// It puts papers, tools and grants in one list. Each item opens its own page on this site.
// Nothing is maintained by hand, and a missing or odd value never stops the build.

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clean = (v) => text(v).replace(/<[^>]*>/g, '').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
const short = (s, n) => { const c = clean(s); return c.length <= n ? c : c.slice(0, n - 1).replace(/\s+\S*$/, '') + '...'; };
const load = (file) => { try { return require(file)() || {}; } catch (e) { return {}; } };
const year = (v) => { const m = text(v).match(/\d{4}/); return m ? parseInt(m[0], 10) : 0; };
const fold = (s) => text(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const norm = (s) => fold(s).replace(/[^a-z]+/g, ' ').trim();
const shortKey = (s) => {
    const parts = norm(s).split(' ').filter(Boolean);
    return parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1] : '';
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Topics shown as chips, in this order. Others are added after them, by how many items they hold.
const TOPIC_ORDER = ['Biodiversity', 'Data Science', 'Software', 'People'];

module.exports = function () {
    const pubs = load('./publicationsData.js');
    const tools = load('./toolsData.js');
    const grants = load('./grantsData.js');

    const team = load('./teamData.js');
    const withPhoto = list(team.people).filter((m) => m.image);

    // Lab members named in a list of authors, as small cards for the faces under each item
    const facesFor = (names) => {
        const out = [];
        list(names).forEach((n) => {
            const k = norm(n);
            const s = shortKey(n);
            if (!k) return;
            const m = withPhoto.find((x) => x.keys.indexOf(k) > -1 || (s && x.keys.indexOf(s) > -1));
            if (m && !out.some((o) => o.u === m.url)) out.push({ n: m.name, u: m.url, i: m.image });
        });
        return out;
    };

    const items = [];

    list(pubs.papers).forEach((p) => {
        const alt = p.pdf || '';
        items.push({
            type: 'Paper',
            title: clean(p.title),
            url: p.url,
            link2: alt || p.link || '',
            link2Label: alt ? 'PDF' : 'Journal',
            topics: list(p.topics),
            areas: list(p.areas),
            year: year(p.year),
            month: MONTHS.indexOf(p.month) + 1,
            shownYear: text(p.year),
            who: clean(p.authorShort),
            people: facesFor(p.authors),
            where: clean(p.venue),
            pills: [p.outputType, p.studentLed ? 'Student-led' : ''].filter(Boolean),
            detail: short(p.summary, 420)
        });
    });

    list(tools.tools).forEach((t) => {
        items.push({
            type: 'Tool',
            title: clean(t.name),
            url: t.url,
            link2: t.open || t.github || '',
            link2Label: t.open ? (t.live ? 'Try it' : 'Open') : 'GitHub',
            topics: list(t.topics),
            areas: [],
            year: 0,
            month: 0,
            shownYear: '',
            who: list(t.authors).join(', '),
            people: facesFor(t.authors),
            where: '',
            pills: list(t.types),
            detail: short(t.summary, 420)
        });
    });

    list(grants.all).forEach((g) => {
        items.push({
            type: 'Grant',
            title: clean(g.name),
            url: '/grants/#' + g.slug,
            link2: g.link || g.document || '',
            link2Label: g.link ? 'Project page' : 'Document',
            topics: list(g.topics),
            areas: [],
            year: g.start || g.end || 0,
            month: 0,
            shownYear: g.period || '',
            who: g.pi ? 'PI: ' + g.pi : '',
            people: facesFor([g.pi].concat(list(g.copi), list(g.team))),
            where: [g.funder, g.amount].filter(Boolean).join(' · '),
            pills: [g.active ? 'Active' : ''].filter(Boolean),
            detail: short(g.desc, 420)
        });
    });

    items.forEach((i) => {
        i.hay = [i.title, i.who, i.where, i.pills.join(' '), i.topics.join(' '), i.areas.join(' '), i.detail].join(' ').toLowerCase();
    });

    const count = {};
    items.forEach((i) => i.topics.forEach((t) => { count[t] = (count[t] || 0) + 1; }));
    const topics = Object.keys(count).sort((a, b) => {
        const ia = TOPIC_ORDER.indexOf(a);
        const ib = TOPIC_ORDER.indexOf(b);
        return (ia < 0) - (ib < 0) || ia - ib || count[b] - count[a] || a.localeCompare(b);
    });

    const counts = { all: items.length, Paper: 0, Tool: 0, Grant: 0 };
    items.forEach((i) => { counts[i.type] += 1; });

    return {
        // Escaped so the text can sit inside a script tag
        json: JSON.stringify({ items, topics }).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, ' '),
        counts,
        topics
    };
};
