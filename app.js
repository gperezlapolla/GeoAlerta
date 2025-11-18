// Espera a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. INICIALIZACIÓN DEL MAPA (NUEVO) ---
    // Centramos el mapa en un punto global (zoom 2)
    const map = L.map('map').setView([20, 0], 2);

    // Añadimos la capa de "mapa" (los azulejos) de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // --- FIN DE INICIALIZACIÓN DEL MAPA ---


    // 2. Dónde vamos a poner los datos de la TABLA
    const tableBody = document.getElementById('data-output');
    
    // 3. La URL de la API de USGS (Magnitud 4.5+ del último día)
    const apiUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';

    // 4. Función para buscar y mostrar los datos
    async function fetchEarthquakeData() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue exitosa.');
            }
            const data = await response.json();
            
            tableBody.innerHTML = ''; // Limpiamos la tabla

            // 5. Recorremos cada sismo
            data.features.forEach(quake => {
                const properties = quake.properties;
                const geometry = quake.geometry;
                
                // --- LÓGICA DE LA TABLA (Igual que antes) ---
                const row = document.createElement('tr');
                const localTime = new Date(properties.time).toLocaleString('es-CL', {
                    dateStyle: 'short',
                    timeStyle: 'medium'
                });
                row.innerHTML = `
                    <td><strong>${properties.mag.toFixed(1)}</strong></td> 
                    <td>${properties.place}</td>
                    <td>${localTime}</td>
                `;
                tableBody.appendChild(row);

                // --- LÓGICA DEL MAPA (NUEVO) ---
                if (geometry) {
                    // USGS entrega [longitud, latitud], Leaflet usa [latitud, longitud]
                    const [lon, lat] = geometry.coordinates;
                    const mag = properties.mag;

                    // Creamos un círculo en el mapa
                    const circle = L.circleMarker([lat, lon], {
                        radius: mag * 1.5, // El radio depende de la magnitud
                        color: '#FF0000', // Rojo
                        fillColor: '#FF4500', // Naranjo
                        fillOpacity: 0.7
                    }).addTo(map);

                    // Añadimos un popup al hacer clic
                    circle.bindPopup(`
                        <strong>Magnitud: ${mag.toFixed(1)}</strong>
                        <br>${properties.place}
                        <br>${localTime}
                    `);
                }
            });

        } catch (error) {
            console.error('Error al buscar datos de sismos:', error);
            tableBody.innerHTML = '<tr><td colspan="3">Error al cargar los datos. Intente más tarde.</td></tr>';
        }
    }

    // 6. Llamamos a la función
    fetchEarthquakeData();
});