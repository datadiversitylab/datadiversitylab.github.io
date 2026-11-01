// Data for the Lab news page, available there as `newsData`.
// It reads the files in src/news, so nothing is maintained by hand and nothing new is needed in Netlify.
// Each season becomes a card and each bullet becomes one update. A season without bullets becomes one update.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SEASONS = { Winter: 1, Spring: 2, Summer: 3, Fall: 4 };

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

let renderer = null;
try { renderer = new (require('markdown-it'))({ html: true, linkify: true }); } catch (e) { renderer = null; }

const escapeHtml = (s) => text(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (html) => text(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

// One markdown chunk to HTML. A bullet is rendered as a list and only the inside of the item is kept.
function renderBullet(chunk) {
    if (!renderer) return '<p>' + escapeHtml(chunk.replace(/^[*-]\s+/, '')) + '</p>';
    try {
        const html = renderer.render(chunk);
        const start = html.indexOf('<li>');
        const end = html.lastIndexOf('</li>');
        return start > -1 && end > start ? html.slice(start + 4, end).trim() : html.trim();
    } catch (e) { return escapeHtml(chunk); }
}

// The body is split at every top level bullet. Indented lines stay with the bullet above them.
function splitItems(body) {
    const lines = text(body).replace(/\r/g, '').split('\n');
    const chunks = [];
    lines.forEach((line) => {
        if (/^[*-]\s+/.test(line)) chunks.push(line);
        else if (chunks.length && line.trim() && /^\s/.test(line)) chunks[chunks.length - 1] += '\n' + line;
        else if (chunks.length && !line.trim()) chunks[chunks.length - 1] += '\n';
    });
    if (chunks.length) return chunks.map(renderBullet).filter((h) => plain(h));
    const whole = text(body).trim();
    if (!whole) return [];
    return [renderer ? renderer.render(whole).trim() : '<p>' + escapeHtml(whole) + '</p>'];
}

module.exports = function () {
    const dir = path.join(process.cwd(), 'src', 'news');
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return { years: [], total: 0, newest: 0 }; }

    // One card for each year and season, even if two files share them
    const cards = {};
    files.forEach((file) => {
        try {
            const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
            const name = text(parsed.data.Name).trim();
            const year = parseInt(list(parsed.data.tags).map(text).find((t) => /^\d{4}$/.test(t)), 10);
            if (!name || !year) return;
            const key = year + '|' + name.toLowerCase();
            const items = splitItems(parsed.content).map((html) => ({ html, text: plain(html) }));
            if (!items.length) return;
            if (!cards[key]) cards[key] = { year, name, rank: SEASONS[name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()] || 0, items: [] };
            cards[key].items = cards[key].items.concat(items);
        } catch (e) { /* skip a file that cannot be read */ }
    });

    // Newest year first. Inside a year, Fall comes before Summer and Spring.
    const years = [];
    Object.keys(cards)
        .map((k) => cards[k])
        .sort((a, b) => b.year - a.year || b.rank - a.rank || a.name.localeCompare(b.name))
        .forEach((card) => {
            let group = years[years.length - 1];
            if (!group || group.year !== card.year) { group = { year: card.year, count: 0, seasons: [] }; years.push(group); }
            group.seasons.push({ name: card.name, count: card.items.length, updates: card.items });
            group.count += card.items.length;
        });

    return {
        years,
        total: years.reduce((n, y) => n + y.count, 0),
        newest: years.length ? years[0].year : 0,
    };
};
