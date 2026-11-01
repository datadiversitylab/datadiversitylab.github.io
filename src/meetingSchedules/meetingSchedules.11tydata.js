// Lab meeting schedules: one file per semester. They are not pages on their own,
// the Lab meetings page shows them with a semester picker.
// Dates, people, types and "no meeting" rows are worked out here, so nothing is maintained by hand.
// A missing or odd value never stops the build.

const RANK = { Spring: 1, Summer: 2, Fall: 3 };
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
// Eleventy hands computed data over in a proxy. A plain copy avoids errors when arrays and objects are read.
const plain = (v) => { try { return v == null ? [] : JSON.parse(JSON.stringify(v)); } catch (e) { return []; } };
const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const clean = (v) => text(v).replace(/\s+/g, ' ').trim();
const fold = (s) => text(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const norm = (s) => fold(s).replace(/[^a-z]+/g, ' ').trim();
const day = (d) => (d instanceof Date ? d.toISOString() : text(d)).slice(0, 10);

const GROUP = /^(all|everyone|everybody|the lab|team|lab)$/i;
const UNKNOWN = /^(tbd|tba|to be announced|\?)$/i;
const OFF = /\bno (lab )?(meeting|class)|cancel+ed|holiday|\bbreak\b|n\/a/i;

const fmt = (iso, opts) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', Object.assign({ timeZone: 'UTC' }, opts));

const kindLabel = (k) => { const s = clean(k); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; };
const kindSlug = (k) => fold(k).replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

const linkLabel = (url) => {
    const u = fold(url);
    if (!u) return '';
    if (/doi\.org|arxiv|biorxiv|nature\.com|science\.org|wiley|springer|elsevier|plos|pnas|oup\.com|sciencedirect/.test(u)) return 'Paper';
    if (/nextcloud|drive\.google|docs\.google|dropbox|onedrive|sharepoint|box\.com/.test(u)) return 'Slides or files';
    if (/events?\.|trellis|eventbrite|calendar/.test(u)) return 'Event details';
    return 'Link';
};

// Finds the person in Team from the name written in the schedule ("Cristian", "Kiran Basava")
const seenNames = {};
let teamCache = null;
let teamTime = 0;
const loadTeam = () => {
    if (!teamCache || Date.now() - teamTime > 5000) {
        try { teamCache = require('../_data/teamData.js')(); } catch (e) { teamCache = { people: [] }; }
        teamTime = Date.now();
    }
    return teamCache;
};
const finder = (team) => {
    const people = list(team && team.people);
    const forms = people.map((p) => ({
        p,
        sets: [p.name].concat(list(p.variants)).map((n) => norm(n).split(' ').filter(Boolean))
    }));
    return (name) => {
        const q = norm(name).replace(/^(dr|prof|professor) /, '').split(' ').filter(Boolean);
        if (!q.length) return null;
        const hits = forms.filter((f) => f.sets.some((tokens) => q.every((t) => tokens.indexOf(t) > -1)));
        if (hits.length === 1) return hits[0].p;
        const current = hits.filter((f) => f.p.status === 'current');
        if (current.length === 1) return current[0].p;
        return null;
    };
};

module.exports = {
    tags: ['meetingSchedules'],
    permalink: false,
    eleventyComputed: {
        scheduleKey: (data) => data.scheduleYear * 10 + (RANK[data.semester] || 0),
        slug: (data) => data.scheduleYear + '-' + fold(data.semester),
        label: (data) => clean(data.semester + ' ' + data.scheduleYear),
        info: (data) => {
            const d = clean(data.meetingDay);
            const when = [d ? d + 's' : '', clean(data.meetingTime) ? (d ? 'at ' : '') + clean(data.meetingTime) : ''].filter(Boolean).join(' ');
            const place = clean(data.meetingPlace);
            const note = clean(data.meetingInfo);
            // Older schedules only have one free text line
            return when || place ? { when, place, note } : { when: note, place: '', note: '' };
        },
        rows: (data) => {
            const find = finder(loadTeam());
            return plain(data.meetings)
                .map((m) => {
                    const iso = day(m.date);
                    const led = clean(m.ledBy);
                    const activity = clean(m.activity);
                    const off = OFF.test(led) || OFF.test(activity);
                    let who = { type: 'none', text: '' };
                    let person = null;
                    if (!off && led && !/^n\/?a$/i.test(led)) {
                        if (GROUP.test(led)) who = { type: 'group', text: 'Everyone' };
                        else if (UNKNOWN.test(led)) who = { type: 'unknown', text: 'To be announced' };
                        else {
                            const p = find(led);
                            if (p) {
                                person = { name: p.name, url: p.url, image: p.image, imageAlt: p.imageAlt };
                                who = { type: 'person', text: p.name };
                            } else {
                                who = { type: 'text', text: led };
                                if (!seenNames[led] && /^[A-Za-z.'’ -]{2,40}$/.test(led) && led.split(' ').length <= 3) { seenNames[led] = true; console.log('[meetings] No profile on Team for "' + led + '", shown as text.'); }
                            }
                        }
                    }
                    return {
                        iso,
                        month: iso ? fmt(iso, { month: 'short' }) : '',
                        dayNum: iso ? Number(iso.slice(8, 10)) : '',
                        weekday: iso ? fmt(iso, { weekday: 'short' }) : '',
                        long: iso ? fmt(iso, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
                        activity,
                        led,
                        off,
                        who,
                        person,
                        kind: kindLabel(m.kind),
                        kindSlug: kindSlug(m.kind),
                        link: clean(m.link),
                        linkLabel: linkLabel(m.link)
                    };
                })
                .filter((r) => r.iso)
                .sort((a, b) => a.iso.localeCompare(b.iso));
        },
        first: (data) => { const d = plain(data.meetings).map((m) => day(m.date)).filter(Boolean).sort(); return d[0] || ''; },
        last: (data) => { const d = plain(data.meetings).map((m) => day(m.date)).filter(Boolean).sort(); return d[d.length - 1] || ''; }
    }
};
