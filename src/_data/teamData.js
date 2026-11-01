// Data for the Team page and for the page of each person, available as `teamData`.
// It reads src/team, src/_data/teamPage.json, and matches people to papers, tools and grants by name.
// Nothing is maintained by hand, and a missing or odd value never stops the build.
// A completeness report is printed in the build log. It is never shown on the site.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clean = (v) => text(v).replace(/\s+/g, ' ').trim();
const fold = (s) => text(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const norm = (s) => fold(s).replace(/[^a-z]+/g, ' ').trim();
const shortKey = (s) => {
    const parts = norm(s).split(' ').filter(Boolean);
    return parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1] : '';
};
const urlSlug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const yearOf = (v) => { const m = text(v).match(/\d{4}/); return m ? parseInt(m[0], 10) : 0; };

// Two names match when they are equal or one sits inside the other, so "Reza Ehsani" matches "Mohammad Reza Ehsani"
const sameName = (a, b) => {
    if (!a || !b) return false;
    if (a === b) return true;
    const x = ' ' + a + ' ';
    const y = ' ' + b + ' ';
    return (a.indexOf(' ') > -1 && y.indexOf(x) > -1) || (b.indexOf(' ') > -1 && x.indexOf(y) > -1);
};
// A short description for cards, from the start of the bio
const blurb = (s, n) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '').replace(/[,;:.\s]+$/, '') + '...');

const STATUS_TAGS = ['current', 'former', 'honorary', 'team'];
const DEFAULT_CATEGORIES = [
    { tag: 'PI', singular: 'Principal investigator', plural: 'Principal investigator' },
    { tag: 'Postdoc', singular: 'Postdoctoral researcher', plural: 'Postdoctoral researchers' },
    { tag: 'PhD student', singular: 'PhD student', plural: 'PhD students' },
    { tag: 'MSc capstone student', singular: 'MSc student', plural: 'MSc students' },
    { tag: 'Undergraduate student', singular: 'Undergraduate student', plural: 'Undergraduate students' },
    { tag: 'VIP student', singular: 'VIP student', plural: 'VIP students' },
    { tag: 'Staff', singular: 'Staff', plural: 'Staff' },
    { tag: 'MS advising team', singular: 'MS advising team member', plural: 'MS advising team' },
    { tag: 'Intern', singular: 'Intern', plural: 'Interns' }
];
// Words in a title that also place a person in a category, for people whose tags are incomplete
const TITLE_WORDS = {
    'postdoc': /postdoc/i,
    'phd student': /\bph\.?d\b/i,
    'msc capstone student': /\bm\.?sc\b|master/i,
    'undergraduate student': /undergrad/i
};

const ICONS = {
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z M3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
};

function readFolder(folder) {
    const dir = path.join(process.cwd(), 'src', folder);
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return []; }
    return files.sort().reduce((out, file) => {
        try { out.push({ file: file.replace(/\.md$/, ''), data: matter(fs.readFileSync(path.join(dir, file), 'utf8')).data || {} }); } catch (e) { /* skip */ }
        return out;
    }, []);
}

function readPage() {
    try {
        const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', '_data', 'teamPage.json'), 'utf8'));
        return json && typeof json === 'object' ? json : {};
    } catch (e) { return {}; }
}

// Other data files are loaded here, so the profiles can list papers, tools and grants
function load(file) {
    try { return require('./' + file)(); } catch (e) { return null; }
}

