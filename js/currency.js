/* Пересчет цен по курсам ЦБ РФ (внешний источник данных). */
(function () {
    'use strict';

    const CBR_URL =
        'https://www.cbr-xml-daily.ru/daily_json.js';
    const REQUEST_TIMEOUT_MS = 8000;
    const STORAGE_KEY = 'motopeak-currency';
    const SYMBOLS = { USD: '$', EUR: '€', CNY: '¥' };
    const RATE_FORMAT = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    };
    const MESSAGES = {
        loading: 'Загрузка курсов ЦБ РФ…',
        offline: 'Нет подключения к сети. '
            + 'Цены показаны в рублях.',
        timeout: 'Сервер курсов не отвечает. '
            + 'Цены показаны в рублях.',
        failed: 'Не удалось загрузить курсы валют ЦБ РФ. '
            + 'Цены показаны в рублях.'
    };

    const select = document.getElementById('currency-select');
    const statusElement =
        document.getElementById('currency-status');
    if (!select || !statusElement) {
        return;
    }

    let ratesData = null; // курсы и дата ответа ЦБ

    function loadSavedCurrency() {
        try {
            return localStorage.getItem(STORAGE_KEY) || 'RUB';
        } catch (error) {
            return 'RUB'; // хранилище недоступно
        }
    }

    function saveCurrency(code) {
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch (error) {
            // Хранилище недоступно: выбор не запоминается.
        }
    }

    function formatMoney(amount, currency) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function formatDate(isoString) {
        return new Date(isoString).toLocaleDateString('ru-RU');
    }

    function setStatus(text, state) {
        statusElement.textContent = text;
        statusElement.className = 'currency-status';
        if (state) {
            statusElement.classList.add('is-' + state);
        }
    }

    function extractRates(data) {
        const rates = {};
        Object.keys(SYMBOLS).forEach(function (code) {
            const item = data.Valute && data.Valute[code];
            if (!item || !item.Value || !item.Nominal) {
                throw new Error('В ответе нет курса ' + code);
            }
            rates[code] = item.Value / item.Nominal;
        });
        return { date: formatDate(data.Date), rates: rates };
    }

    async function fetchRates() {
        const controller = new AbortController();
        const timerId = setTimeout(function () {
            controller.abort();
        }, REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(CBR_URL,
                { signal: controller.signal });
            if (!response.ok) {
                throw new Error('Ошибка HTTP '
                    + response.status);
            }
            return extractRates(await response.json());
        } finally {
            clearTimeout(timerId);
        }
    }

    function priceText(rub, currency) {
        if (currency === 'RUB') {
            return formatMoney(rub, 'RUB');
        }
        const converted = rub / ratesData.rates[currency];
        return '≈ ' + formatMoney(converted, currency);
    }

    function renderPrices(currency) {
        document.querySelectorAll('[data-price-rub]')
            .forEach(function (element) {
                const rub = Number(element.dataset.priceRub);
                element.textContent = priceText(rub, currency);
            });
    }

    function rateText(currency) {
        const rate = ratesData.rates[currency]
            .toLocaleString('ru-RU', RATE_FORMAT);
        return 'Курс ЦБ РФ на ' + ratesData.date + ': 1 '
            + SYMBOLS[currency] + ' = ' + rate + ' ₽';
    }

    function describeError(error) {
        if (!navigator.onLine) {
            return MESSAGES.offline;
        }
        if (error.name === 'AbortError') {
            return MESSAGES.timeout;
        }
        return MESSAGES.failed;
    }

    function fallbackToRubles(error) {
        console.error('Курсы валют не загружены:', error);
        select.value = 'RUB';
        saveCurrency('RUB');
        renderPrices('RUB');
        setStatus(describeError(error), 'error');
    }

    async function applyCurrency(currency) {
        if (currency === 'RUB') {
            renderPrices('RUB');
            setStatus('', '');
            return;
        }

        if (!ratesData) {
            select.disabled = true;
            setStatus(MESSAGES.loading, 'loading');
            try {
                ratesData = await fetchRates();
            } catch (error) {
                fallbackToRubles(error);
                return;
            } finally {
                select.disabled = false;
            }
        }

        renderPrices(currency);
        setStatus(rateText(currency), 'ok');
    }

    function init() {
        const saved = loadSavedCurrency();
        const isKnown = Array.from(select.options)
            .some(function (option) {
                return option.value === saved;
            });
        select.value = isKnown ? saved : 'RUB';

        select.addEventListener('change', function () {
            saveCurrency(select.value);
            applyCurrency(select.value);
        });
        applyCurrency(select.value);
    }

    init();
})();
