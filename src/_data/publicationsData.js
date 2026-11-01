// Data for the Publications page and for the page of each paper.
// Available in templates as `publicationsData`. Eleventy loads every file in src/_data by itself.
// Everything here is read from src/publications, src/team and src/_data/publicationsFeatured.json.
// Nothing is maintained by hand, and a missing or odd value never stops the build.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const KINDS = [
    { id: 'article', label: 'Articles' },
    { id: 'review', label: 'Reviews and commentary' },
    { id: 'preprint', label: 'Preprints' },
    { id: 'popular', label: 'Popular writing' },
];

// A value that may be a string or a list
const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const year = (v) => parseInt(list(v)[0], 10) || 0;

// Plain text from markdown or HTML
const plain = (s) => text(s)
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// A name reduced to lower case letters, so "Román-Palacios" and "roman palacios" compare equal
const norm = (s) => text(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
// First and last word of a name, to match "Cristian A. Román-Palacios" with "Cristian Román-Palacios"
const shortKey = (s) => {
    const parts = norm(s).split(' ').filter(Boolean);
    return parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1] : parts[0] || '';
};

// Front matter of every .md file in src/<folder>. A file that cannot be read is skipped.
function read(folder) {
    const dir = path.join(process.cwd(), 'src', folder);
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return []; }
    return files.reduce((out, file) => {
        try {
            out.push({ slug: file.replace(/\.md$/, ''), data: matter(fs.readFileSync(path.join(dir, file), 'utf8')).data || {} });
        } catch (e) { /* skip */ }
        return out;
    }, []);
}

function readFeatured() {
    try {
        const raw = fs.readFileSync(path.join(process.cwd(), 'src', '_data', 'publicationsFeatured.json'), 'utf8');
        const json = JSON.parse(raw);
        return json && typeof json === 'object' ? json : {};
    } catch (e) { return {}; }
}

// One short sentence from the abstract, for cards
function summarize(abstract) {
    const s = plain(abstract);
    if (!s) return '';
    const first = s.match(/^(.+?[.!?])(\s|$)/);
    if (first && first[1].length >= 40 && first[1].length <= 170) return first[1];
    if (s.length <= 150) return s;
    return s.slice(0, 140).replace(/\s+\S*$/, '') + '...';
}

