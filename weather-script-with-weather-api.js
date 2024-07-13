(function() {
    function createWeatherDiv(divId) {
        const targetDiv = divId ? document.getElementById(divId) : document.createElement('div');
        if (!divId) {
            document.body.appendChild(targetDiv);
        }
        targetDiv.innerHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <h2 style="text-align: center; color: #333;">Weather Forecast</h2>
                <div style="display: flex; margin-bottom: 10px;">
                    <input type="text" id="locationInput" placeholder="Enter city name or coordinates (lat,lon)" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-right: none; border-radius: 5px 0 0 5px; box-sizing: border-box;">
                    <button id="getWeatherBtn" style="padding: 10px 15px; background-color: #4CAF50; color: white; border: 1px solid #4CAF50; border-left: none; border-radius: 0 5px 5px 0; cursor: pointer;">Get Weather</button>
                </div>
                <div id="inputError" style="color: red; margin-top: 5px; display: none;">Please enter a location or coordinates.</div>
                <div id="loadingIndicator" style="text-align: center; margin-top: 20px; display: none;">Loading...</div>
                <div id="weatherResult" style="margin-top: 20px;"></div>
            </div>
        `;

        const locationInput = targetDiv.querySelector('#locationInput');
        const getWeatherBtn = targetDiv.querySelector('#getWeatherBtn');
        const inputError = targetDiv.querySelector('#inputError');
        const loadingIndicator = targetDiv.querySelector('#loadingIndicator');
        const weatherResult = targetDiv.querySelector('#weatherResult');

        getWeatherBtn.addEventListener('click', async () => {
            inputError.style.display = 'none'; // Hide any previous error message
            const input = locationInput.value.trim(); // Get the value from the input field and trim any leading/trailing whitespace
        
            if (input === '' || !isValidLocation(input)) {
                inputError.style.display = 'block'; // Display an error message if input is invalid
                weatherResult.innerHTML = ''; // Clear any previous weather results
                return; // Exit the function early, preventing further execution
            }
        
            loadingIndicator.style.display = 'block'; // Display the loading indicator
            weatherResult.innerHTML = ''; // Clear any previous weather results
        
            try {
                await getWeatherForecast(input); // Call the function to fetch and display weather forecast based on the input
            } catch (error) {
                weatherResult.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`; // Display error message if fetch fails
            } finally {
                loadingIndicator.style.display = 'none'; // Hide loading indicator regardless of success or failure
            }
        });

        function isValidLocation(location) { // Check coordinates is valid
            if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(location)) {
                const [lat, lon] = location.split(',').map(Number);
                const isValid = lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
                return isValid;
            }
            return true; // If not coordinates, assume it's a valid city name
        }

        async function getWeatherForecast(location) { // Get data from Weatherapi
            const apiKey = 'd8b76b9d2ba34afc8d690835241307'; 
            const isCoordinates = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(location);
            const url = isCoordinates ?
                `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=14` :
                `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=14`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error.message);
                }

                const weeklyAverages = processWeatherData(data.forecast.forecastday);
                displayWeatherResults(weeklyAverages);
            } catch (error) {
                weatherResult.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            } finally {
                loadingIndicator.style.display = 'none';
            }
        }

        function processWeatherData(forecastDays) { // Takes from data the temps + icons
            const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const weeklyData = {};

            forecastDays.forEach(day => {
                const date = new Date(day.date);
                const dayOfWeek = weekDays[date.getDay()];
                
                if (!weeklyData[dayOfWeek]) {
                    weeklyData[dayOfWeek] = { temps: [], conditions: [], icons: [] };
                }
                weeklyData[dayOfWeek].temps.push(day.day.avgtemp_c);
                weeklyData[dayOfWeek].conditions.push(day.day.condition.text);
                weeklyData[dayOfWeek].icons.push(`https:${day.day.condition.icon}`);
            });

            const weeklyAverages = {};
            for (const day in weeklyData) {
                const temps = weeklyData[day].temps;
                const conditions = weeklyData[day].conditions;
                const icons = weeklyData[day].icons;
                weeklyAverages[day] = {
                    avgTemp: temps.reduce((sum, temp) => sum + temp, 0) / temps.length,
                    condition: getMostFrequent(conditions),
                    icon: getMostFrequent(icons)
                };
            }

            return weeklyAverages;
        }

        function getMostFrequent(arr) { // Calculates the ave temp
            return arr.sort((a, b) =>
                arr.filter(v => v === a).length - arr.filter(v => v === b).length
            ).pop();
        }

        function displayWeatherResults(weeklyAverages) { // Build the return object for each day
            let resultHtml = '<h3 style="text-align: center; margin-bottom: 15px;">Average Temperatures (Next 2 Weeks)</h3>';
            resultHtml += '<ul style="list-style-type: none; padding: 0;">';

            for (const day in weeklyAverages) {
                const avgTemp = weeklyAverages[day].avgTemp.toFixed(1);
                const icon = weeklyAverages[day].icon;

                resultHtml += `
                    <li style="margin-bottom: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <span><strong>${day}:</strong> ${avgTemp}°C</span>
                        <img src="${icon}" alt="Weather icon" style="width: 32px; height: 32px;">
                    </li>
                `;
            }

            resultHtml += '</ul>';
            weatherResult.innerHTML = resultHtml;
        }
    }

    // Check if a specific div ID is provided
    const scriptTag = document.currentScript;
    const targetDivId = scriptTag.getAttribute('data-target-div');

    // Create the weather div
    createWeatherDiv(targetDivId);
})();