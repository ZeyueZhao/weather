// API Keys
const openWeatherApiKey = '92019513355b4b442854c0f5b8f14f0e';
const weatherApiKey = '7efb444819ac4b9b84b162547240710';
const weatherBitApiKey = '5c184ab54ab742b7b8fe69227a7fb260';
const visualCrossingApiKey = '9RSNU26BL5HB33DKQQF39QG5S';
const googleApiKey = 'AIzaSyDyvZloFq7yaYMPMVUevq-I2QIPkdqC4LQ';
let hourChart = '';
let dayChart = '';

// 获取用户当前位置的天气
document.getElementById('getLocationWeather').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      getCityName(lat, lon).then(city => {
        fetchWeather(city);
      });
    });
  } else {
    alert('Geolocation is not supported by your browser.');
  }
});
// 根据用户输入的位置获取天气
document.getElementById('searchWeather').addEventListener('click', () => {
  const location = document.getElementById('location').value;
  if (location) {
    fetchWeather(location);
  } else {
    alert('Please enter a location');
  }
});

// 获取城市名称并将其填入输入框
function getCityName(lat, lon) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}`;
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'OK') {
        const result = data.results[0];
        const city = result.address_components.find(component => component.types.includes('locality'));
        if (city) {
          document.getElementById('location').value = city.long_name; // 将城市名称填入输入框
          return city.long_name;
        } else {
          return 'Unknown location';
        }
      } else {
        throw new Error('Error fetching location data');
      }
    });
}

// 获取天气数据
function fetchWeather(location) {
  const unit = document.querySelector('input[name="unit"]:checked').value;
  const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${openWeatherApiKey}&units=${unit}`;
  const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&units=${unit}`;
  const weatherBitUrl = `https://api.weatherbit.io/v2.0/current?city=${location}&key=${weatherBitApiKey}&units=${unit}`;

  Promise.all([
    fetch(openWeatherUrl).then(response => response.json()),
    fetch(weatherApiUrl).then(response => response.json()),
    fetch(weatherBitUrl).then(response => response.json())
  ]).then(([openWeatherData, weatherApiData, weatherBitData]) => {
    displayWeather(openWeatherData, weatherApiData, weatherBitData);
    get24HourForecast(location);
    get7DayForecast(location);
  });
}

// 为单位切换添加事件监听器
document.querySelectorAll('input[name="unit"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const location = document.getElementById('location').value;
    if (location) {
      fetchWeather(location);
    } else {
      alert('Please enter a location first or use GPS to fetch location.');
    }
  });
});
// 显示天气数据
function displayWeather(openWeatherData, weatherApiData, weatherBitData) {
  const unit = document.querySelector('input[name="unit"]:checked').value;
  let unitSymbol;

  if (unit === 'metric') {
    unitSymbol = '°C';
  } else if (unit === 'imperial') {
    unitSymbol = '°F';
  } else if (unit === 'kelvin') {
    unitSymbol = 'K';
  }

  const weatherDisplay = document.getElementById('weather-display');
  weatherDisplay.innerHTML = ''; // 清空容器内容

  let tempOpenWeather = openWeatherData.main.temp;

  changeThemeBasedOnWeather(tempOpenWeather);

  const cityName = openWeatherData.name;
  const descriptionOpenWeather = openWeatherData.weather[0].description;
  const iconOpenWeather = openWeatherData.weather[0].icon;

  const openWeatherDiv = document.createElement('div');
  openWeatherDiv.innerHTML = `
    <h2 id="city-name">${cityName}</h2>
    <p>OpenWeather: ${descriptionOpenWeather}</p>
    <p>OpenWeather Temperature: ${tempOpenWeather}${unitSymbol}</p>
    <img src="http://openweathermap.org/img/w/${iconOpenWeather}.png" alt="OpenWeather Icon">
  `;
  weatherDisplay.appendChild(openWeatherDiv);

  let tempWeatherApi;
  if (unit === 'metric') {
    tempWeatherApi = weatherApiData.current.temp_c;
  } else if (unit === 'imperial') {
    tempWeatherApi = weatherApiData.current.temp_f;
  } else if (unit === 'kelvin') {
    tempWeatherApi = (weatherApiData.current.temp_c + 273.15).toFixed(2);
  }

  const weatherApiDiv = document.createElement('div');
  weatherApiDiv.innerHTML = `
    <p>WeatherAPI: ${weatherApiData.current.condition.text}</p>
    <p>WeatherAPI Temperature: ${tempWeatherApi}${unitSymbol}</p>
    <img src="${'https:'+weatherApiData.current.condition.icon}" alt="WeatherAPI Icon">
  `;
  weatherDisplay.appendChild(weatherApiDiv);

  let tempWeatherBit;
  if (unit === 'kelvin') {
    tempWeatherBit = (weatherBitData.data[0].temp + 273.15).toFixed(2);
  } else {
    tempWeatherBit = weatherBitData.data[0].temp;
  }

  const weatherBitDiv = document.createElement('div');
  weatherBitDiv.innerHTML = `
    <p>WeatherBit: ${weatherBitData.data[0].weather.description}</p>
    <p>WeatherBit Temperature: ${tempWeatherBit}${unitSymbol}</p>
    <img src="https://www.weatherbit.io/static/img/icons/${weatherBitData.data[0].weather.icon}.png" alt="WeatherBit Icon">
  `;
  weatherDisplay.appendChild(weatherBitDiv);
}

