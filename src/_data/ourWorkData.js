// Data for the Our work page, available there as `ourWorkData`.
// It puts papers, tools and grants in one list. Each item opens its own page on this site.
// Nothing is maintained by hand, and a missing or odd value never stops the build.

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clean = (v) => text(v).replace(/<[^>]*>/g, '').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
const short = (s, n) => { const c = clean(s); return c.length <= n ? c : c.slice(0, n - 1).replace(/\s+\S*$/, '') + '...'; };
const load = (file) => { try { return require(file)() || {}; } catch (e) { return {}; } };
const year = (v) => { const m = text(v).match(/\d{4}/); return m ? parseInt(m[0], 10) : 0; };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Topics shown as chips, in this order. Others are added after them, by how many items they hold.
const TOPIC_ORDER = ['Biodiversity', 'Data Science', 'Software', 'People'];

module.exports = function () {
    const pubs = load('./publicationsData.js');
    const tools = load('./toolsData.js');
    const grants = load('./grantsData.js');

    const team = load('./teamData.js');
    // Small faces for lab members, found by the names written on the paper, tool or grant
    const faces = (names) => {
        const out = [];
        list(names).forEach((n) => {
            const w = team.faces && team.faces[clean(n)];
            if (w && w.image && !out.some((x) => x.url === w.url)) out.push({ name: w.name, url: w.url, image: w.image });
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
            faces: faces(p.authors),
            who: clean(p.authorShort),
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
            faces: faces(t.authors),
            who: list(t.authors).join(', '),
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
            faces: faces([g.pi].concat(list(g.copi), list(g.team))),
            who: g.pi ? 'PI: ' + g.pi : '',
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
