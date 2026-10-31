// MacroData: map of the workshops (home page) and the menu on phones.
document.addEventListener('DOMContentLoaded', function () {
    // On phones the menu scrolls sideways, so bring the current page into view
    var current = document.querySelector('.md-menu li.is-current');
    if (current && current.scrollIntoView) {
        try { current.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
    }

    var mapBox = document.getElementById('md-map');
    var data = document.getElementById('md-events');
    if (!mapBox || !data) return;

    var events = [];
    try { events = JSON.parse(data.textContent); } catch (e) { return; }

    // Leaflet is loaded only on the page that has a map
    function load(tag, attrs) {
        return new Promise(function (resolve, reject) {
            var el = document.createElement(tag);
            Object.keys(attrs).forEach(function (k) { el[k] = attrs[k]; });
            el.onload = resolve;
            el.onerror = reject;
            document.head.appendChild(el);
        });
    }

    var base = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.';
    load('link', { rel: 'stylesheet', href: base + 'min.css' })
        .then(function () { return load('script', { src: base + 'min.js' }); })
        .then(function () {
            var dark = getComputedStyle(document.documentElement).getPropertyValue('--headerColor').trim() || '#2b3a32';
            var colors = { completado: dark, activo: '#2e8b57', proximo: '#bbbbbb' };
            var labels = { completado: 'Completado', activo: 'En curso', proximo: 'Próximo' };

            var map = L.map(mapBox, { center: [5.5, -74.0], zoom: 5, scrollWheelZoom: false });
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);

            events.forEach(function (ev) {
                if (typeof ev.lat !== 'number' || typeof ev.lng !== 'number') return;
                var popup = document.createElement('div');
                var name = document.createElement('strong');
                name.textContent = ev.name;
                var line = document.createElement('div');
                line.textContent = ev.city + ' · ' + ev.dates;
                var status = document.createElement('small');
                status.textContent = labels[ev.status] || ev.status;
                popup.appendChild(name);
                popup.appendChild(line);
                popup.appendChild(status);

                L.circleMarker([ev.lat, ev.lng], {
                    radius: 11,
                    fillColor: colors[ev.status] || dark,
                    color: '#fff',
                    weight: 2.5,
                    opacity: 1,
                    fillOpacity: 0.88
                }).addTo(map).bindPopup(popup, { maxWidth: 220 });
            });
        })
        .catch(function () {
            mapBox.textContent = 'No se pudo cargar el mapa.';
        });
});
