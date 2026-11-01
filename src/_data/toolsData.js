// Data for the Tools and data library page, available there as `toolsData`.
// It reads src/tools, src/pages (for apps that live inside the site) and src/_data/toolsFeatured.json.
// Nothing is maintained by hand, and a missing or odd value never stops the build.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const plain = (s) => text(s)
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const fold = (s) => text(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escapeRegExp = (s) => text(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const LIVE_TYPES = ['Web application', 'Website'];

function readFolder(folder, ext) {
    const dir = path.join(process.cwd(), 'src', folder);
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith(ext)); } catch (e) { return []; }
    return files.reduce((out, file) => {
        try {
            const raw = fs.readFileSync(path.join(dir, file), 'utf8');
            out.push({ slug: file.slice(0, -ext.length), raw, parsed: matter(raw) });
        } catch (e) { /* skip */ }
        return out;
    }, []);
}

function readFeatured() {
    try {
        const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', '_data', 'toolsFeatured.json'), 'utf8'));
        return json && typeof json === 'object' ? json : {};
    } catch (e) { return {}; }
}

// One short sentence from the description, for cards
function summarize(description) {
    const s = plain(description);
    if (!s) return '';
    const first = s.match(/^(.+?[.!?])(\s|$)/);
    if (first && first[1].length >= 30 && first[1].length <= 150) return first[1];
    if (s.length <= 140) return s;
    return s.slice(0, 135).replace(/\s+\S*$/, '') + '...';
}

module.exports = function () {
    // ---- Apps that live inside the site ----
    // A page counts when it embeds an app (it contains an iframe). The tool whose name
    // contains the page title as a whole word opens that page, so the app runs on this site.
    const embedded = readFolder('pages', '.html')
        .concat(readFolder('', '.html'))
        .filter((p) => /<iframe/i.test(p.raw) && p.parsed.data.permalink)
        .map((p) => ({
            title: text(p.parsed.data.tagTitle || p.parsed.data.metaTitle).trim(),
            url: '/' + text(p.parsed.data.permalink).replace(/^\/+|\/+$/g, '') + '/',
        }))
        .filter((p) => p.title && p.url !== '//');
    const insidePage = (name) => {
        const hit = embedded.find((p) => new RegExp('(^|[^a-z0-9])' + escapeRegExp(fold(p.title)) + '([^a-z0-9]|$)').test(fold(name)));
        return hit ? hit.url : '';
    };

    // ---- Tools ----
    const tools = readFolder('tools', '.md')
        .filter((t) => text(t.parsed.data.Name).trim())
        .map((t) => {
            const d = t.parsed.data;
            const name = text(d.Name).trim();
            const types = list(d.tags).map(text).filter((x) => x && x !== 'tools');
            const github = text(d.github).trim();
            const link = text(d.link).trim();
            const onSite = insidePage(name);
            const open = onSite || link;
            const repo = github.match(/github\.com\/([^/\s]+)\/([^/#?\s]+)/);
            const order = typeof d.order === 'number' ? d.order : null;
            return {
                slug: t.slug,
                name,
                authors: list(d.authors).map(text).filter(Boolean),
                summary: summarize(d.Description),
                image: text(d.image).trim(),
                imageAlt: text(d.imageAlt).trim(),
                types,
                typeLabel: types.join(' + '),
                topics: list(d.topics).map(text).filter(Boolean),
                github,
                open,
                onSite: !!onSite,
                // Apps inside the site open in the same tab, everything else in a new one
                external: !!open && !onSite,
                live: !!open && types.some((x) => LIVE_TYPES.indexOf(x) > -1),
                install: types.indexOf('R package') > -1 && repo ? 'devtools::install_github("' + repo[1] + '/' + repo[2].replace(/\.git$/, '') + '")' : '',
                order,
                hay: [name, list(d.authors).join(' '), plain(d.Description), types.join(' '), list(d.topics).join(' ')].join(' '),
            };
        })
        // Tools with an order come first, then the rest by name
        .sort((a, b) => (a.order === null) - (b.order === null) || (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));

    const bySlug = {};
    tools.forEach((t) => { bySlug[t.slug] = t; });

    // ---- Types, each with its own image ----
    // Screenshots are preferred over logos. An image is never used twice.
    const typeMap = {};
    tools.forEach((t) => t.types.forEach((k) => { (typeMap[k] = typeMap[k] || []).push(t); }));
    const used = new Set();
    const chosen = {};
    Object.keys(typeMap)
        .sort((a, b) => typeMap[a].length - typeMap[b].length || a.localeCompare(b))
        .forEach((k) => {
            const options = typeMap[k].filter((t) => t.image && !used.has(t.image));
            const pick = options.find((t) => !/logo/i.test(t.image)) || options[0];
            if (pick) { chosen[k] = pick.image; used.add(pick.image); }
        });
    const types = Object.keys(typeMap)
        .map((name) => ({ name, count: typeMap[name].length, image: chosen[name] || '' }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    // ---- Topics ----
    const topicCount = {};
    tools.forEach((t) => t.topics.forEach((k) => { topicCount[k] = (topicCount[k] || 0) + 1; }));
    const topics = Object.keys(topicCount)
        .map((name) => ({ name, count: topicCount[name] }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    // ---- Featured: three tools, chosen in Netlify ----
    // A pick that no longer exists is skipped. Missing slots are filled by the tools with an order, then any with an image.
    const file = readFeatured();
    const picks = Array.isArray(file.picks) ? file.picks : [];
    const featured = [];
    picks.forEach((pick) => {
        const slug = text(pick && (typeof pick === 'string' ? pick : pick.tool)).trim();
        const tool = bySlug[slug];
        if (!tool || featured.some((f) => f.slug === slug) || featured.length >= 3) return;
        featured.push(tool);
    });
    tools.filter((t) => t.image && !featured.some((f) => f.slug === t.slug)).forEach((t) => {
        if (featured.length < 3) featured.push(t);
    });

    return {
        tools,
        types,
        topics,
        featured: featured.slice(0, 3),
        featuredTitle: text(file.title).trim() || 'Featured tools and data',
        liveCount: tools.filter((t) => t.live).length,
    };
};
