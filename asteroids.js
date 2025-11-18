// Espera a que el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    const asteroidList = document.getElementById('list-asteroids');
    const radarDiagram = document.getElementById('radar-diagram');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayString = `${yyyy}-${mm}-${dd}`;

    // --- ¡PEGAR TU CLAVE DE API DE LA NASA AQUÍ! ---
    const apiKey = 'xSOjZQg84xNGspitPxwQQLCYdjpOaVTAoNbzUwTf'; // Reemplaza esto con tu clave real
    // -------------------------------------------------

    const apiUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${todayString}&end_date=${todayString}&api_key=${apiKey}`;

    async function fetchAsteroidData() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue exitosa.');
            }
            const data = await response.json();

            asteroidList.innerHTML = '';
            radarDiagram.innerHTML = '';

            if (!data.near_earth_objects || !data.near_earth_objects[todayString]) {
                asteroidList.innerHTML = '<p>No se encontraron datos de asteroides para hoy.</p>';
                return;
            }

            const asteroids = data.near_earth_objects[todayString];

            if (asteroids.length === 0) {
                asteroidList.innerHTML = '<p>No hay asteroides cercanos reportados para hoy.</p>';
                return;
            }

            // --- LÓGICA DEL RADAR (¡CON ESCALA DE 20 LD!) ---
            const LUNAR_DISTANCE_KM = 384400;
            const MAX_DISPLAY_LD = 20; // Escala máxima del radar: 20 Distancias Lunares
            
            // Calculamos el radio de la órbita de la Luna (1 LD) en porcentaje del radar.
            // (1 LD / 20 LD max) * 50% (radio total del radar) = 2.5% del radio.
            const MOON_ORBIT_RADIUS_PERCENT = (1 / MAX_DISPLAY_LD) * 50; // Esto dará 2.5
            const MOON_ORBIT_DIAMETER_PERCENT = MOON_ORBIT_RADIUS_PERCENT * 2; // Esto dará 5.0 (para el ancho/alto del div de órbita)

            // 1. Pintar los elementos estáticos (Tierra, Luna, Etiquetas, Flecha)
            radarDiagram.innerHTML = `
                <div class="radar-point dot-earth-radar" title="Tierra"></div>
                <div class="label-earth">Tierra</div>
                
                <div class="dot-moon-orbit" title="Órbita Lunar (1 LD)" style="width: ${MOON_ORBIT_DIAMETER_PERCENT}%; height: ${MOON_ORBIT_DIAMETER_PERCENT}%;"></div>
                
                <div class="radar-point dot-moon-radar" title="Luna (1 LD)" style="top: 50%; left: calc(50% + ${MOON_ORBIT_RADIUS_PERCENT}%);"></div>
                
                <div class="label-moon" style="top: 50%; left: calc(50% + ${MOON_ORBIT_RADIUS_PERCENT}% + 15px);">Luna (1 LD)</div>

                <div class="arrow-radius-line"></div>
                <div class="arrow-radius-label">${MAX_DISPLAY_LD} LD</div>
            `;

            // 2. Recorremos y pintamos asteroides Y la lista
            asteroids.forEach(asteroid => {
                const name = asteroid.name;
                const isHazardous = asteroid.is_potentially_hazardous_asteroid;
                const missDistance = Math.round(asteroid.close_approach_data[0].miss_distance.kilometers);
                const diameter = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max);

                // --- CÁLCULO PARA EL RADAR ---
                const missDistanceLD = missDistance / LUNAR_DISTANCE_KM;
                
                // Calculamos el radio en % basado en la escala de 20 LD
                let radiusPercent = (missDistanceLD / MAX_DISPLAY_LD) * 50;

                // Aseguramos que los puntos no se salgan del radar ni queden invisibles
                if (radiusPercent > 50) radiusPercent = 50; 
                if (radiusPercent < 0.5) radiusPercent = 0.5; // Mínimo para que se vea

                // Ángulo aleatorio para distribuir los asteroides
                const angle = Math.random() * 2 * Math.PI;

                // Convertir (radio, angulo) a (x, y) para posicionar el div
                const xPos = 50 + radiusPercent * Math.cos(angle);
                const yPos = 50 + radiusPercent * Math.sin(angle);

                // --- PINTAR EL PUNTO EN EL RADAR ---
                const asteroidDot = document.createElement('div');
                asteroidDot.className = 'radar-point dot-asteroid-radar';
                if (isHazardous) {
                    asteroidDot.classList.add('dot-hazardous-radar');
                }
                asteroidDot.style.left = `${xPos}%`;
                asteroidDot.style.top = `${yPos}%`;
                asteroidDot.title = `${name} (${missDistanceLD.toFixed(1)} LD)`;
                radarDiagram.appendChild(asteroidDot);

                // --- PINTAR LA LISTA DE TEXTO ---
                const item = document.createElement('div');
                item.className = 'asteroid-item';
                if (isHazardous) {
                    item.classList.add('hazardous');
                }
                item.innerHTML = `
                    <h4>${name} ${isHazardous ? '(¡PELIGROSO!)' : ''}</h4>
                    <p><strong>Distancia:</strong> ${missDistance.toLocaleString('es-CL')} km (${missDistanceLD.toFixed(1)} LD)</p>
                    <p><strong>Diámetro Aprox:</strong> ${diameter.toLocaleString('es-CL')} metros</p>
                `;
                asteroidList.appendChild(item);
            });

        } catch (error) {
            console.error('Error al buscar datos de asteroides:', error);
            asteroidList.innerHTML = '<p>Error al cargar los datos. Intente más tarde.</p>';
        }
    }

    fetchAsteroidData();
});