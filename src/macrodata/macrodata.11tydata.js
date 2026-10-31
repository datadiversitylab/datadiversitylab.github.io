// Settings shared by every page in src/macrodata (the MacroData section under Outreach).
// The file name is the address: src/macrodata/fechas.md becomes /macrodata/fechas/.
// index.md is the MacroData home page, /macrodata/. Its menu entry (parent, order) is in the front matter of index.md.
const slug = (data) => data.page.filePathStem.replace(/^(\/src)?\/macrodata\/?/, '');

module.exports = {
  layout: 'macrodata-page.html',
  tags: ['macrodata'],
  preloadImg: '',
  preloadCSS: '/css/macrodata.css',
  preloadJS: '/js/macrodata.js',
  eleventyComputed: {
    mdSlug: slug,
    permalink: (data) => (slug(data) === 'index' ? 'macrodata/' : `macrodata/${slug(data)}/`),
    mdOrder: (data) => (typeof data.order === 'number' ? data.order : 999),
    mdLabel: (data) => data.menuLabel || data.title,
    metaTitle: (data) => (slug(data) === 'index' ? 'MacroData' : `${data.title} | MacroData`),
    tagTitle: (data) => data.title,
    description: (data) => data.subtitle || 'MacroData, cursos y recursos en macroevolución y ciencia de datos',
  },
};