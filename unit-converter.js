/* ========================================
   Unit Converter Application
   ======================================== */

// Conversion factors (to base units)
const conversionFactors = {
    length: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        mi: 1609.34,
        yd: 0.9144,
        ft: 0.3048,
        in: 0.0254
    },
    weight: {
        kg: 1,
        g: 0.001,
        mg: 0.000001,
        lb: 0.453592,
        oz: 0.0283495
    },
    temperature: {
        C: 'celsius',
        F: 'fahrenheit',
        K: 'kelvin'
    },
    volume: {
        l: 1,
        ml: 0.001,
        gal: 3.78541,
        qt: 0.946353,
        pt: 0.473176,
        cup: 0.236588,
        floz: 0.0295735
    },
    currency: {
        // Exchange rates to USD (1 USD = base rate)
        USD: 1,
        EUR: 0.92,
        GBP: 0.79
    }
};

// Current converter type
let currentConverter = 'length';

// ExchangeRate-API Configuration
// Get your FREE API key from: https://www.exchangerate-api.com/
const EXCHANGE_RATE_API_KEY = '8d05baf5c353a952d7e39ea5'; // Replace with your actual API key
const EXCHANGE_RATE_API_URL = 'https://v6.exchangerate-api.com/v6';

// Cache for exchange rates
let exchangeRates = {
    rates: {},
    lastUpdated: null
};

// DOM Elements
const inputValue = document.getElementById('input-value');
const outputValue = document.getElementById('output-value');
const fromUnit = document.getElementById('from-unit');
const toUnit = document.getElementById('to-unit');
const converterTitle = document.getElementById('converter-title');
const swapBtn = document.getElementById('swap-btn');
const clearBtn = document.getElementById('clear-btn');
const navLinks = document.querySelectorAll('.nav-link');
const exchangeRateInfo = document.getElementById('exchange-rate-info');
const exchangeRateText = document.getElementById('exchange-rate-text');

// ========================================
// Event Listeners
// ========================================

inputValue.addEventListener('input', convert);
fromUnit.addEventListener('change', convert);
toUnit.addEventListener('change', convert);
swapBtn.addEventListener('click', swapUnits);
clearBtn.addEventListener('click', clearFields);

// ========================================
// Conversion Function
// ========================================

function convert() {
    const input = parseFloat(inputValue.value);

    if (isNaN(input) || input === '') {
        outputValue.value = '';
        exchangeRateInfo.style.display = 'none';
        return;
    }

    let result;

    if (currentConverter === 'temperature') {
        result = convertTemperature(input, fromUnit.value, toUnit.value);
        exchangeRateInfo.style.display = 'none';
    } else if (currentConverter === 'currency') {
        result = convertCurrency(input, fromUnit.value, toUnit.value);
        updateExchangeRateInfo(fromUnit.value, toUnit.value);
    } else {
        const factors = conversionFactors[currentConverter];
        const baseValue = input * factors[fromUnit.value];
        result = baseValue / factors[toUnit.value];
        exchangeRateInfo.style.display = 'none';
    }

    // Round to 6 decimal places
    outputValue.value = parseFloat(result.toFixed(6));
}

// ========================================
// Temperature Conversion (Special Case)
// ========================================

function convertTemperature(value, from, to) {
    // Convert to Celsius first
    let celsius;

    if (from === 'C') {
        celsius = value;
    } else if (from === 'F') {
        celsius = (value - 32) * (5 / 9);
    } else if (from === 'K') {
        celsius = value - 273.15;
    }

    // Convert from Celsius to target unit
    if (to === 'C') {
        return celsius;
    } else if (to === 'F') {
        return (celsius * 9 / 5) + 32;
    } else if (to === 'K') {
        return celsius + 273.15;
    }
}

// ========================================
// Currency Conversion
// ========================================

function convertCurrency(value, from, to) {
    // Use cached exchange rates if available
    if (exchangeRates.rates[from] && exchangeRates.rates[from][to]) {
        const rate = exchangeRates.rates[from][to];
        return value * rate;
    }
    
    // Fallback to hardcoded rates if API is not available
    const factors = conversionFactors.currency;
    const usdValue = value / factors[from];
    return usdValue * factors[to];
}

// ========================================
// Fetch Exchange Rates from API
// ========================================

async function fetchExchangeRates(baseCurrency = 'USD') {
    // Check if we need to update (cache for 1 hour)
    const now = Date.now();
    if (exchangeRates.lastUpdated && (now - exchangeRates.lastUpdated) < 3600000) {
        return; // Use cached rates
    }

    if (EXCHANGE_RATE_API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('API key not configured. Using fallback rates.');
        return;
    }

    try {
        const response = await fetch(
            `${EXCHANGE_RATE_API_URL}/${EXCHANGE_RATE_API_KEY}/latest/${baseCurrency}`
        );
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result === 'success') {
            exchangeRates.rates[baseCurrency] = data.conversion_rates;
            exchangeRates.lastUpdated = now;
            console.log('Exchange rates updated successfully');
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to hardcoded rates
    }
}

