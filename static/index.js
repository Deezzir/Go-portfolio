var fields = {};

document.addEventListener("DOMContentLoaded", function () {
    //form
    fields.contactBtn = document.querySelector('.contact-btn');
    fields.msg = document.querySelector('.message');
    fields.email = document.querySelector('.email');
    fields.firstName = document.querySelector('.first-name');
    fields.lastName = document.querySelector('.last-name');

    //toggle button
    fields.toggleBtn = document.querySelector('.toggle-btn');
    fields.linkContainer = document.querySelector('.links-container');


    fields.contactBtn.addEventListener('click', () => {
        if (isValid()) {
            fetch('/contact', {
                method: 'post',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    firstname: fields.firstName.value,
                    lastname: fields.lastName.value,
                    email: fields.email.value,
                    msg: fields.msg.value,
                })
            })
                .then(res => res.json())
                .then(data => {
                    console.log(data)
                })
        }
    })

    fields.toggleBtn.addEventListener('click', () => {
        toggle();
    })

    fields.linkContainer.addEventListener('click', () => {
        toggle();
    })
})

function isEmail(email) {
    let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return regex.test(String(email).toLowerCase());
}

function isNotEmpty(value) {
    if (value == null || typeof value == 'undefined') return false;
    return (value.length > 0);
}

function fieldValidation(field, validationFunction) {
    if (field == null) return false;
    let error = document.getElementById(field.className);

    let isFieldValid = validationFunction(field.value)
    if (!isFieldValid && error.classList.contains('hidden')) {
        error.classList.remove('hidden');
        setTimeout(function () {
            error.classList.remove('visuallyhidden');
        }, 20);
    } else {
        error.classList.add('visuallyhidden');
        error.addEventListener('transitionend', function (e) {
            error.classList.add('hidden');
        }, {
            capture: false,
            once: true,
            passive: false
        });
    }

    return isFieldValid;
}

function isValid() {
    var valid = true;

    valid &= fieldValidation(fields.firstName, isNotEmpty);
    valid &= fieldValidation(fields.lastName, isNotEmpty);
    valid &= fieldValidation(fields.msg, isNotEmpty);
    valid &= fieldValidation(fields.email, isEmail);

    return valid;
}

function toggle() {
    toggleBtn.classList.toggle('active');
    linkContainer.classList.toggle('show');
}