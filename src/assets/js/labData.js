// Photos for the Overview carousel and the top of Join us, available as `labData`.
// The photos are picked in Netlify (Lab photos) from the events in src/socials.
// Nothing is chosen automatically. A missing event is skipped, and an empty list hides the section.

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

function readEvent(slug) {
    const name = text(slug).trim().replace(/\.md$/, '');
    if (!name) { return null; }
    try {
        const d = matter(fs.readFileSync(path.join(process.cwd(), 'src', 'socials', name + '.md'), 'utf8')).data;
        const image = list(d.images).map(text).filter(Boolean)[0];
        if (!image) { return null; }
        return {
            image,
            // Titles often start with the year, which is shown next to the title anyway
            title: text(d.publicationTitle).trim().replace(/^\d{4}\s+/, ''),
            year: text(list(d.publicationDate)[0]).trim()
        };
    } catch (e) { return null; }
}

function build(picks, max) {
    return list(picks).slice(0, max).map((p) => {
        const e = readEvent(p && p.event);
        if (!e) { return null; }
        return {
            image: e.image,
            title: e.title,
            year: e.year,
            caption: text(p.caption).trim()
        };
    }).filter(Boolean);
}

module.exports = function () {
    const picks = readPicks();
    return {
        overview: build(picks.overview, 8),
        join: build(picks.join, 3)
    };
};