// Function to change theme based on the temperature
function changeThemeBasedOnWeather(temp) {
  const body = document.body;
  if (temp > 12) {
    body.style.backgroundColor = '#ffcccb';
    body.style.color = '#333';
  } else {
    body.style.backgroundColor = '#add8e6';
    body.style.color = '#333';
  }
}

// 24小时预报
function get24HourForecast(location) {
  const openWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${openWeatherApiKey}&units=metric`;
  const weatherBitUrl = `https://api.weatherbit.io/v2.0/forecast/hourly?city=${location}&key=${weatherBitApiKey}&hours=24&units=metric`;
  const weatherApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${location}&days=1&aqi=no&alerts=no`;

  Promise.all([
    fetch(openWeatherUrl).then(response => response.json()),
    fetch(weatherBitUrl).then(response => response.json()),
    fetch(weatherApiUrl).then(response => response.json())
  ]).then(([openWeatherData, weatherBitData, weatherApiData]) => {
    displayForecastChart(openWeatherData, weatherBitData, weatherApiData, '24-hour');
  });
}

// 7天预报
function get7DayForecast(location) {
  const weatherBitUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${location}&key=${weatherBitApiKey}&days=7&units=metric`;
  const weatherApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${location}&days=7&aqi=no&alerts=no`;
  const visualCrossingUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&key=${visualCrossingApiKey}&contentType=json`;

  Promise.all([
    fetch(weatherBitUrl).then(response => response.json()),
    fetch(weatherApiUrl).then(response => response.json()),
    fetch(visualCrossingUrl).then(response => response.json())
  ]).then(([weatherBitData, weatherApiData, visualCrossingData]) => {
    displayForecastChart(visualCrossingData.days, weatherBitData, weatherApiData, '7-day');
  }).catch(error => {
    console.error('Error fetching 7-day forecast:', error);
  });
}

