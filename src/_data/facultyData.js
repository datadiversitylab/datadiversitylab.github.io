// Data for the Teaching page, available there as `facultyData`.
// It finds the image and link of each teaching tool in the Tools and data library, by name.
// Nothing is maintained by hand, and a missing or odd value never stops the build.

const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

module.exports = function () {
    let tools = [];
    try { tools = require('./toolsData.js')().tools || []; } catch (e) { tools = []; }
    const toolsByName = {};
    tools.forEach((t) => {
        toolsByName[text(t.name).toLowerCase()] = { image: text(t.image), imageAlt: text(t.imageAlt), types: text(t.typeLabel) };
    });
    return { toolsByName };
};
