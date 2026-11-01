// Data for the landing page (src/index.html), available there as `homeData`.
// It is built from the content folders, so nothing here is maintained by hand.
// Eleventy loads every file in src/_data on its own, so no other setup is needed.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const SEASONS = { Spring: 3, Summer: 6, Fall: 9, Winter: 12 };

// A value that may be a string or a list
const list = (v) => [].concat(v || []);
const year = (v) => parseInt(list(v)[0], 10) || 0;
// Plain text for titles and abstracts that may contain markdown or HTML
const plain = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
// Sortable number: year first, then month (0 when unknown)
const rank = (y, m) => y * 13 + (m || 0);
const newestFirst = (a, b) => b.rank - a.rank;

// Front matter of every .md file in src/<folder>. A file that cannot be read is skipped.
function read(folder) {
    const dir = path.join(process.cwd(), 'src', folder);
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return []; }
    return files.reduce((out, file) => {
        try {
            out.push({ slug: file.replace(/\.md$/, ''), data: matter(fs.readFileSync(path.join(dir, file), 'utf8')).data });
        } catch (e) { /* skip */ }
        return out;
    }, []);
}

module.exports = function () {
    // ---- Publications ----
    // Each paper opens its own page. The address comes from publicationsData.js, so both always agree.
    let pages = {};
    try { pages = require('./publicationsData.js')().bySlug; } catch (e) { pages = {}; }
    const papers = read('publications')
        .filter((p) => p.data.publicationTitle)
        .map((p) => {
            const d = p.data;
            const title = plain(d.publicationTitle);
            return {
                slug: p.slug,
                title,
                venue: d.publicationType || '',
                year: year(d.publicationDate) ? String(year(d.publicationDate)) : '',
                month: d.publicationMonth || '',
                image: d.image || '',
                abstract: plain(d.publicationAbstract),
                outputType: d.outputType || '',
                // Every paper opens its own page. If that page is missing, the journal or PDF link is used.
                link: pages[p.slug] ? pages[p.slug].url : d.webLink || d.pdfLink || d.pdfDocument || '/publications/',
                areas: list(d.researchAreas),
                rank: rank(year(d.publicationDate), MONTHS[d.publicationMonth]),
            };
        })
        .sort(newestFirst);

    // The five most common research areas. "Tools" describes an output, not a theme.
    const areaCounts = {};
    papers.forEach((p) => p.areas.forEach((a) => { areaCounts[a] = (areaCounts[a] || 0) + 1; }));
    const themes = Object.keys(areaCounts)
        .filter((a) => a !== 'Tools')
        .sort((a, b) => areaCounts[b] - areaCounts[a] || a.localeCompare(b))
        .slice(0, 5);

    // ---- Press, newest first ----
    const press = read('inthenews')
        .filter((n) => n.data.newsTitle && year(n.data.tags))
        .map((n) => ({
            title: plain(n.data.newsTitle),
            outlet: plain(n.data.Outlet),
            when: [n.data.newsDate, year(n.data.tags)].filter(Boolean).join(' '),
            image: list(n.data.images)[0] || '',
            link: n.data.link || '',
            rank: rank(year(n.data.tags), SEASONS[n.data.newsDate]),
        }))
        .sort(newestFirst);

    // ---- Events from Socials ----
    const events = read('socials')
        .filter((s) => s.data.publicationTitle && year(s.data.publicationDate))
        .map((s) => ({
            title: plain(s.data.publicationTitle),
            place: s.data.Location || '',
            when: [s.data.publicationMonth, year(s.data.publicationDate)].filter(Boolean).join(' '),
            image: list(s.data.images)[0] || '',
            rank: rank(year(s.data.publicationDate), MONTHS[s.data.publicationMonth]),
        }))
        .sort(newestFirst);

    // ---- Team ----
    const team = read('team');
    const joined = team
        .filter((m) => list(m.data.tags).includes('Current') && m.data.memberName && year(m.data.memberDate))
        .map((m) => ({
            title: m.data.memberName,
            role: list(m.data.memberTitle)[0] || '',
            when: String(year(m.data.memberDate)),
            image: m.data.image || '',
            rank: rank(year(m.data.memberDate), 0),
        }))
        .sort(newestFirst);

    // ---- Faces for the landing page: the PI first, then current members by their order in the team page ----
    const ROLES = ['PI', 'Postdoc', 'PhD student', 'Undergraduate student', 'Staff'];
    const faces = team
        .filter((m) => m.data.memberName && m.data.image && list(m.data.tags).includes('Current') && ROLES.some((r) => list(m.data.tags).includes(r)))
        .sort((a, b) => (list(a.data.tags).includes('PI') ? 0 : 1) - (list(b.data.tags).includes('PI') ? 0 : 1) || (Number(a.data.order) || 999) - (Number(b.data.order) || 999))
        .slice(0, 8)
        .map((m) => {
            const parts = String(m.data.memberName).trim().split(/\s+/);
            return { name: parts[0].length <= 2 && parts[1] ? parts[0] + ' ' + parts[1] : parts[0], image: m.data.image };
        });

    // ---- Latest: the four most recent things the lab did, no more than two of a kind ----
    const items = []
        .concat(papers.map((p) => ({ kind: 'Paper', order: 0, rank: p.rank, title: p.title, meta: p.venue, when: [p.month, p.year].filter(Boolean).join(' '), image: p.image, link: p.link })))
        .concat(events.map((e) => ({ kind: 'Event', order: 1, rank: e.rank, title: e.title, meta: e.place, when: e.when, image: e.image, link: '/social/' })))
        .concat(press.map((n) => ({ kind: 'Press', order: 2, rank: n.rank, title: n.title, meta: n.outlet, when: n.when, image: n.image, link: n.link || '/innews/' })))
        .concat(joined.map((m) => ({ kind: 'New member', order: 3, rank: m.rank, title: m.title, meta: m.role, when: m.when, image: m.image, link: '/our-team/' })));
    const seen = {};
    const latest = items
        .sort((a, b) => newestFirst(a, b) || a.order - b.order)
        .filter((i) => (seen[i.kind] = (seen[i.kind] || 0) + 1) <= 2)
        .slice(0, 4);

    // ---- Open positions, for the recruiting note ----
    const openJobs = read('jobs')
        .filter((j) => j.data.status && j.data.status !== 'Closed')
        .map((j) => ({ title: j.data.jobTitle || 'Open position' }));

    return { papers, themes, latest, faces, openJobs };
};
