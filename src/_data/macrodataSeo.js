// Search engine markup for the MacroData home page (schema.org Course with one Event per workshop).
const events = require('./macrodataEvents.json').events || [];
const settings = require('./macrodataSettings.json');

const MONTHS = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const pad = (n) => String(n).padStart(2, '0');

// "Julio 21–22, 2026" -> ["2026-07-21", "2026-07-22"]
function parseDates(text) {
  const m = String(text || '').toLowerCase().match(/([a-záéíóú]+)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),?\s*(\d{4})/);
  if (!m || !MONTHS[m[1]]) return null;
  const base = `${m[4]}-${pad(MONTHS[m[1]])}-`;
  return [base + pad(m[2]), base + pad(m[3])];
}

const provider = { '@type': 'Organization', name: 'Data Diversity Lab, University of Arizona', url: 'https://datadiversitylab.github.io/' };
const data = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'MacroData',
  description: settings.seoDescription,
  inLanguage: 'es',
  provider,
  funder: { '@type': 'Organization', name: 'National Geographic Society' },
  hasCourseInstance: events.map((e) => {
    const d = parseDates(e.dates);
    const inst = {
      '@type': 'CourseInstance',
      name: `MacroData en ${e.name}`,
      courseMode: 'onsite',
      inLanguage: 'es',
      location: { '@type': 'Place', name: e.name, address: { '@type': 'PostalAddress', addressLocality: e.city, addressCountry: 'CO' } },
    };
    if (d) { inst.startDate = d[0]; inst.endDate = d[1]; }
    return inst;
  }),
};

module.exports = { jsonLd: JSON.stringify(data).replace(/</g, '\\u003c') };
