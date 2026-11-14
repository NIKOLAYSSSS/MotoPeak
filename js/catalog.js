/* Фильтрация и сортировка каталога без перезагрузки. */
(function () {
    'use strict';

    const form = document.getElementById('filter-form');
    const grid = document.querySelector('.product-grid');
    if (!form || !grid) {
        return;
    }

    const validation = window.FormValidation;
    const cards = Array.from(
        grid.querySelectorAll('.product-card'));
    const categorySelect =
        document.getElementById('category-filter');
    const volumeSelect =
        document.getElementById('volume-filter');
    const sortSelect = document.getElementById('sort-filter');
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const countElement =
        document.getElementById('result-count');
    const emptyMessage =
        document.getElementById('empty-message');

    // Границы объема двигателя, см³ (нижняя граница не входит).
    const VOLUME_RANGES = {
        all: { min: -1, max: Infinity },
        '125': { min: -1, max: 125 },
        '400': { min: 125, max: 400 },
        '750': { min: 400, max: 750 },
        max: { min: 750, max: Infinity }
    };

    cards.forEach(function (card, index) {
        card.dataset.index = index;
    });

    function getCardPrice(card) {
        const priceElement = card.querySelector('.price');
        return Number(priceElement.dataset.priceRub);
    }

    function readPrice(input) {
        const raw = input.value.trim();
        // В числовом поле нечисловой ввод дает пустое value.
        if (input.validity.badInput
                || Number.isNaN(Number(raw))) {
            return { value: null, error: 'Введите число.' };
        }
        if (raw === '') {
            return { value: null, error: '' };
        }
        if (Number(raw) < 0) {
            return {
                value: null,
                error: 'Цена не может быть отрицательной.'
            };
        }
        return { value: Number(raw), error: '' };
    }

    // Возвращает границы цены или null, если есть ошибки ввода.
    function validatePriceFields() {
        validation.clearFormErrors(form);
        const minPrice = readPrice(priceMinInput);
        const maxPrice = readPrice(priceMaxInput);
        let isValid = true;

        if (minPrice.error) {
            validation.showFieldError(priceMinInput,
                minPrice.error);
            isValid = false;
        }
        if (maxPrice.error) {
            validation.showFieldError(priceMaxInput,
                maxPrice.error);
            isValid = false;
        }
        if (isValid && minPrice.value !== null
                && maxPrice.value !== null
                && minPrice.value > maxPrice.value) {
            validation.showFieldError(priceMaxInput,
                'Максимум не может быть меньше минимума.');
            isValid = false;
        }
        return isValid
            ? { min: minPrice.value, max: maxPrice.value }
            : null;
    }

    function matchesFilters(card, filters) {
        const volume = Number(card.dataset.volume);
        const price = getCardPrice(card);
        const range = VOLUME_RANGES[filters.volume];

        return (filters.category === 'all'
                || card.dataset.category === filters.category)
            && volume > range.min && volume <= range.max
            && (filters.minPrice === null
                || price >= filters.minPrice)
            && (filters.maxPrice === null
                || price <= filters.maxPrice);
    }

    function compareCards(sortMode) {
        return function (first, second) {
            if (sortMode === 'price-asc') {
                return getCardPrice(first)
                    - getCardPrice(second);
            }
            if (sortMode === 'price-desc') {
                return getCardPrice(second)
                    - getCardPrice(first);
            }
            return first.dataset.index - second.dataset.index;
        };
    }

    function applyFilters() {
        const prices = validatePriceFields();
        if (!prices) {
            return;
        }
        const filters = {
            category: categorySelect.value,
            volume: volumeSelect.value,
            minPrice: prices.min,
            maxPrice: prices.max
        };
        let visibleCount = 0;

        cards.slice().sort(compareCards(sortSelect.value))
            .forEach(function (card) {
                const isVisible = matchesFilters(card, filters);
                card.hidden = !isVisible;
                grid.appendChild(card);
                if (isVisible) {
                    visibleCount += 1;
                }
            });

        countElement.textContent = 'Найдено моделей: '
            + visibleCount + ' из ' + cards.length;
        emptyMessage.hidden = visibleCount > 0;
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        applyFilters();
    });

    form.addEventListener('reset', function () {
        validation.clearFormErrors(form);
        // Значения полей сбрасываются после события reset.
        setTimeout(applyFilters, 0);
    });

    [categorySelect, volumeSelect, sortSelect]
        .forEach(function (select) {
            select.addEventListener('change', applyFilters);
        });

    [priceMinInput, priceMaxInput].forEach(function (input) {
        input.addEventListener('input', function () {
            validation.clearFieldError(input);
        });
    });

    applyFilters();
})();
