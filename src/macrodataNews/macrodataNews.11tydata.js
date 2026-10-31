// MacroData news: one file per item. They are listed on the MacroData pages, they are not pages on their own.
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const iso = (d) => (d instanceof Date ? d.toISOString() : String(d || '')).slice(0, 10);

module.exports = {
  tags: ['macrodataNews'],
  permalink: false,
  eleventyComputed: {
    newsKey: (data) => iso(data.date),
    dateLabel: (data) => {
      const [y, m, d] = iso(data.date).split('-').map(Number);
      return y ? `${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)} ${d}, ${y}` : '';
    },
  },
};
