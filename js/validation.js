/* Общие функции показа ошибок проверки форм. */
(function () {
    'use strict';

    function getErrorElement(field) {
        return document.getElementById(field.id + '-error');
    }

    function showFieldError(field, message) {
        const errorElement = getErrorElement(field);
        if (errorElement) {
            errorElement.textContent = message;
        }
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');
    }

    function clearFieldError(field) {
        const errorElement = getErrorElement(field);
        if (errorElement) {
            errorElement.textContent = '';
        }
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
    }

    function clearFormErrors(form) {
        form.querySelectorAll('[aria-invalid="true"]')
            .forEach(function (field) {
                clearFieldError(field);
            });
    }

    window.FormValidation = {
        showFieldError: showFieldError,
        clearFieldError: clearFieldError,
        clearFormErrors: clearFormErrors
    };
})();
