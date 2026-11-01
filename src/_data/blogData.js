// Data for the Blog page and for every post, available as `blogData`.
// It reads src/blog. Reading time, newer and older posts, and related posts are worked out here.
// Nothing is maintained by hand, and a missing or odd value never stops the build.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clean = (v) => text(v).replace(/\s+/g, ' ').trim();
const fold = (s) => text(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Plain text from markdown, for counting words and for search
const plain = (s) => text(s)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>|~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const dateOf = (v) => {
    const d = v instanceof Date ? v : new Date(text(v));
    return isNaN(d.getTime()) ? null : d;
};
const label = (d, long) => (d ? d.toLocaleDateString('en-US', long ? { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' } : { year: 'numeric', month: 'long', timeZone: 'UTC' }) : '');

module.exports = function () {
    const dir = path.join(process.cwd(), 'src', 'blog');
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { files = []; }

    const posts = files.reduce((out, file) => {
        try {
            const m = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
            const d = m.data || {};
            if (!clean(d.title)) return out;
            const stem = file.replace(/\.md$/, '');
            const body = plain(m.content);
            const words = body ? body.split(' ').length : 0;
            const date = dateOf(d.date);
            const tags = list(d.tags).map(clean).filter((t) => t && t.toLowerCase() !== 'blog');
            out.push({
                key: '/blog/' + stem,
                url: '/blog/' + stem + '/',
                title: clean(d.title),
                description: clean(d.description),
                author: clean(d.author),
                image: clean(d.image),
                tags,
                time: date ? date.getTime() : 0,
                dateLabel: label(date, false),
                dateLong: label(date, true),
                minutes: Math.max(1, Math.ceil(words / 200)),
                hay: fold([d.title, d.description, d.author, tags.join(' '), body.slice(0, 4000)].join(' '))
            });
        } catch (e) { /* skip */ }
        return out;
    }, []).sort((a, b) => (b.time - a.time) || a.title.localeCompare(b.title));

    // Newer and older posts, and up to three on the same topic
    const brief = (p) => ({ url: p.url, title: p.title, dateLabel: p.dateLabel });
    posts.forEach((p, i) => {
        p.newer = i > 0 ? brief(posts[i - 1]) : null;
        p.older = i < posts.length - 1 ? brief(posts[i + 1]) : null;
        p.related = posts
            .filter((o) => o !== p)
            .map((o) => ({ o, shared: o.tags.filter((t) => p.tags.indexOf(t) > -1).length }))
            .filter((x) => x.shared > 0)
            .sort((a, b) => (b.shared - a.shared) || (b.o.time - a.o.time))
            .slice(0, 3)
            .map((x) => brief(x.o));
    });

    const byKey = {};
    posts.forEach((p) => { byKey[p.key] = p; });

    const count = {};
    posts.forEach((p) => p.tags.forEach((t) => { count[t] = (count[t] || 0) + 1; }));
    const tags = Object.keys(count)
        .map((name) => ({ name, count: count[name] }))
        .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));

    return { posts, byKey, tags, total: posts.length };
};