// 显示预测图表
function displayForecastChart(data1, data2, data3, type) {
  const unit = document.querySelector('input[name="unit"]:checked').value;
  let unitSymbol;

  if (unit === 'metric') {
    unitSymbol = '°C';
  } else if (unit === 'imperial') {
    unitSymbol = '°F';
  } else if (unit === 'kelvin') {
    unitSymbol = 'K';
  }

  const labels = [];
  const datasetTemp1 = [];
  const datasetTemp2 = [];
  const datasetTemp3 = [];
  const icons = [];
  const time = [];

  if (type === '24-hour') {
    for (let i = 0; i < 24; i++) {
      labels.push(`${i}:00`);
      let temp1 = data1.list[i].main.temp;
      let temp2 = data2.data[i].temp;
      let temp3 = data3.forecast.forecastday[0].hour[i].temp_c;

      if (unit === 'imperial') {
        temp1 = (temp1 * 9 / 5) + 32;
        temp2 = (temp2 * 9 / 5) + 32;
        temp3 = (temp3 * 9 / 5) + 32;
      } else if (unit === 'kelvin') {
        temp1 += 273.15;
        temp2 += 273.15;
        temp3 += 273.15;
      }

      datasetTemp1.push(temp1);
      datasetTemp2.push(temp2);
      datasetTemp3.push(temp3);

      icons.push(data1.list[i].weather[0].icon);
    }
  } else if (type === '7-day') {
    for (let i = 0; i < 7; i++) {
      labels.push(`Day ${i + 1}`);
      let temp1 = data1[i].temp;
      let temp2 = data2.data[i].temp;

      if (unit === 'imperial') {
        temp1 = (temp1 * 9 / 5) + 32;
        temp2 = (temp2 * 9 / 5) + 32;
      } else if (unit === 'kelvin') {
        temp1 += 273.15;
        temp2 += 273.15;
      }

      datasetTemp1.push(temp1);
      datasetTemp2.push(temp2);

      icons.push(data2.data[i].weather.icon);
      time.push(data2.data[i].datetime);
    }
  }

  let ctx;
  if (type === '24-hour') {
    ctx = document.getElementById('weatherChart').getContext('2d');
    document.getElementById('hour').style.display = 'block';
    if (hourChart) {
      hourChart.destroy();
    }
  } else if (type === '7-day') {
    ctx = document.getElementById('weatherChart2').getContext('2d');
    document.getElementById('day').style.display = 'block';
    if (dayChart) {
      dayChart.destroy();
    }
  }

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Visual Crossing',
          data: datasetTemp1,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          yAxisID: 'y-temperature',
        },
        {
          label: 'WeatherBit',
          data: datasetTemp2,
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          yAxisID: 'y-temperature',
        },
        ...(type === '24-hour' ? [{
          label: 'WeatherAPI',
          data: datasetTemp3,
          borderColor: 'rgba(54, 22, 33, 1)',
          borderWidth: 2,
          yAxisID: 'y-temperature',
        }] : [])
      ]
    },
    options: {
      scales: {
        'y-temperature': {
          type: 'linear',
          position: 'left',
          ticks: {
            callback: function(value) {
              return value + ` ${unitSymbol}`;
            }
          },
        },
      }
    }
  });

  if (type === '24-hour') {
    hourChart = chart;
  } else {
    dayChart = chart;
  }

  if (type === '24-hour') {
    const hourInfo = document.getElementById('hourInfo');
    hourInfo.innerHTML = '';
    document.getElementById('hours').style.display = 'block';
    for (let i = 0; i < 24; i++) {
      const ele = document.createElement('div');
      ele.style.display = 'flex';
      const time = new Date();
      ele.innerHTML = `
        <p>${time.getFullYear()}-${(time.getMonth() + 1)}-${time.getDate()} ${i}:00</p>
        <img src="http://openweathermap.org/img/w/${icons[i]}.png" alt="Weather Icon" />
        <p>${datasetTemp1[i].toFixed(2)} ${unitSymbol}</p>
      `;
      hourInfo.appendChild(ele);
    }
  } else {
    const dayInfo = document.getElementById('dayInfo');
    dayInfo.innerHTML = '';
    document.getElementById('days').style.display = 'block';
    for (let i = 0; i < 7; i++) {
      const ele = document.createElement('div');
      ele.style.display = 'flex';
      ele.innerHTML = `
        <p>${time[i]}</p>
        <img src="https://www.weatherbit.io/static/img/icons/${icons[i]}.png" alt="Weather Icon" />
        <p>${datasetTemp2[i].toFixed(2)} ${unitSymbol}</p>
      `;
      dayInfo.appendChild(ele);
    }
  }
}

// 初始化收藏夹列表
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// 显示收藏夹列表
function displayFavorites() {
  const favoritesList = document.getElementById('favorites-list');
  favoritesList.innerHTML = ''; // 清空当前列表

  favorites.forEach((location) => {
    const li = document.createElement('li');
    li.classList.add('favorite-item')
    li.textContent = location;
    li.addEventListener('click', () => {
      // 点击收藏夹项目时，显示天气
      fetchWeather(location);
    });
    favoritesList.appendChild(li);
  });
}

// 将位置添加到收藏夹
function addToFavorites(location) {
  if (!favorites.includes(location)) {
    favorites.push(location);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
  }
}
// 绑定“添加到收藏夹”按钮
document.getElementById('favorite-button').addEventListener('click', () => {
    if(document.getElementById('city-name')&&document.getElementById('city-name').innerText) {
        const currentLocation = document.getElementById('city-name').innerText;
        if (currentLocation) {
          addToFavorites(currentLocation);
        }
    }else{
        alert("Please fill in the city first")
    }

});

// 初始化时显示收藏夹
displayFavorites();


