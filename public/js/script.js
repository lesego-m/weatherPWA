'use strict';

document.addEventListener("DOMContentLoaded", function() {
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function weatherApp() {
    let storageWeatherName = '';
    const utilities = () => {   
      const getData = (api, storageKey) => {
        return new Promise((resolve, reject) => {
                fetch(api).then(
                    (response) => {
                        // Success
                        if (response.status == 200) {
                            
                            response.json().then((data) => {
                              if(storageKey !== null) {
                                localStorage.setItem(storageKey, JSON.stringify(data));
                              }
                                resolve(data);
                            });
  
                        } else {
                            // Error
                            reject(null);
                        }
                    }
                ).catch((error) => {
                    // Error
                    reject(null);
                });
  
            });
      }; 
      const getElement = (el) => {
          return document.querySelector(el);
        };
      const getIcon = (iconId) => {
        return `https://openweathermap.org/img/wn/${iconId}@2x.png`;
      };
      const roundUnits = (units) => {
           return Math.ceil(units);
        };
      return {
        getElement,
        getIcon,
        roundUnits,
        getData
      }
    };
    const helpers = utilities();
    const today = helpers.getElement('.current_day');
    const searchString = helpers.getElement('#search');
    const searchBtn = helpers.getElement('#searchBtn');
    const todayStats = helpers.getElement('.current_day_stats');
    const getCity = (stringQuery) => {
      const cleanInputString = stringQuery.replace(/[^a-zA-Z\S\s]/gi,'');
      const stringParam = cleanInputString.replace(' ','%20').trim();
      const cityAPI = `https://api.openweathermap.org/data/2.5/weather?q=${stringParam}&appid=929ce62ef37c600bea65cc43a2db914b`;

      return helpers.getData(cityAPI, null);
    };
    const getWeather = (lat = '40.71', long = '-74.01', name = 'New York') => {
      const localWeatherName = name.toLocaleLowerCase();
      const weatherAPI = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&units=metric&exclude=minutely,daily,hourly&appid=929ce62ef37c600bea65cc43a2db914b`;

      storageWeatherName = localWeatherName;
      return helpers.getData(weatherAPI, localWeatherName);
    };
    const getDate = (unix_timestamp, timezone) => {  
      const date = new Date(unix_timestamp * 1000);
      const day = date.getDate();
      const intlDate = (options, day) => {
        return new Intl.DateTimeFormat('en-US', options).format(day);
      };
      
      const fullDateOptions = {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', 
        timeZone: timezone
      }; 
      const shortDateOptions = {
        weekday: 'short', month: 'short', day: 'numeric',
        timeZone: timezone
      };   

      const shortDateTimeOptions = {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: 'numeric', 
        timeZone: timezone
      };
      const formattedTimeOptions = {
        hour: 'numeric', minute: 'numeric', 
        timeZone: timezone
      };
      
      const formattedFullDate = intlDate(fullDateOptions, date);
      const formattedShortDate = intlDate(shortDateOptions, date);
      const formattedShortDateTime = intlDate(shortDateTimeOptions, date);
      const formattedTime = intlDate(formattedTimeOptions, date);
      
      return {
        formattedFullDate,
        formattedShortDate,
        formattedShortDateTime,
        formattedTime
      }
    };
    
    const listItem = (data, city, timezone) => {
      const {dt, temp, weather} = data.current;
      const date = getDate(dt, timezone).formattedShortDate;
      
      return `<li class='daily_weather'>
          <a href='#' data-name='${city}' class='daily_weather__link'>
            <h3 class='daily_weather__title'>${city}<span class='daily_weather__title-date'>${date}</span></h3>
            <p class='daily_weather__temp'>
              ${helpers.roundUnits(temp)}&deg;
            </p>
          </a>
        </li>`;
    };

    const mainItem = (data, city, timezone) => {
      const {dt, temp, weather} = data;
      const date = getDate(dt, timezone).formattedShortDateTime;
      const icon = helpers.getIcon(weather[0].icon);
      const iconName = weather[0].main;
      const desc = weather[0].description;
      const getTempUI = (temperature) => {
        if(typeof temperature === "number"){
          return `<span class='current_day__content-temp'>
            ${helpers.roundUnits(temperature)}<sup>&deg;</sup>
          </span>`;
        } else {
        return `<span class='current_day__content-max'>
              ${helpers.roundUnits(temperature.max)}&deg;
            </span>
            <span class='current_day__content-min'>
              ${helpers.roundUnits(temperature.min)}&deg;
          </span>`;
        }
      };
      helpers.getElement('#today').innerHTML = getDate(dt, timezone).formattedFullDate;
      return `<h2 class='current_day__title'>${city}<span class='current_day__title-date'>${date}</a></h2>
        <div class='current_day__content'>
          <img class='current_day__content-icon' src='${icon}' alt='${iconName}' data-icon='${weather[0].icon}' width='100' height='100'/>
          <p>
           ${getTempUI(temp)}
          <br>
          <span class="current_day__content-description">${desc}</span>
          </p>
        </div>`;
    };
    
    const statsItem = (data, timezone) => {
      const {sunrise, sunset, feels_like, pressure, humidity, dew_point, uvi, visibility, wind_speed, wind_deg} = data;
      
      const stats = {
        sunrise : !!sunrise ? getDate(sunrise, timezone).formattedTime : '',
        sunset : !!sunset ? getDate(sunset, timezone).formattedTime : '', 
        feels_like : helpers.roundUnits(feels_like) + '&deg;', 
        pressure : pressure + ' hPa', 
        humidity : humidity + '%', 
        dew_point : dew_point + '%', 
        uvi_index : uvi, 
        visibility : helpers.roundUnits(visibility) + ' metres', 
        wind_speed : helpers.roundUnits(wind_speed) + ' metre/sec',
        wind_deg : wind_deg + '&deg;'
      };
      
      let statsElements = '';
      for (const property in stats) {
        const value = stats[property] +'';
        if(!value.includes('NaN') && value.length > 0 && value !== 'undefined'){
          statsElements += `<article class='current_stats'>
          <h3 class='current_stats__title'>${property.replace('_', '&nbsp;')}</h3>
          <p class='current_stats__info'>
          ${value}
          </p>
          </article>`;
        }
      }
      return statsElements;
    };

    const listBuilder = (listKeys, timezone) => {
      let listElements = '';

      listKeys.forEach((listKey) => {
        const list = JSON.parse(localStorage[listKey]);
        listElements += listItem(list, listKey, timezone);
      });
      
      return listElements;
    };
    
    const renderUI = (data, city) => {
      const {current, timezone} = data;
      const storedData = Object.keys(localStorage);
      const buildUI = () => {
        today.innerHTML = mainItem(current, city, timezone);
        todayStats.innerHTML = statsItem(current, timezone);
        helpers.getElement('#today').innerHTML = getDate(current.dt, timezone).formattedFullDate;
        helpers.getElement('#search_history').innerHTML = listBuilder(storedData, timezone);
      }
      return {
        init: buildUI,
        update :  {
          stats: (dataStored) => statsItem(dataStored.current, timezone),
          main: (dataStored, cityName) => mainItem(dataStored.current, cityName, timezone)
        }
      };
    };
  
    const startAppUI = (search) => { 
        getCity(search).then(data => {
          const errMessage = helpers.getElement('.error__message');
          if(!errMessage.classList.contains('error__message--hidden')) {
            errMessage.classList.add('error__message--hidden');
          }        
          return data;
        }).catch((e)=> {
          console.log(`Network error: ${e}`, storageWeatherName);
          helpers.getElement('.error__message').classList.remove('error__message--hidden');
        }).then(data => {
          console.log()
          let d = data;
          if(d === null || d === undefined) {
            d = JSON.parse(localStorage.getItem(storageWeatherName));
          }
          getWeather(d.coord.lat, d.coord.lon, d.name).then(networkData => {
            return networkData;
          }).catch((e)=> {
            console.log(`Network error: ${e}`, storageWeatherName);
            return JSON.parse(localStorage.getItem(storageWeatherName));
          }).then(data => {
            renderUI(data, storageWeatherName).init();
            const links = document.querySelectorAll('.daily_weather__link');
            Array.from(links).forEach((link, index, arr) => {
              const cityName = link.dataset.name;
              const storedData = JSON.parse(localStorage.getItem(cityName));
            link.addEventListener('click', event => {
              event.preventDefault();
              const activeLink = arr.find(link => link.classList.contains('active'));
              if(activeLink) activeLink.classList.remove('active');
              event.currentTarget.classList.add('active');
              today.innerHTML = renderUI(data).update.main(storedData, cityName);
              todayStats.innerHTML = renderUI(data).update.stats(storedData);
            });
          });
        });
      });
    };

    const startApp = () => {  
      searchBtn.addEventListener('click', event => {
        event.stopPropagation();
        event.preventDefault();
        if(searchString.value !== '') {
          startAppUI(searchString.value);
          searchString.value = '';
        }
      });
      startAppUI('New York');
    };
    
    return Object.freeze({
      init: startApp
    });
  };
  
  weatherApp().init();
});