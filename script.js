    const API_KEY = "q5SmQbLi8al7ZNGO"; 
    const BASE_URL = "https://my.meteoblue.com";

    const qEl = document.getElementById("q");
    const suggestionsEl = document.getElementById("suggestions");
    const tempEl = document.getElementById("temp");
    const condEl = document.getElementById("cond");
    const iconEl = document.getElementById("icon");
    const humidityEl = document.getElementById("humidity");
    const windEl = document.getElementById("wind");
    const precipEl = document.getElementById("precip");
    const locEl = document.getElementById("loc");
    const timeEl = document.getElementById("timestamp");
    const forecastEl = document.getElementById("forecast");
    const loadingEl = document.getElementById("loadingIndicator");
    const errorEl = document.getElementById("errorMsg");
    const favListEl = document.getElementById("favList");
    const favContainerEl = document.getElementById("favoritesContainer");

    let unit = "metric";
    let theme = "light";
    let current = { lat: null, lon: null, name: null };
    let favorites = [];
    let lastWeatherData = null;

    const weatherIcons = {
      1: '☀️', 2: '🌤️', 3: '⛅', 4: '☁️', 5: '🌧️',
      6: '🌧️', 7: '🌨️', 8: '🌧️', 9: '⛈️', 10: '🌫️',
      11: '🌫️', 12: '🌨️', 13: '❄️', 14: '🌨️', 15: '⛈️'
    };

    const weatherDesc = {
        1: 'Langit cerah',
        2: 'Berawan sebagian',
        3: 'Berawan',
        4: 'Mendung',
        5: 'Hujan ringan',
        6: 'Hujan',
        7: 'Salju',
        8: 'Hujan rintik',
        9: 'Badai petir',
        10: 'Berkabut',
        11: 'Kabut beku',
        12: 'Hujan salju ringan',
        13: 'Salju lebat',
        14: 'Hujan es',
        15: 'Badai petir hebat'
    };

    function toFahrenheit(celsius) {
      return (celsius * 9/5) + 32;
    }
    
    function convertTemp(temp) {
      return unit === "metric" ? temp : toFahrenheit(temp);
    }
    
    function convertSpeed(kmh) {
      return unit === "metric" ? kmh : kmh * 0.621371;
    }
    
    function showLoading(s) {
      loadingEl.style.display = s ? "flex" : "none";
    }
    
    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = "block";
      setTimeout(() => errorEl.style.display = "none", 5000);
    }
    
    function formatTime() {
      return new Date().toLocaleString('id-ID', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      });
    }

    function getWeatherIcon(code) {
      return weatherIcons[code] || '🌤️';
    }

  function getWeatherDesc(code) {
  code = Number(code); 
  return weatherDesc[code] ?? 'Tidak diketahui';
}

    async function geocode(q) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=id`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'WeatherDashboard/1.0'
          }
        });
        const data = await res.json();
        return data.map(loc => ({
          name: loc.display_name.split(',')[0],
          lat: parseFloat(loc.lat),
          lon: parseFloat(loc.lon),
          country: loc.display_name.split(',').pop().trim()
        }));
      } catch (error) {
        console.error("Geocoding error:", error);
        return [];
      }
    }

    async function fetchWeather(lat, lon) {
      try {
        const url = `${BASE_URL}/packages/basic-1h_basic-day?lat=${lat}&lon=${lon}&apikey=${API_KEY}&format=json`;
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Weather fetch error:", error);
        throw error;
      }
    }

    function renderCurrent(data) {
      try {
        const hourly = data.data_1h;
        const daily = data.data_day;
        
        if (!hourly || !daily) {
          throw new Error("Invalid data format");
        }

        const currentTemp = hourly.temperature[0];
        const currentCode = hourly.pictocode[0];
        const currentHumidity = hourly.relativehumidity[0];
        const currentWind = hourly.windspeed[0];
        const currentPrecip = hourly.precipitation[0];

        tempEl.textContent = Math.round(convertTemp(currentTemp)) + (unit === "metric" ? "°C" : "°F");
        condEl.textContent = getWeatherDesc(currentCode);
        iconEl.textContent = getWeatherIcon(currentCode);
        humidityEl.textContent = Math.round(currentHumidity) + "%";
        windEl.textContent = Math.round(convertSpeed(currentWind)) + (unit === "metric" ? " km/h" : " mph");
        precipEl.textContent = currentPrecip.toFixed(1) + " mm";
        locEl.textContent = current.name;
        timeEl.textContent = "Update: " + formatTime();

        renderForecast(daily);
      } catch (error) {
        console.error("Render error:", error);
        showError("Gagal menampilkan data cuaca");
      }
    }

    function renderForecast(daily) {
      forecastEl.innerHTML = "";
      
      const days = daily.time.length;
      for (let i = 0; i < Math.min(days, 5); i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const tempMax = Math.round(convertTemp(daily.temperature_max[i]));
        const tempMin = Math.round(convertTemp(daily.temperature_min[i]));
        const code = daily.pictocode[i];
        const precip = daily.precipitation[i];
        
        const div = document.createElement("div");
        div.className = "day";
        div.innerHTML = `
          <div class="small">${dayName}</div>
          <div class="small">${dateStr}</div>
          <div class="icon">${getWeatherIcon(code)}</div>
          <b>${tempMax}° / ${tempMin}°</b>
          <div class="small">${getWeatherDesc(code)}</div>
          <div class="small">${precip.toFixed(1)} mm</div>`;
        forecastEl.appendChild(div);
      }
    }

    async function loadWeather() {
      if (!current.lat) return;
      showLoading(true);
      errorEl.style.display = "none";

      try {
        const data = await fetchWeather(current.lat, current.lon);
        lastWeatherData = data;
        renderCurrent(data);
      } catch (error) {
        console.error("Error loading weather:", error);
        showError("Gagal memuat data cuaca. Pastikan API key valid dan coba lagi.");
      } finally {
        showLoading(false);
      }
    }

    let timer = null;
    qEl.addEventListener("input", () => {
      const q = qEl.value.trim();
      if (!q) return (suggestionsEl.style.display = "none");

      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const list = await geocode(q);
          suggestionsEl.innerHTML = "";
          if (list.length === 0) {
            suggestionsEl.innerHTML = '<div class="suggest-item">Tidak ditemukan</div>';
          } else {
            list.forEach((loc) => {
              const b = document.createElement("div");
              const name = `${loc.name}, ${loc.country}`;
              b.textContent = name;
              b.className = "suggest-item";
              b.onclick = () => chooseLocation(loc);
              suggestionsEl.appendChild(b);
            });
          }
          suggestionsEl.style.display = "block";
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      }, 300);
    });

    function chooseLocation(loc) {
      current = {
        lat: loc.lat,
        lon: loc.lon,
        name: `${loc.name}, ${loc.country}`,
      };
      document.getElementById("saveCity").value = current.name;
      suggestionsEl.style.display = "none";
      qEl.value = "";
      loadWeather();
    }

    function saveFavorite() {
      const city = document.getElementById("saveCity").value.trim();
      if (!city) return showError("Masukkan nama kota!");
      
      if (!favorites.includes(city)) {
        favorites.push(city);
        renderFavorites();
      }
    }

    function removeFavorite(city) {
      favorites = favorites.filter(f => f !== city);
      renderFavorites();
    }

    function renderFavorites() {
      favListEl.innerHTML = "";
      favorites.slice(0, 3).forEach(city => {
        const tag = document.createElement("div");
        tag.className = "fav-tag";
        tag.textContent = city.split(',')[0];
        tag.onclick = async () => {
          const results = await geocode(city);
          if (results.length > 0) chooseLocation(results[0]);
        };
        favListEl.appendChild(tag);
      });

      favContainerEl.innerHTML = "";
      if (favorites.length === 0) {
        favContainerEl.innerHTML = '<div class="small">Belum ada kota favorit</div>';
      } else {
        favorites.forEach(city => {
          const item = document.createElement("div");
          item.className = "fav-item";
          item.innerHTML = `
            <span>${city}</span>
            <span class="remove">×</span>
          `;
          item.querySelector('span:first-child').onclick = async () => {
            const results = await geocode(city);
            if (results.length > 0) chooseLocation(results[0]);
          };
          item.querySelector('.remove').onclick = (e) => {
            e.stopPropagation();
            removeFavorite(city);
          };
          favContainerEl.appendChild(item);
        });
      }
    }

    document.getElementById("saveBtn").onclick = saveFavorite;
    document.getElementById("clearFav").onclick = () => {
      if (confirm("Hapus semua favorit?")) {
        favorites = [];
        renderFavorites();
      }
    };

    document.getElementById("refreshBtn").onclick = loadWeather;

    document.getElementById("unitBtn").onclick = () => {
      unit = unit === "metric" ? "imperial" : "metric";
      document.getElementById("unitBtn").textContent = unit === "metric" ? "°C" : "°F";
      if (current.lat && lastWeatherData) {
        renderCurrent(lastWeatherData);
      }
    };

    document.getElementById("themeBtn").onclick = () => {
      theme = theme === "light" ? "dark" : "light";
      document.body.setAttribute("data-theme", theme);
      document.getElementById("themeBtn").textContent = theme === "light" ? "🌙 Dark" : "☀️ Light";
    };

    async function init() {
      renderFavorites();
      
      const defaultCity = await geocode("Jakarta, Indonesia");
      if (defaultCity.length > 0) {
        chooseLocation(defaultCity[0]);
      }
    }

    document.addEventListener("click", (e) => {
      if (!qEl.contains(e.target) && !suggestionsEl.contains(e.target)) {
        suggestionsEl.style.display = "none";
      }
    });

    init();