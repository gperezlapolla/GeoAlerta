// Espera a que el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // 1. INICIALIZACIÓN DEL MAPA DE TORMENTAS
    // Variable renombrada a "stormMap" para evitar conflictos
    const stormMap = L.map('map-storms').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(stormMap); // Usando la variable renombrada


    // 2. DÓNDE VAMOS A PONER LA LISTA
    const stormList = document.getElementById('list-storms');

    // 3. LA URL DE LA API DE NASA EONET
    // Pedimos eventos "open" (activos) de la categoría "severeStorms"
    const apiUrl = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&status=open';

    // 4. FUNCIÓN PARA BUSCAR DATOS
    async function fetchStormData() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue exitosa.');
            }
            const data = await response.json();

            // Limpiamos el mensaje de "Cargando..."
            stormList.innerHTML = '';

            // Si no hay eventos, mostrar un mensaje
            if (data.events.length === 0) {
                stormList.innerHTML = '<p>No se reportan tormentas severas activas en este momento.</p>';
                return;
            }

            // 5. RECORREMOS CADA EVENTO (TORMENTA)
            data.events.forEach(event => {
                const title = event.title;

                // Las tormentas tienen múltiples puntos, usamos el último (el más reciente)
                const lastGeometry = event.geometry[event.geometry.length - 1];
                const date = new Date(lastGeometry.date).toLocaleString('es-CL', {
                    dateStyle: 'short',
                    timeStyle: 'medium'
                });
                
                // EONET usa [longitud, latitud], Leaflet usa [latitud, longitud]
                const [lon, lat] = lastGeometry.coordinates;

                // --- A. PINTAR LA LISTA ---
                const item = document.createElement('div');
                item.className = 'storm-item';

                // Revisar si EONET nos dio un link a una imagen satelital
                let satelliteImage = '';
                if (event.links && event.links.length > 0 && event.links[0].href) {
                    satelliteImage = `<img src="${event.links[0].href}" alt="Imagen satelital de ${title}">`;
                }

                item.innerHTML = `
                    <h4>${title}</h4>
                    <p>Último reporte: ${date}</p>
                    ${satelliteImage}
                `;
                stormList.appendChild(item);

                // --- B. PINTAR EL MAPA ---
                const icon = L.divIcon({
                    className: 'storm-icon',
                    html: '🌀', // Emoji de Ciclón
                    iconSize: [24, 24]
                });
                
                // Usando la variable renombrada "stormMap"
                const marker = L.marker([lat, lon], { icon: icon }).addTo(stormMap); 
                marker.bindPopup(`<strong>${title}</strong><br>Reporte: ${date}`);
            });

        } catch (error) {
            console.error('Error al buscar datos de tormentas:', error);
            stormList.innerHTML = '<p>Error al cargar los datos. Intente más tarde.</p>';
        }
    }

    // 6. LLAMAMOS A LA FUNCIÓN
    fetchStormData();
});