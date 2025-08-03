const API_TOKEN = '66b00ff80ece94f281b95b0c297d';

const form = document.getElementById('search-form');
const originInput = document.getElementById('origin-input');
const destinationInput = document.getElementById('destination-input');
const departureDateInput = document.getElementById('departure-date-input');
const resultsInfoDiv = document.getElementById('results-info');

let citiesData = null;

async function loadCitiesData() {
    try {
        if (citiesData) {
            return citiesData;
        }
        const response = await fetch('cities.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить файл городов');
        }
        citiesData = await response.json();
        return citiesData;
    } catch (error) {
        throw new Error(`Ошибка при загрузке данных о городах: ${error.message}`);
    }
}

async function getCityCode(cityName) {
    try {
        const cities = await loadCitiesData();
        const city = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
        if (city && city.code) {
            return city.code;
        } else {
            throw new Error(`Город "${cityName}" не найден. Проверьте правильность написания.`);
        }
    } catch (error) {
        throw new Error(`Ошибка при поиске города: ${error.message}`);
    }
}

async function getFlights(origin, destination, departureDate) {
    try {
        const url = `https://api.travelpayouts.com/v1/prices/cheap?token=${API_TOKEN}&origin=${origin}&destination=${destination}&departure_date=${departureDate}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Ошибка при получении данных о билетах.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Ошибка при поиске билетов: ${error.message}`);
    }
}

function displayFlights(data, originCity, destinationCity) {
    const tickets = data.data;
    resultsInfoDiv.innerHTML = '';

    if (Object.keys(tickets).length === 0) {
        resultsInfoDiv.innerHTML = `<p>К сожалению, на эту дату билетов не найдено.</p>`;
        return;
    }

    resultsInfoDiv.innerHTML = `<h2>Дешевые билеты из ${originCity} в ${destinationCity}</h2>`;

    for (const currencyCode in tickets) {
        if (tickets.hasOwnProperty(currencyCode)) {
            const ticket = tickets[currencyCode][0];
            const html = `
                <div class="ticket">
                    <h3>Билет в одну сторону</h3>
                    <p>Цена: ${ticket.price} ${data.currency}</p>
                    <p>Авиакомпания: ${ticket.airline}</p>
                    <p>Дата вылета: ${ticket.departure_at.slice(0, 10)}</p>
                    <a href="https://www.aviasales.ru" target="_blank">Найти на Aviasales</a>
                </div>
            `;
            resultsInfoDiv.innerHTML += html;
        }
    }
}

function displayError(message) {
    resultsInfoDiv.innerHTML = `<p class="error-message">${message}</p>`;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const originCityName = originInput.value.trim();
    const destinationCityName = destinationInput.value.trim();
    const departureDate = departureDateInput.value;
    resultsInfoDiv.innerHTML = '';

    if (originCityName === '' || destinationCityName === '' || departureDate === '') {
        displayError('Пожалуйста, заполните все поля.');
        return;
    }

    try {
        const originCode = await getCityCode(originCityName);
        const destinationCode = await getCityCode(destinationCityName);
        const flightsData = await getFlights(originCode, destinationCode, departureDate);
        displayFlights(flightsData, originCityName, destinationCityName);
    } catch (error) {
        displayError(error.message);
    }
});