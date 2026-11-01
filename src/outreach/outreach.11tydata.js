// Outreach items: one Markdown file per item in this folder.
// src/outreach/gis-for-community-health.md becomes /outreach/gis-for-community-health/
// and appears in the main menu under News and outreach. Order and the draft switch are in Netlify.
module.exports = {
  layout: 'outreach-page.html',
  tags: ['outreach'],
  preloadImg: '',
  preloadCSS: '/css/outreach.css',
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : `outreach/${data.page.fileSlug}/`),
    metaTitle: (data) => data.title,
    tagTitle: (data) => data.title,
    description: (data) => data.subtitle || `${data.title}, Data Diversity Lab outreach`,
    eleventyNavigation: (data) =>
      data.draft
        ? undefined
        : {
            key: data.menuLabel || data.title,
            parent: 'News and outreach',
            // After Lab news, News coverage, Blog, Photos and MacroData (100 to 500). The order set in Netlify still sorts these items.
            order: 600 + (typeof data.order === 'number' ? data.order : 500) / 100,
          },
  },
};