// ========================================
// Update Exchange Rate Info
// ========================================

function updateExchangeRateInfo(from, to) {
    const currencySymbols = {
        USD: '$',
        EUR: '€',
        GBP: '£'
    };
    
    let rate = 1;
    
    // Get rate from cache if available
    if (exchangeRates.rates[from] && exchangeRates.rates[from][to]) {
        rate = exchangeRates.rates[from][to];
    } else {
        // Fallback to hardcoded rates
        const factors = conversionFactors.currency;
        rate = factors[to] / factors[from];
    }
    
    const rateStatus = exchangeRates.rates[from] ? '(Live)' : '(Offline)';
    exchangeRateText.textContent = `1 ${from} = ${rate.toFixed(4)} ${to} ${rateStatus} (${currencySymbols[from]} → ${currencySymbols[to]})`;
    exchangeRateInfo.style.display = 'block';
}

// ========================================
// Swap Units
// ========================================

function swapUnits() {
    const temp = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = temp;

    const tempValue = inputValue.value;
    inputValue.value = outputValue.value;
    outputValue.value = tempValue;

    convert();
}

// ========================================
// Clear Fields
// ========================================

function clearFields() {
    inputValue.value = '';
    outputValue.value = '';
    inputValue.focus();
}

// ========================================
// Switch Converter Type
// ========================================

function switchConverter(type) {
    currentConverter = type;
    clearFields();
    updateNavigation(type);
    updateConverterUI(type);
    
    // Fetch fresh exchange rates when switching to currency converter
    if (type === 'currency') {
        fetchExchangeRates('USD');
    }
}

// ========================================
// Update Navigation Active State
// ========================================

function updateNavigation(type) {
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${type}`) {
            link.classList.add('active');
        }
    });
}

// ========================================
// Update Converter UI
// ========================================

function updateConverterUI(type) {
    const titles = {
        length: 'Length Converter',
        weight: 'Weight Converter',
        temperature: 'Temperature Converter',
        volume: 'Volume Converter',
        currency: 'Currency Converter'
    };

    const unitOptions = {
        length: [
            { value: 'm', text: 'Meters' },
            { value: 'km', text: 'Kilometers' },
            { value: 'cm', text: 'Centimeters' },
            { value: 'mm', text: 'Millimeters' },
            { value: 'mi', text: 'Miles' },
            { value: 'yd', text: 'Yards' },
            { value: 'ft', text: 'Feet' },
            { value: 'in', text: 'Inches' }
        ],
        weight: [
            { value: 'kg', text: 'Kilograms' },
            { value: 'g', text: 'Grams' },
            { value: 'mg', text: 'Milligrams' },
            { value: 'lb', text: 'Pounds' },
            { value: 'oz', text: 'Ounces' }
        ],
        temperature: [
            { value: 'C', text: 'Celsius' },
            { value: 'F', text: 'Fahrenheit' },
            { value: 'K', text: 'Kelvin' }
        ],
        volume: [
            { value: 'l', text: 'Liters' },
            { value: 'ml', text: 'Milliliters' },
            { value: 'gal', text: 'Gallons' },
            { value: 'qt', text: 'Quarts' },
            { value: 'pt', text: 'Pints' },
            { value: 'cup', text: 'Cups' },
            { value: 'floz', text: 'Fluid Ounces' }
        ],
        currency: [
            { value: 'USD', text: 'US Dollar ($)' },
            { value: 'EUR', text: 'Euro (€)' },
            { value: 'GBP', text: 'British Pound (£)' }
        ]
    };

    // Update title
    converterTitle.textContent = titles[type];

    // Update unit options
    const options = unitOptions[type];
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';

    options.forEach((option, index) => {
        const optFrom = document.createElement('option');
        optFrom.value = option.value;
        optFrom.textContent = option.text;
        fromUnit.appendChild(optFrom);

        const optTo = document.createElement('option');
        optTo.value = option.value;
        optTo.textContent = option.text;
        if (index === options.length - 1) {
            optTo.selected = true;
        }
        toUnit.appendChild(optTo);
    });
}

// ========================================
// Initialize Application
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    // Set initial focus
    inputValue.focus();
    
    // Fetch initial exchange rates
    fetchExchangeRates('USD');

    console.log('Unit Converter App initialized');
});