// Handles, ids and full addresses are all accepted
function linkFor(kind, value) {
    const v = clean(value);
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (kind === 'github') return 'https://github.com/' + v.replace(/^@/, '');
    if (kind === 'orcid') return 'https://orcid.org/' + v.replace(/^orcid\.org\//i, '');
    if (kind === 'bluesky') return 'https://bsky.app/profile/' + v.replace(/^@/, '');
    return 'https://' + v;
}

function termFor(status, start, end) {
    if (status === 'current') return start ? 'Since ' + start : '';
    if (!start && !end) return '';
    if (start && end) return start === end ? String(start) : start + ' to ' + end;
    return String(start || end);
}

module.exports = function () {
    const page = readPage();
    const cats = (Array.isArray(page.categories) && page.categories.length ? page.categories : DEFAULT_CATEGORIES)
        .map((c) => ({ tag: clean(c && c.tag), singular: clean(c && c.singular), plural: clean(c && c.plural) }))
        .filter((c) => c.tag)
        .map((c) => ({ tag: c.tag, singular: c.singular || c.tag, plural: c.plural || c.singular || c.tag }));

    // ---- People ----
    const taken = {};
    const people = readFolder('team').filter((f) => clean(f.data.memberName)).map((f) => {
        const d = f.data;
        const name = clean(d.memberName);
        const tags = list(d.tags).map(clean).filter(Boolean);
        const lower = tags.map((t) => t.toLowerCase());
        const status = lower.includes('honorary') ? 'honorary' : lower.includes('current') ? 'current' : 'alumni';
        const titles = list(d.memberTitle).map(clean).filter(Boolean);
        const roleTags = tags.filter((t) => STATUS_TAGS.indexOf(t.toLowerCase()) === -1);

        // A person is placed once, in the highest category they belong to. Every role still shows on the profile.
        const matched = [];
        cats.forEach((c, i) => {
            const key = c.tag.toLowerCase();
            const byTag = roleTags.some((t) => t.toLowerCase() === key);
            const byTitle = TITLE_WORDS[key] && titles.some((t) => TITLE_WORDS[key].test(t));
            if (byTag || byTitle) matched.push(i);
        });
        const unknown = roleTags.filter((t) => !cats.some((c) => c.tag.toLowerCase() === t.toLowerCase()));
        const group = matched.length ? cats[matched[0]].plural : unknown.length ? unknown[0] : 'Members';
        const rank = matched.length ? matched[0] : cats.length;
        const roles = matched.map((i) => cats[i].singular).concat(unknown);

        const start = yearOf(d.memberDate);
        const end = yearOf(d.memberDateEnd);
        const afterRole = clean(d.afterRole);
        const afterOrg = clean(d.afterOrg);
        const afterText = [afterRole, afterOrg].filter(Boolean).join(', ') || clean(d.currentPosition);

        const links = [];
        const add = (kind, label, url, icon) => { if (url) links.push({ kind, label, url, icon: icon || '' }); };
        add('cv', 'CV (PDF)', clean(d.resume));
        add('web', 'Website', linkFor('web', d.link), ICONS.web);
        add('linkedin', 'LinkedIn', linkFor('linkedin', d.linkedin));
        add('github', 'GitHub', linkFor('github', d.github));
        add('scholar', 'Google Scholar', linkFor('scholar', d.scholar));
        add('orcid', 'ORCID', linkFor('orcid', d.orcid));
        add('bluesky', 'Bluesky', linkFor('bluesky', d.bluesky));
        // Emails are shown for current members only
        const emails = status === 'current' ? clean(d.email).split(/\s*,\s*/).filter(Boolean) : [];
        emails.forEach((e) => add('email', emails.length > 1 ? e : 'Email', 'mailto:' + e, ICONS.mail));

        const variants = list(d.alsoPublishedAs).map(clean).filter(Boolean);
        const keys = [];
        [name].concat(variants).forEach((n) => { [norm(n), shortKey(n)].forEach((k) => { if (k && k.indexOf(' ') > -1 && keys.indexOf(k) === -1) keys.push(k); }); });

        let slug = urlSlug(name) || 'member';
        taken[slug] = (taken[slug] || 0) + 1;
        if (taken[slug] > 1) slug += '-' + taken[slug];

        const affiliations = list(d.affiliations)
            .map((a) => ({ name: clean(a && a.name), url: clean(a && a.url) }))
            .filter((a) => a.name);

        return {
            name,
            slug,
            url: '/our-team/' + slug + '/',
            status,
            title: titles.join(', '),
            group,
            rank,
            roles,
            education: clean(d.memberEducation),
            bio: clean(d.memberBio),
            image: clean(d.image),
            hasAlt: !!clean(d.imageAlt),
            imageAlt: clean(d.imageAlt) || 'Portrait of ' + name,
            start, end,
            term: termFor(status, start, end),
            order: typeof d.order === 'number' ? d.order : null,
            links,
            hasLinks: links.some((l) => l.kind !== 'email'),
            hasCv: links.some((l) => l.kind === 'cv'),
            after: { role: afterRole, org: afterOrg, link: clean(d.afterLink), text: afterText },
            coAdvisor: clean(d.coAdvisor),
            coAdvisorLink: clean(d.coAdvisorLink),
            affiliations,
            variants,
            keys,
            blurb: blurb(clean(d.memberBio), 150),
            hay: fold([name, variants.join(' '), titles.join(' '), roles.join(' '), afterText].join(' ')),
            macrodata: null,
            papers: [], tools: [], grants: []
        };
    });

    // ---- Lookups used by other pages ----
    const byKey = {};
    const byName = {};
    const cardOf = (p) => ({ name: p.name, url: p.url, image: p.image, imageAlt: p.imageAlt });
    people.forEach((p) => {
        const card = cardOf(p);
        byName[p.name] = card;
        p.keys.forEach((k) => { if (!byKey[k]) byKey[k] = card; });
    });
    const owns = (p, string) => {
        const n = norm(string);
        return !!n && (p.keys.indexOf(shortKey(string)) > -1 || p.keys.some((k) => sameName(n, k)));
    };
    const findPerson = (string) => people.find((p) => owns(p, string));
    // Name as written in a paper, tool or post, to the card of the person
    const faces = {};
    const postFaces = {};
    const seen = (name) => { if (name && faces[name] === undefined) { const p = findPerson(name); faces[name] = p ? cardOf(p) : null; } return faces[name]; };

    // ---- MacroData team, so the profiles and the MacroData page link to each other ----
    let mdPeople = [];
    try { mdPeople = list(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', '_data', 'macrodataTeam.json'), 'utf8')).people); } catch (e) { mdPeople = []; }
    const macroSlugs = {};
    mdPeople.forEach((m) => {
        const name = clean(m && m.name);
        if (!name) return;
        macroSlugs[name] = urlSlug(name);
        const hit = seen(name);
        const p = hit && people.find((x) => x.url === hit.url);
        if (p) p.macrodata = { role: clean(m.role), url: '/macrodata/equipo/#' + macroSlugs[name] };
    });

    // ---- Papers, tools and grants ----
    const pubs = load('publicationsData');
    ((pubs && pubs.papers) || []).forEach((paper) => {
        const lab = [];
        list(paper.authors).forEach((a) => {
            const hit = seen(a);
            if (hit && !lab.some((x) => x.url === hit.url)) lab.push(hit);
        });
        lab.forEach((hit) => {
            const p = people.find((x) => x.url === hit.url);
            if (p) p.papers.push({ url: paper.url, titleHtml: paper.titleHtml, venue: paper.venue, year: paper.year, image: paper.image, count: list(paper.authors).length, studentLed: !!paper.studentLed, lab });
        });
    });

    // Only the five most recent papers are shown, newest first. The total is kept for the heading.
    people.forEach((p) => { p.paperCount = p.papers.length; p.papers = p.papers.slice(0, 5); });

    const tl = load('toolsData');
    ((tl && tl.tools) || []).forEach((tool) => {
        list(tool.authors).forEach(seen);
        people.forEach((p) => {
            if (list(tool.authors).some((a) => owns(p, a))) {
                p.tools.push({ name: tool.name, summary: tool.summary, image: tool.image, open: tool.open, external: tool.external, typeLabel: tool.typeLabel });
            }
        });
    });

    // Blog posts have one author field, which may name several people
    readFolder('blog').forEach((post) => {
        const text = clean(post.data.author);
        if (!text || postFaces[text]) return;
        postFaces[text] = text.split(/\s*(?:,|&|\band\b|\by\b)\s*/).map(seen).filter(Boolean)
            .filter((c, i, all) => all.findIndex((x) => x.url === c.url) === i);
    });

    const ORDER = ['PI', 'Co-PI', 'Project staff'];
    const gd = load('grantsData');
    const grants = gd ? gd.active.concat(gd.past) : [];
    grants.forEach((g) => {
        people.forEach((p) => {
            const role = owns(p, g.pi) ? 'PI' : list(g.copi).some((c) => owns(p, c)) ? 'Co-PI' : list(g.team).some((t) => owns(p, t)) ? 'Project staff' : '';
            if (role) p.grants.push({ name: g.name, funder: g.funder, period: g.period, active: g.active, role, end: g.end });
        });
    });
    people.forEach((p) => {
        p.grants.sort((a, b) => (ORDER.indexOf(a.role) - ORDER.indexOf(b.role)) || (b.end - a.end));
    });

    // ---- Order inside each group ----
    const late = (n) => (n === null ? 1e6 : n);
    const current = (a, b) => (late(a.order) - late(b.order)) || ((a.start || 9999) - (b.start || 9999)) || a.name.localeCompare(b.name);
    const alumni = (a, b) => (late(a.order) - late(b.order)) || (b.end - a.end) || (b.start - a.start) || a.name.localeCompare(b.name);

    function section(id, title, status, sorter, grouped) {
        const members = people.filter((p) => p.status === status).sort(sorter);
        const groups = [];
        if (!grouped) {
            if (members.length) groups.push({ name: '', featured: false, people: members });
        } else {
            members.slice().sort((a, b) => (a.rank - b.rank) || a.group.localeCompare(b.group)).forEach((p) => {
                let g = groups.find((x) => x.name === p.group);
                if (!g) { g = { name: p.group, featured: status === 'current' && !!cats[p.rank] && cats[p.rank].tag.toLowerCase() === 'pi', people: [] }; groups.push(g); }
                g.people.push(p);
            });
        }
        return { id, title, count: members.length, groups };
    }
    const sections = [
        section('current', 'Current members', 'current', current, true),
        section('honorary', 'Honorary members', 'honorary', current, true),
        section('alumni', 'Alumni', 'alumni', alumni, true)
    ].filter((s) => s.count);

    // ---- Completeness report, for the build log only ----
    const names = (fn) => people.filter(fn).map((p) => p.name);
    const checks = [
        ['No photo', names((p) => !p.image)],
        ['No image description', names((p) => !p.hasAlt)],
        ['No bio', names((p) => !p.bio)],
        ['No start year', names((p) => !p.start)],
        ['Alumni without an end year', names((p) => p.status === 'alumni' && !p.end)],
        ['Alumni without an after-the-lab position', names((p) => p.status === 'alumni' && !p.after.text)],
        ['No links at all (email not counted)', names((p) => !p.hasLinks)]
    ];
    const lines = checks.filter((c) => c[1].length).map((c) => '  ' + c[0] + ' (' + c[1].length + '): ' + c[1].join(', '));
    console.log('[team] ' + people.length + ' members. ' + (lines.length ? 'Missing information:\n' + lines.join('\n') : 'Nothing is missing.'));

    return {
        intro: clean(page.intro),
        people,
        sections,
        byKey,
        byName,
        faces,
        postFaces,
        macroSlugs,
        counts: {
            all: people.length,
            current: people.filter((p) => p.status === 'current').length,
            alumni: people.filter((p) => p.status === 'alumni').length,
            honorary: people.filter((p) => p.status === 'honorary').length
        }
    };
};
