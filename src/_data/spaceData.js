// Data for the Space and tech page, available there as `spaceData`.
// It reads src/space-tech and src/_data/spacePage.json.
// A missing or odd value never stops the build.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

function readJson() {
    try {
        const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', '_data', 'spacePage.json'), 'utf8'));
        return json && typeof json === 'object' ? json : {};
    } catch (e) { return {}; }
}

function readItems() {
    const dir = path.join(process.cwd(), 'src', 'space-tech');
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return []; }
    return files.reduce((out, file) => {
        try {
            const d = matter(fs.readFileSync(path.join(dir, file), 'utf8')).data;
            if (!text(d.title).trim()) { return out; }
            out.push({
                name: text(d.title).trim(),
                type: text(d.type).trim() || 'Space',
                order: parseFloat(d.order),
                desc: text(d.description).trim(),
                details: list(d.details).map((s) => text(s).trim()).filter(Boolean),
                images: list(d.images).map((s) => text(s).trim()).filter(Boolean),
                highlight: text(d.highlight).trim(),
                link: text(d.link).trim(),
                linkLabel: text(d.linkLabel).trim() || 'Learn more'
            });
        } catch (e) { /* skip */ }
        return out;
    }, []).sort((a, b) => {
        const x = isNaN(a.order) ? 999 : a.order;
        const y = isNaN(b.order) ? 999 : b.order;
        return (x - y) || a.name.localeCompare(b.name);
    });
}

module.exports = function () {
    const page = readJson();
    const items = readItems();
    return {
        intro: text(page.intro),
        address: text(page.address),
        tiles: list(page.tiles).filter((t) => t && text(t.value)).map((t) => ({ value: text(t.value), label: text(t.label) })),
        spaces: items.filter((i) => i.type === 'Space'),
        computing: items.filter((i) => i.type === 'Computing')
    };
};
