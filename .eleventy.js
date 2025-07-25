// imports for the various eleventy plugins (navigation & image)
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const { DateTime } = require('luxon');
const Image = require('@11ty/eleventy-img');
const path = require('path');
const util = require('util');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
// allows the use of {% image... %} to create responsive, optimised images
// CHANGE DEFAULT MEDIA QUERIES AND WIDTHS
async function imageShortcode(src, alt, className, loading, sizes = '(max-width: 600px) 400px, 850px, 1920px') {
  // don't pass an alt? chuck it out. passing an empty string is okay though
  if (alt === undefined) {
    throw new Error(`Missing \`alt\` on responsiveimage from: ${src}`);
  }

  // create the metadata for an optimised image
  let metadata = await Image(`${src}`, {
    widths: [200, 400, 850, 1920, 2500],
    formats: ['webp', 'jpeg'],
    urlPath: '/images/',
    outputDir: './public/images',
    filenameFormat: function (id, src, width, format, options) {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
      return `${name}-${width}w.${format}`;
    },
  });

  // get the smallest and biggest image for picture/image attributes
  let lowsrc = metadata.jpeg[0];
  let highsrc = metadata.jpeg[metadata.jpeg.length - 1];

  // when {% image ... %} is used, this is what's returned
  return `<picture class="${className}">
    ${Object.values(metadata)
      .map((imageFormat) => {
        return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat
          .map((entry) => entry.srcset)
          .join(', ')}" sizes="${sizes}">`;
      })
      .join('\n')}
      <img
        src="${lowsrc.url}"
        width="${highsrc.width}"
        height="${highsrc.height}"
        alt="${alt}"
        loading="${loading}"
        decoding="async">
    </picture>`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter('markdown', function(value) {
    return md.render(value);
  });
  // adds the navigation plugin for easy navs
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  eleventyConfig.addFilter('split', function(value, separator) {
    return value.split(separator);
  });

  eleventyConfig.addFilter('sortMulti', function(arr, primaryAttr, primaryAsc = true, secondaryAttr, secondaryAsc = true) {
    return arr.slice().sort(function(a, b) {
        if (primaryAsc) {
          if (a.data[primaryAttr] > b.data[primaryAttr]) return -1;
          if (a.data[primaryAttr] < b.data[primaryAttr]) return 1;
        } else {
          if (a.data[primaryAttr] > b.data[primaryAttr]) return 1;
          if (a.data[primaryAttr] < b.data[primaryAttr]) return -1;
        }

        if (secondaryAsc) {
          if (a.data[secondaryAttr] < b.data[secondaryAttr]) return -1;
          if (a.data[secondaryAttr] > b.data[secondaryAttr]) return 1;
        } else {
          if (a.data[secondaryAttr] > b.data[secondaryAttr]) return 1;
          if (a.data[secondaryAttr] < b.data[secondaryAttr]) return -1;
        }

        return 0;
    });
  });

  eleventyConfig.addFilter('highlightAuthors', function(publicationAuthor, team) {
    // Check that team is defined and is an array
    if (!Array.isArray(team)) {
      return publicationAuthor; // Return the original publicationAuthor if team is not valid
    }

    // Extract memberName from each team member and convert to lower case for case-insensitive comparison
    const teamMemberNames = team.map(member => member.data.memberName ? member.data.memberName.toLowerCase() : '');

    const authorNames = publicationAuthor.split(',').map(name => name.trim());
    let updatedContent = ''; // Initialize empty string to accumulate new HTML content

    // Process each author name for potential matches
    authorNames.forEach((name, index) => {
        const lowerCaseName = name.toLowerCase();
        const matchingMember = teamMemberNames.find(memberName =>
            lowerCaseName.includes(memberName)
        );

        // If a matching team member is found, wrap the name in a span with style for red text
        if (matchingMember) {
            updatedContent += `<span class="cs-highlight-author">${name}</span>`;
        } else {
            updatedContent += name; // No match found, keep original name
        }

        // Add comma separator between names, except after the last name
        if (index < authorNames.length - 1) {
            updatedContent += ', ';
        }
    });

    // Update the authorElement's HTML with the new content, including styled spans
    return updatedContent;
  });

  eleventyConfig.addCollection("processedPublications", function(collection) {
    let tagCounts = {};
    const publications = collection.getFilteredByGlob("./src/publications/*.md");

    // Count occurrences of each tag
    publications.forEach(pub => {
      (pub.data.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Return the tag counts for use in templates
    return tagCounts;
  });
  
  eleventyConfig.addCollection("processedPublications1", function(collection) {
    let tagCounts = {};
    const publications = collection.getFilteredByGlob("./src/socials/*.md");

    // Count occurrences of each tag
    publications.forEach(pub => {
      (pub.data.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Return the tag counts for use in templates
    return tagCounts;
  });

  eleventyConfig.addCollection("processedPublicationsJournalTypes", function(collection) {
    let journalTypes = {};
    const publications = collection.getFilteredByGlob("./src/publications/*.md");

    // Count occurrences of each tag
    publications.forEach(pub => {
      journalTypes[pub.data.publicationType] = (journalTypes[pub.data.publicationType] || 0) + 1;
    });

    // Return the tag counts for use in templates
    return journalTypes;
  });

  eleventyConfig.addCollection("processedPublicationsJournalTypes1", function(collection) {
    let journalTypes = {};
    const publications = collection.getFilteredByGlob("./src/socials/*.md");

    // Count occurrences of each tag
    publications.forEach(pub => {
      journalTypes[pub.data.publicationType] = (journalTypes[pub.data.publicationType] || 0) + 1;
    });

    // Return the tag counts for use in templates
    return journalTypes;
  });

  eleventyConfig.addCollection("processedTeams", function(collection) {
    let tagCounts = {};
    const team = collection.getFilteredByGlob("./src/team/*.md");

    // Count occurrences of each tag
    team.forEach(pub => {
      (pub.data.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Return the tag counts for use in templates
    return tagCounts;
  });

  eleventyConfig.addFilter('console', function(value) {
    const str = util.inspect(value);
    return `<div style="white-space: pre-wrap;">${unescape(str)}</div>;`
  });

  // allows css, assets, robots.txt and CMS config files to be passed into /public
  eleventyConfig.addPassthroughCopy('./src/css/**/*.css');
  eleventyConfig.addPassthroughCopy('./src/assets');
  eleventyConfig.addPassthroughCopy('./src/admin');
  eleventyConfig.addPassthroughCopy('./src/_redirects');
  eleventyConfig.addPassthroughCopy({ './src/robots.txt': '/robots.txt' });

  // open on npm start and watch CSS files for changes - doesn't trigger 11ty rebuild
  eleventyConfig.setBrowserSyncConfig({
    open: true,
    files: './public/css/**/*.css',
  });

  // allows the {% image %} shortcode to be used for optimised iamges (in webp if possible)
  eleventyConfig.addNunjucksAsyncShortcode('image', imageShortcode);

  // normally, 11ty will render dates on blog posts in full JSDate format (Fri Dec 02 18:00:00 GMT-0600). That's ugly
  // this filter allows dates to be converted into a normal, locale format. view the docs to learn more (https://moment.github.io/luxon/api-docs/index.html#datetime)
  eleventyConfig.addFilter('postDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: "_layouts",
      output: 'public',
    },
    // allows .html files to contain nunjucks templating language
    htmlTemplateEngine: 'njk',
  };
};
