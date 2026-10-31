// Settings shared by every page in the lab wiki (this folder and all folders inside it).
// The folder path is the page address: src/wiki/lab-manual/authorship/index.md
// becomes /lab-manual/authorship/. The first folder is the section (see src/_data/wikiSections.json).
const wikiPath = (data) =>
  data.page.filePathStem.replace(/^(\/src)?\/wiki\/?/, '').replace(/\/?index$/, '');

// The "Lab manual" item in the main menu opens this page.
const MANUAL_START = 'lab-manual/about-the-lab';

module.exports = {
  layout: 'wiki-page.html',
  tags: ['wiki'],
  preloadImg: '',
  preloadCSS: '/css/wiki.css',
  preloadJS: '/js/wiki.js',
  eleventyComputed: {
    permalink: (data) => `${wikiPath(data)}/`,
    wikiPath,
    wikiGroup: (data) => wikiPath(data).split('/')[0],
    wikiParent: (data) => {
      const parts = wikiPath(data).split('/');
      return parts.length > 2 ? parts.slice(0, -1).join('/') : '';
    },
    wikiDepth: (data) => wikiPath(data).split('/').length - 1,
    wikiTrail: (data) => {
      const parts = wikiPath(data).split('/');
      return parts.map((_, i) => parts.slice(0, i + 1).join('/'));
    },
    wikiOrder: (data) => (typeof data.order === 'number' ? data.order : 999),
    metaTitle: (data) => data.title,
    tagTitle: (data) => data.title,
    description: (data) => data.summary || `${data.title}, from the Data Diversity Lab manual`,
    eleventyNavigation: (data) =>
      wikiPath(data) === MANUAL_START ? { key: 'Lab manual', parent: 'The Lab', order: 200 } : undefined,
  },
};
