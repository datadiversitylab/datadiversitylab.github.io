// The menu descriptions from Netlify (src/_data/navText.json), as a lookup by page title.
// A page with no description simply shows its title.

const data = require('./navText.json');

module.exports = function () {
    const map = {};
    (Array.isArray(data.items) ? data.items : []).forEach((i) => {
        const page = i && typeof i.page === 'string' ? i.page.trim() : '';
        const text = i && typeof i.text === 'string' ? i.text.trim() : '';
        if (page && text) { map[page] = text; }
    });
    return map;
};
