// Data for the Grants page, available there as `grantsData`.
// It reads src/grants. A grant is active when its end year is this year or later.
// The role is PI, Co-PI or Collaborator, found by looking for OWNER in the PI and Co-PI fields.
// Roles are always ordered PI, then Co-PI, then Collaborator.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const OWNER = 'roman-palacios';
const ROLES = ['PI', 'Co-PI', 'Collaborator'];

const list = (v) => [].concat(v || []);
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const fold = (s) => text(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const urlSlug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
const mine = (s) => fold(s).indexOf(OWNER) > -1;

function readGrants() {
    const dir = path.join(process.cwd(), 'src', 'grants');
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return []; }
    return files.reduce((out, file) => {
        try {
            out.push(matter(fs.readFileSync(path.join(dir, file), 'utf8')).data);
        } catch (e) { /* skip */ }
        return out;
    }, []);
}

// Start and end year come from their own fields. The old Years text is used if they are empty.
function years(d) {
    let start = parseInt(d.startYear, 10);
    let end = parseInt(d.endYear, 10);
    const old = text(d.grantYears).match(/\d{4}/g) || [];
    if (!start && old.length) { start = parseInt(old[0], 10); }
    if (!end && old.length) { end = parseInt(old[old.length - 1], 10); }
    if (!start && end) { start = end; }
    if (!end && start) { end = start; }
    return { start: start || 0, end: end || 0 };
}

function role(d) {
    if (mine(d.pi)) { return 'PI'; }
    if (list(d.copi).some(mine)) { return 'Co-PI'; }
    return 'Collaborator';
}

function compare(a, b) {
    return (ROLES.indexOf(a.role) - ROLES.indexOf(b.role)) || (b.end - a.end) || (b.start - a.start) || a.name.localeCompare(b.name);
}

module.exports = function () {
    const now = new Date().getFullYear();

    const grants = readGrants().filter((d) => text(d.grantName).trim()).map((d) => {
        const y = years(d);
        const funder = list(d.tags).map(text).filter(Boolean)[0] || '';
        return {
            name: text(d.grantName).trim(),
            slug: urlSlug(d.grantName),
            funder,
            start: y.start,
            end: y.end,
            period: !y.start ? '' : y.start === y.end ? String(y.start) : y.start + ' to ' + y.end,
            active: y.end >= now,
            role: role(d),
            amount: text(d.grantAmount).trim(),
            subaward: text(d.subawardAmount).trim(),
            pi: text(d.pi).trim(),
            copi: list(d.copi).map((s) => text(s).trim()).filter(Boolean),
            team: list(d.team).map((s) => text(s).trim()).filter(Boolean),
            desc: text(d.grantDesc).trim(),
            topics: list(d.topics).map((s) => text(s).trim()).filter(Boolean),
            image: text(d.image).trim(),
            imageAlt: text(d.imageAlt).trim(),
            link: text(d.link).trim(),
            document: text(d.document).trim()
        };
    }).sort(compare);

    const funders = {};
    grants.forEach((g) => { if (g.funder) { funders[g.funder] = (funders[g.funder] || 0) + 1; } });

    return {
        year: now,
        active: grants.filter((g) => g.active),
        past: grants.filter((g) => !g.active),
        all: grants,
        total: grants.length,
        roles: ROLES.map((r) => ({ name: r, count: grants.filter((g) => g.role === r).length })),
        funders: Object.keys(funders)
            .sort((a, b) => (funders[b] - funders[a]) || a.localeCompare(b))
            .map((name) => ({ name, count: funders[name] }))
    };
};
