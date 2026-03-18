const map = L.map('map').setView([-33.9249, 18.4241], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let currentRouteLayer = null;
let startMarker = null;
let destMarker = null;


async function geocodeAddress(address) {
    const query = `${address}, South Africa`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
            return { 
                lat: parseFloat(data[0].lat), 
                lng: parseFloat(data[0].lon), 
                name: data[0].display_name.split(',')[0] 
        }
        return null;
    } catch (error) {
        console.error("Geocoding failed:", error);
        return null;
    }
}

function calculateRoute(startLat, startLng, destLat, destLng, startName, destName) {
    const routingUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    fetch(routingUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code !== "Ok") {
                alert("Could not find a driving route between these locations.");
                return;
            }

            const routeLine = data.routes[0].geometry;
            const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
            const durationMins = Math.round(data.routes[0].duration / 60);

            if (currentRouteLayer) map.removeLayer(currentRouteLayer);
            if (startMarker) map.removeLayer(startMarker);
            if (destMarker) map.removeLayer(destMarker);

            currentRouteLayer = L.geoJSON(routeLine, {
                style: { color: "#2680eb", weight: 5, opacity: 0.8 }
            }).addTo(map);

            startMarker = L.marker([startLat, startLng]).addTo(map);
            startMarker.bindPopup(`<b>Start:</b> ${startName}`);

            destMarker = L.marker([destLat, destLng]).addTo(map);
            destMarker.bindPopup(`<b>Destination:</b> ${destName}`).openPopup();

            document.getElementById('distance-display').textContent = `${distanceKm} km`;
            document.getElementById('time-display').textContent = `${durationMins} mins`;
            document.getElementById('destination-title').textContent = `📍 ${startName} to ${destName}`;

            map.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
        })
        .catch(error => console.error("Routing error:", error));
}

document.getElementById('search-btn').addEventListener('click', async function() {
    const startInput = document.getElementById('start-location').value;
    const endInput = document.getElementById('end-location').value;
    const btn = document.getElementById('search-btn');

    if (!startInput || !endInput) {
        alert("Please enter both a starting location and a destination!");
        return;
    }

    btn.textContent = "Searching Satellite... 🛰️";

    const startData = await geocodeAddress(startInput);
    const endData = await geocodeAddress(endInput);

    if (startData && endData) {
        calculateRoute(startData.lat, startData.lng, endData.lat, endData.lng, startData.name, endData.name);
    } else {
        alert("Could not locate one of those addresses. Try adding 'Cape Town' to your search!");
    }

    btn.textContent = "Calculate Route";
});

calculateRoute(-33.8943, 18.6294, -33.9249, 18.4241, "Bellville", "Cape Town CBD");