// Photos for the Overview carousel and the top of Join us, available as `labData`.
// The photos are picked in Netlify (Lab photos) from the events in src/socials.
// A missing event is skipped. If no Join us photos are picked, the newest social events with a photo are used.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

function readPicks() {
    try {
        const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', '_data', 'labPhotos.json'), 'utf8'));
        return json && typeof json === 'object' ? json : {};
    } catch (e) { return {}; }
}

// Netlify can save a slightly different slug than the file name, for example with a dash where an
// apostrophe or an exclamation mark was. So events are matched on letters and numbers only,
// by file name first and by title second.
const norm = (s) => text(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\.md$/, '').replace(/[^a-z0-9]/g, '');

function readEvents() {
    const events = { byFile: {}, byTitle: {}, all: [] };
    const dir = path.join(process.cwd(), 'src', 'socials');
    const byFile = events.byFile;
    const byTitle = events.byTitle;
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return events; }
    files.forEach((file) => {
        try {
            const d = matter(fs.readFileSync(path.join(dir, file), 'utf8')).data;
            const image = list(d.images).map(text).map((x) => x.trim()).filter(Boolean)[0];
            if (!image) { return; }
            const tags = list(d.tags).map((x) => text(x).toLowerCase());
            const event = {
                image,
                // Titles often start with the year, which is shown next to the title anyway
                title: text(d.publicationTitle).trim().replace(/^\d{4}\s+/, ''),
                year: text(list(d.publicationDate)[0]).trim(),
                social: tags.indexOf('social') > -1 && !/screenshot|mug|flyer|poster/i.test(image + ' ' + file)
            };
            events.all.push(event);
            byFile[norm(file)] = event;
            if (!byTitle[norm(d.publicationTitle)]) { byTitle[norm(d.publicationTitle)] = event; }
        } catch (e) { /* skip */ }
    });
    return events;
}

function build(picks, max, events) {
    return list(picks).slice(0, max).map((p) => {
        const key = norm(p && p.event);
        const e = key && (events.byFile[key] || events.byTitle[key]);
        if (!e) {
            if (key) { console.warn('[labData] No event with a photo found for "' + p.event + '"'); }
            return null;
        }
        return {
            image: e.image,
            title: e.title,
            year: e.year,
            caption: text(p.caption).trim()
        };
    }).filter(Boolean);
}

// Newest social events first, one photo each
function newestSocial(events, max) {
    return events.all
        .filter((e) => e.social)
        .sort((a, b) => text(b.year).localeCompare(text(a.year)))
        .slice(0, max)
        .map((e) => ({ image: e.image, title: e.title, year: e.year, caption: '' }));
}

module.exports = function () {
    const picks = readPicks();
    const events = readEvents();
    const join = build(picks.join, 5, events);
    return {
        overview: build(picks.overview, 8, events),
        join: join.length ? join : newestSocial(events, 5)
    };
};