const escapeHtml = (s) => text(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Titles only need italics and bold, so they are converted by hand and stay inline
const inlineHtml = (s) => escapeHtml(text(s).replace(/\s+/g, ' ').trim())
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

// Abstracts are markdown. If the renderer is missing, plain paragraphs are used.
let renderer = null;
try { renderer = new (require('markdown-it'))(); } catch (e) { renderer = null; }
const blockHtml = (s) => {
    const src = text(s).trim();
    if (!src) return '';
    if (renderer) { try { return renderer.render(src); } catch (e) { /* fall through */ } }
    return src.split(/\n\s*\n/).map((x) => '<p>' + escapeHtml(x.trim()) + '</p>').join('');
};

// File names become web addresses, so accents and odd dashes are removed
const urlSlug = (s) => text(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const bibEscape = (s) => text(s).replace(/[{}]/g, '').replace(/([&%$#_])/g, '\\$1');

module.exports = function () {
    // ---- People: who counts as a student, and who is the PI ----
    const studentKeys = new Set();
    const piKeys = new Set();
    const memberKeys = new Set();
    read('team').forEach((m) => {
        const name = text(m.data.memberName);
        if (!name) return;
        const roles = list(m.data.tags).concat(list(m.data.memberTitle)).map(text).join(' | ');
        const isPI = /\bPI\b/.test(roles);
        // A person who was also a postdoc or staff member is left out, because the paper could be from either time
        const isStudent = /student/i.test(roles) && !/postdoc|\bPI\b|\bstaff\b/i.test(roles);
        // Other spellings of the name, from "Also published as", count as the same person
        const names = [name].concat(list(m.data.alsoPublishedAs).map(text));
        names.reduce((all, n) => all.concat([norm(n), shortKey(n)]), []).forEach((k) => {
            if (!k) return;
            memberKeys.add(k);
            if (isPI) piKeys.add(k);
            if (isStudent) studentKeys.add(k);
        });
    });
    // Names match when they are equal or one sits inside the other, so "Reza Ehsani" matches "Mohammad Reza Ehsani"
    const inside = (a, b) => (' ' + b + ' ').indexOf(' ' + a + ' ') > -1 && a.indexOf(' ') > -1;
    const matches = (set, author) => {
        const n = norm(author);
        if (set.has(n) || set.has(shortKey(author))) return true;
        return Array.from(set).some((k) => inside(n, k) || inside(k, n));
    };

    // ---- Papers, newest first ----
    const papers = read('publications')
        .filter((p) => plain(p.data.publicationTitle))
        .map((p) => {
            const d = p.data;
            const title = plain(d.publicationTitle);
            const authorText = plain(d.publicationAuthor);
            const authors = authorText.split(/\s*,\s*(?:and\s+)?|\s+and\s+/).map((a) => a.trim()).filter(Boolean);
            const y = year(d.publicationDate);
            const venue = plain(d.publicationType);
            const outputType = text(d.outputType);
            const kind = outputType === 'Preprint' ? 'preprint'
                : outputType === 'Review' || outputType === 'Commentary' ? 'review'
                : outputType === 'Popular writing' ? 'popular' : 'article';
            const web = text(d.webLink);
            const pdf = text(d.pdfDocument) || text(d.pdfLink);
            const url = '/publications/' + (urlSlug(p.slug) || 'paper') + '/';
            const lastName = (authors[0] || 'paper').split(/\s+/).pop();
            const firstWord = norm(title).split(' ').find((w) => w.length > 3) || 'paper';
            const volume = plain(d.publicationVolume);
            const issue = plain(d.publicationIssue);
            const pages = plain(d.publicationPages);
            const doi = plain(d.publicationDoi).replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '');
            const doiUrl = doi ? 'https://doi.org/' + doi : '';
            // Journal, volume(issue), pages. Whatever is missing is left out.
            const place = [venue, [volume + (issue ? '(' + issue + ')' : ''), pages].filter(Boolean).join(', ')].filter(Boolean).join(', ');
            const citation = [authorText, y ? '(' + y + ').' : '', title.replace(/[.?!]$/, '') + '.', place ? place + '.' : '', doiUrl].filter(Boolean).join(' ');
            const bibtex = [
                '@article{' + norm(lastName).replace(/\s+/g, '') + (y || '') + firstWord + ',',
                '  title = {' + bibEscape(title) + '},',
                '  author = {' + authors.map(bibEscape).join(' and ') + '},',
                venue ? '  journal = {' + bibEscape(venue) + '},' : '',
                volume ? '  volume = {' + bibEscape(volume) + '},' : '',
                issue ? '  number = {' + bibEscape(issue) + '},' : '',
                pages ? '  pages = {' + bibEscape(pages).replace(/-+/g, '--') + '},' : '',
                y ? '  year = {' + y + '},' : '',
                doi ? '  doi = {' + doi + '},' : '',
                web || doiUrl ? '  url = {' + (web || doiUrl) + '},' : '',
                '}',
            ].filter(Boolean).join('\n');
            const ld = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ScholarlyArticle',
                name: title,
                headline: title,
                author: authors.map((a) => ({ '@type': 'Person', name: a })),
                datePublished: y ? String(y) : undefined,
                isPartOf: venue ? { '@type': 'Periodical', name: venue } : undefined,
                volumeNumber: volume || undefined,
                issueNumber: issue || undefined,
                pagination: pages || undefined,
                sameAs: doiUrl || undefined,
                abstract: plain(d.publicationAbstract) || undefined,
                url: web || undefined,
            }).replace(/</g, '\\u003c');
            return {
                slug: p.slug,
                url,
                title,
                titleHtml: inlineHtml(d.publicationTitle),
                abstractHtml: blockHtml(d.publicationAbstract),
                abstractText: plain(d.publicationAbstract),
                authorShort: authors.length > 3 ? authors[0] + ' et al.' : authors.join(', '),
                authorList: authors.map((a) => ({ name: a, lab: matches(memberKeys, a), norm: norm(a), short: shortKey(a) })),
                authors,
                authorText,
                venue,
                year: y,
                month: text(d.publicationMonth),
                rank: y * 13 + (MONTHS[d.publicationMonth] || 0),
                image: text(d.image),
                summary: summarize(d.publicationAbstract),
                outputType,
                kind,
                areas: list(d.researchAreas).map(text).filter(Boolean),
                topAreas: list(d.researchAreas).map(text).filter(Boolean).slice(0, 2),
                keywords: list(d.tags).map(text).filter(Boolean),
                // The main topics of the site: Biodiversity, Data Science, Software and People
                topics: (list(d.topics).length ? list(d.topics) : list(d.tags)).map(text).filter(Boolean),
                studentLed: authors.length > 0 && matches(studentKeys, authors[0]),
                withPI: authors.some((a) => matches(piKeys, a)),
                volume,
                issue,
                pages,
                doi,
                doiUrl,
                link: web || doiUrl || pdf,
                pdf,
                citation,
                bibtex,
                ld,
            };
        })
        .sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title));

    // Two files can only share an address if their names differ by accents or punctuation
    const seen = {};
    papers.forEach((p) => {
        seen[p.url] = (seen[p.url] || 0) + 1;
        if (seen[p.url] > 1) p.url = p.url.replace(/\/$/, '') + '-' + seen[p.url] + '/';
        p.path = p.url.replace(/^\/publications\//, '').replace(/\/$/, '');
    });

    const bySlug = {};
    papers.forEach((p) => { bySlug[p.slug] = p; });

    // Up to three papers on the same topic, for the side column of each paper page
    const brief = (p) => ({ url: p.url, title: p.title, titleHtml: p.titleHtml, venue: p.venue, year: p.year });
    papers.forEach((p) => {
        const area = p.areas.find((a) => a !== 'Tools') || '';
        p.area = area;
        p.related = !area ? [] : papers
            .filter((o) => o !== p && o.areas.includes(area))
            .map((o) => ({ o, shared: o.areas.filter((a) => p.areas.includes(a)).length }))
            .sort((a, b) => b.shared - a.shared || b.o.rank - a.o.rank)
            .slice(0, 3)
            .map((x) => brief(x.o));
    });

    // ---- Topics, each with its own image ----
    // The tiles are the main topics of the site. They come from the Topics field of each paper.
    // Topics with the fewest images choose first, so every topic gets one when possible.
    // An image is never used twice, so two tiles can never look the same.
    const topicMap = {};
    papers.forEach((p) => p.topics.forEach((a) => { (topicMap[a] = topicMap[a] || []).push(p); }));
    const used = new Set();
    const chosen = {};
    Object.keys(topicMap)
        .sort((a, b) => topicMap[a].filter((p) => p.image).length - topicMap[b].filter((p) => p.image).length || a.localeCompare(b))
        .forEach((topic) => {
            const options = topicMap[topic]
                .filter((p) => p.image && !used.has(p.image))
                // Prefer papers that belong only to this topic, then the newest
                .sort((a, b) => a.topics.length - b.topics.length || b.rank - a.rank);
            if (options.length) { chosen[topic] = options[0].image; used.add(options[0].image); }
        });
    const topics = Object.keys(topicMap)
        .map((name) => ({ name, count: topicMap[name].length, image: chosen[name] || '' }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    // ---- Filters ----
    const kinds = KINDS
        .map((k) => ({ id: k.id, label: k.label, count: papers.filter((p) => p.kind === k.id).length }))
        .filter((k) => k.count > 0);
    const counts = {
        all: papers.length,
        tools: papers.filter((p) => p.areas.includes('Tools')).length,
        studentLed: papers.filter((p) => p.studentLed).length,
    };
    const years = papers.map((p) => p.year).filter(Boolean);
    // Journals and keywords with their counts, most common first
    const tally = (pick) => {
        const n = {};
        papers.forEach((p) => [].concat(pick(p)).filter(Boolean).forEach((v) => { n[v] = (n[v] || 0) + 1; }));
        return Object.keys(n).map((name) => ({ name, count: n[name] })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    };
    const venues = tally((p) => p.venue);
    const areaList = tally((p) => p.areas);

    // ---- Featured: exactly three, chosen in Netlify ----
    // A pick that no longer exists is skipped and a paper chosen twice counts once.
    // Missing slots are filled with the newest papers that have an image.
    const featuredFile = readFeatured();
    const picks = Array.isArray(featuredFile.picks) ? featuredFile.picks : [];
    const featured = [];
    picks.forEach((pick) => {
        const slug = text(pick && (typeof pick === 'string' ? pick : pick.paper)).trim();
        const paper = bySlug[slug];
        if (!paper || featured.some((f) => f.slug === slug) || featured.length >= 3) return;
        featured.push({ paper, note: text(pick && pick.note).trim() });
    });
    papers.filter((p) => p.image && !featured.some((f) => f.slug === p.slug)).forEach((paper) => {
        if (featured.length < 3) featured.push({ paper, note: '' });
    });
    const featuredCards = featured.slice(0, 3).map((f) => ({
        slug: f.paper.slug,
        url: f.paper.url,
        title: f.paper.title,
        venue: f.paper.venue,
        year: f.paper.year,
        image: f.paper.image,
        note: f.note,
    }));

    return {
        papers,
        bySlug,
        topics,
        kinds,
        counts,
        venues,
        areaList,
        firstYear: years.length ? Math.min.apply(null, years) : 0,
        lastYear: years.length ? Math.max.apply(null, years) : 0,
        featuredTitle: text(featuredFile.title).trim() || 'Featured publications',
        featured: featuredCards,
    };
};
