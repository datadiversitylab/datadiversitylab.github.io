// Outreach items: one Markdown file per item in this folder.
// src/outreach/gis-for-community-health.md becomes /outreach/gis-for-community-health/
// and appears in the main menu under Outreach. Order, the draft switch and the menu tile (group and description) are in Netlify.
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
            parent: 'Outreach',
            order: typeof data.order === 'number' ? data.order : 500,
            // Menu tile: set "Menu group" in Netlify to show the item as a tile with a short description
            group: data.navGroup || undefined,
            desc: data.navDesc || undefined,
          },
  },
};
