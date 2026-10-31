// Lab meeting schedules: one file per semester. They are not pages on their own,
// the wiki page "Lab meetings" shows them with a year and semester picker.
const RANK = { Spring: 1, Summer: 2, Fall: 3 };
const day = (d) => (d instanceof Date ? d.toISOString() : String(d || '')).slice(0, 10);

module.exports = {
  tags: ['meetingSchedules'],
  permalink: false,
  eleventyComputed: {
    scheduleKey: (data) => data.scheduleYear * 10 + (RANK[data.semester] || 0),
    rows: (data) =>
      (data.meetings || [])
        .map((m) => ({ ...m, date: day(m.date) }))
        .sort((a, b) => a.date.localeCompare(b.date)),
  },
};
