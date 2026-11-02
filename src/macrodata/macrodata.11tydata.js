// Settings shared by every page in src/macrodata (the MacroData section under Outreach).
// The file name is the address: src/macrodata/fechas.md becomes /macrodata/fechas/.
// index.md is the MacroData home page, /macrodata/. Its menu entry (parent, order) is in the front matter of index.md.
// The menu (order, groups, short descriptions) is in src/_data/macrodataMenu.json (MacroData > Data and settings > Menu).
// The home page text, the applications switch and the forms are in src/_data/macrodataSettings.json.
const settings = require('../_data/macrodataSettings.json');
const menu = require('../_data/macrodataMenu.json');
const slug = (data) => data.page.filePathStem.replace(/^(\/src)?\/macrodata\/?/, '');

// The menu group a page sits in
const place = (s) => {
  for (const item of menu.items) {
    if (item.children) {
      if (item.children.some((c) => c.slug === s)) return { group: item.label };
    } else if (item.slug === s) {
      return { group: '' };
    }
  }
  return { group: '' };
};

module.exports = {
  layout: 'macrodata-page.html',
  tags: ['macrodata'],
  preloadImg: '',
  preloadCSS: '/css/macrodata.css',
  preloadJS: '/js/macrodata.js',
  eleventyComputed: {
    mdSlug: slug,
    permalink: (data) => (slug(data) === 'index' ? 'macrodata/' : `macrodata/${slug(data)}/`),
    mdGroup: (data) => place(slug(data)).group,
    metaTitle: (data) => (slug(data) === 'index' ? 'MacroData: talleres de R y métodos filogenéticos en Colombia' : `${data.title} | MacroData`),
    tagTitle: (data) => (slug(data) === 'index' ? 'MacroData: talleres de R y métodos filogenéticos en Colombia' : data.title),
    description: (data) => (slug(data) === 'index' ? settings.seoDescription : data.seoDescription || data.subtitle || 'MacroData, talleres y recursos en macroevolución y ciencia de datos'),
  },
};
