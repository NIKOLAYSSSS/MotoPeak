/* Проверка формы обратной связи на странице контактов. */
(function () {
    'use strict';

    const form = document.getElementById('contact-form');
    if (!form) {
        return;
    }

    const validation = window.FormValidation;
    const successElement =
        document.getElementById('form-success');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const consentInput = document.getElementById('consent');

    const NAME_PATTERN = /^[\p{L}\s'-]+$/u;
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Каждая функция возвращает текст ошибки или пустую строку.
    function checkName(input) {
        const name = input.value.trim();
        if (name === '') {
            return 'Укажите имя.';
        }
        if (name.length < 2) {
            return 'Имя должно содержать не менее 2 символов.';
        }
        if (name.length > 50) {
            return 'Имя не должно быть длиннее 50 символов.';
        }
        if (!NAME_PATTERN.test(name)) {
            return 'Имя может содержать только буквы, '
                + 'пробел и дефис.';
        }
        return '';
    }

    function checkEmail(input) {
        const email = input.value.trim();
        if (email === '') {
            return 'Укажите email.';
        }
        if (!EMAIL_PATTERN.test(email)) {
            return 'Введите адрес в формате name@example.ru.';
        }
        return '';
    }

    function checkMessage(input) {
        const text = input.value.trim();
        if (text === '') {
            return 'Напишите сообщение.';
        }
        if (text.length < 10) {
            return 'Сообщение должно содержать не менее '
                + '10 символов.';
        }
        if (text.length > 1000) {
            return 'Сообщение не должно быть длиннее '
                + '1000 символов.';
        }
        return '';
    }

    function checkConsent(input) {
        return input.checked
            ? ''
            : 'Подтвердите согласие на обработку данных.';
    }

    const fields = [
        { input: nameInput, check: checkName },
        { input: emailInput, check: checkEmail },
        { input: messageInput, check: checkMessage },
        { input: consentInput, check: checkConsent }
    ];

    function validateField(field) {
        const message = field.check(field.input);
        if (message) {
            validation.showFieldError(field.input, message);
        } else {
            validation.clearFieldError(field.input);
        }
        return message === '';
    }

    // Возвращает первое поле с ошибкой или null.
    function validateForm() {
        let firstInvalid = null;
        fields.forEach(function (field) {
            if (!validateField(field) && !firstInvalid) {
                firstInvalid = field.input;
            }
        });
        return firstInvalid;
    }

    fields.forEach(function (field) {
        field.input.addEventListener('blur', function () {
            validateField(field);
        });
        field.input.addEventListener('input', function () {
            successElement.hidden = true;
            if (field.input.getAttribute('aria-invalid')) {
                validateField(field);
            }
        });
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        successElement.hidden = true;

        const firstInvalid = validateForm();
        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        successElement.textContent = 'Спасибо, '
            + nameInput.value.trim() + '! Сообщение принято '
            + '(демонстрация: данные никуда не отправляются).';
        successElement.hidden = false;
        form.reset();
        validation.clearFormErrors(form);
    });
})();
