// Data for the In the news page, available there as `pressData`.
// It reads the files in src/inthenews, so nothing is maintained by hand and nothing new is needed in Netlify.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SEASONS = { winter: 1, spring: 2, summer: 3, fall: 4 };

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const plain = (s) => text(s)
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const fold = (s) => text(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '...');

module.exports = function () {
    const dir = path.join(process.cwd(), 'src', 'inthenews');
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return { stories: [] }; }

    // ---- Stories, newest first ----
    const items = files.reduce((out, file) => {
        try {
            const d = matter(fs.readFileSync(path.join(dir, file), 'utf8')).data || {};
            const title = plain(d.newsTitle);
            const year = parseInt(list(d.tags).map(text).find((t) => /^\d{4}$/.test(t)), 10);
            if (!title || !year) return out;
            const season = text(d.newsDate).trim();
            const link = text(d.link).trim();
            const document = text(d.document).trim();
            const desc = plain(d.newsDesc);
            const images = list(d.images).map(text).map((s) => s.trim()).filter(Boolean);
            out.push({
                title,
                titleKey: fold(title),
                outlet: plain(d.Outlet),
                year,
                season,
                when: [season, year].filter(Boolean).join(' '),
                rank: year * 10 + (SEASONS[season.toLowerCase()] || 0),
                desc,
                descShort: clip(desc, 130),
                descLead: clip(desc, 230),
                link,
                open: link || document,
                openLabel: link ? 'Read the story' : 'Open the document',
                images,
                image: images[0] || '',
                imageAlt: plain(d.imageAlt),
                hay: [title, plain(d.Outlet), desc].join(' '),
            });
        } catch (e) { /* skip a file that cannot be read */ }
        return out;
    }, []).sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title));
    if (!items.length) return { stories: [] };

    // ---- Years ----
    const years = [];
    items.forEach((i) => {
        const last = years[years.length - 1];
        if (last && last.year === i.year) last.count++;
        else years.push({ year: i.year, count: 1 });
    });

    // ---- Outlets, most frequent first ----
    const outletMap = {};
    items.forEach((i) => {
        const key = fold(i.outlet);
        if (!key) return;
        if (!outletMap[key]) outletMap[key] = { name: i.outlet, count: 0 };
        outletMap[key].count++;
    });
    const outlets = Object.keys(outletMap).map((k) => outletMap[k]).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const SHOWN = 22;
    const wall = outlets.slice(0, SHOWN).map((o, n) => ({ name: o.name, big: n < 6 }));

    // ---- Latest story with a photo ----
    const lead = items.find((i) => i.image) || null;

    // ---- Most covered story: the same headline in at least three outlets ----
    const groups = {};
    items.forEach((i) => { (groups[i.titleKey] = groups[i.titleKey] || []).push(i); });
    let most = null;
    Object.keys(groups).forEach((k) => {
        const seen = {};
        const distinct = groups[k].filter((i) => i.outlet && !seen[fold(i.outlet)] && (seen[fold(i.outlet)] = true));
        if (distinct.length >= 3 && (!most || distinct.length > most.count)) {
            most = { title: groups[k][0].title, count: distinct.length, outlets: distinct.map((i) => ({ name: i.outlet, link: i.link })) };
        }
    });

    return {
        stories: items,
        years,
        stats: { stories: items.length, outlets: outlets.length, since: years[years.length - 1].year },
        wall,
        moreOutlets: Math.max(0, outlets.length - SHOWN),
        lead,
        most,
    };
};
