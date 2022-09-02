//Contact Web Component
fetch("../contact-component/contact.html")
    .then(stream => stream.text())
    .then(html => defineContact(html));

function defineContact(html) {
    class Contact extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;

            this.fields = {}; // dict with contact form fields
            this.error = {}; // dict with contact form fields
        }

        connectedCallback() {
            this._set();

            // Onfocus change validation
            this.shadow.querySelector('.last-name').addEventListener('blur', () => { fieldValidation(this.fields.lastName, this.error.lastName, true, isName); })
            this.shadow.querySelector('.first-name').addEventListener('blur', () => { fieldValidation(this.fields.firstName, this.error.firstName, true, isName); })
            this.shadow.querySelector('.message').addEventListener('blur', () => { fieldValidation(this.fields.msg, this.error.msg, true, isNotEmpty); })
            this.shadow.querySelector('.email').addEventListener('blur', () => { fieldValidation(this.fields.email, this.error.email, true, isEmail); })

            // Handle contact form button
            this.shadow.querySelector('.contact-btn').addEventListener('click', this._fetchContact.bind(this));
            this.shadow.getElementById('close').addEventListener('click', this._closePopup.bind(this));
        }

        disconnectedCallback() {
            this.shadow.querySelector('.last-name').removeEventListener('blur', fieldValidation)
            this.shadow.querySelector('.first-name').removeEventListener('blur', fieldValidation)
            this.shadow.querySelector('.message').removeEventListener('blur', fieldValidation)
            this.shadow.querySelector('.email').removeEventListener('blur', fieldValidation)

            this.shadow.querySelector('.contact-btn').removeEventListener('click', this._fetchContact);
        }

        _closePopup() {
            this.shadow.getElementById('modal').classList.add('closed');
        }

        _set() {
            // Get contact form fields
            this.fields.msg = this.shadow.querySelector('.message');
            this.fields.email = this.shadow.querySelector('.email');
            this.fields.firstName = this.shadow.querySelector('.first-name');
            this.fields.lastName = this.shadow.querySelector('.last-name');

            this.error.msg = this.shadow.getElementById('message');
            this.error.email = this.shadow.getElementById('email');
            this.error.firstName = this.shadow.getElementById('first-name');
            this.error.lastName = this.shadow.getElementById('last-name');

            this.modal = this.shadow.getElementById('modal');
        }

        _isValid() {
            var valid = true;

            valid &= fieldValidation(this.fields.lastName, this.error.lastName, true, isName);
            valid &= fieldValidation(this.fields.firstName, this.error.firstName, true, isName);
            valid &= fieldValidation(this.fields.msg, this.error.msg, true, isNotEmpty);
            valid &= fieldValidation(this.fields.email, this.error.email, true, isEmail);

            return valid;
        }

        _checkResponse(data) {
            if (data.status === 200) {
                this.modal.querySelector('.modal-title').innerHTML = 'Thanks for contacting me!';
                this.fields.msg.value = '';
                this.fields.email.value = '';
                this.fields.firstName.value = '';
                this.fields.lastName.value = '';
            } else {
                this.modal.querySelector('.modal-title').innerHTML = 'Oops, something went wrong!';
            }

            this.modal.classList.remove('closed');
        }

        _fetchContact() {
            if (!this._isValid()) return false;

            fetch('/contact', {
                method: 'post',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    firstname: this.fields.firstName.value,
                    lastname: this.fields.lastName.value,
                    email: this.fields.email.value,
                    msg: this.fields.msg.value,
                })
            })
                .then(data => {
                    this._checkResponse(data);
                })
                .catch(err => {
                    const mute = err
                });
        }
    }
    customElements.define('contact-component', Contact);
}

// Email validation
function isEmail(email) {
    let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return regex.test(String(email).toLowerCase());
}

// General Field validation
function isNotEmpty(value) {
    if (value == null || typeof value == 'undefined') return false;
    return (value.length > 0);
}

// Name validation
function isName(name) {
    let regex = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/;
    return regex.test(String(name).toLowerCase());
}

// Function to validate given field with a given function validator
function fieldValidation(field, error, required, _validate) {
    if (field == null) return false;
    let valid = true;
    let errorMsg = error.innerHTML.substring(0, error.innerHTML.lastIndexOf(' '));

    if (required && !isNotEmpty(field.value)) {
        valid = false;
        error.innerHTML = errorMsg + ' required';
    }

    if (valid && !_validate(field.value)) {
        valid = false;
        error.innerHTML = errorMsg + ' invalid';
    }

    if (!valid) {
        if (error.classList.contains('hidden')) {
            error.classList.remove('hidden');
            setTimeout(function () {
                error.classList.remove('visuallyhidden');
            }, 20);
        }
    } else {
        if (!error.classList.contains('hidden')) {
            error.classList.add('visuallyhidden');
            error.addEventListener('transitionend', function (e) {
                error.classList.add('hidden');
            }, {
                capture: false,
                once: true,
                passive: false
            });
        }
    }

    return valid;
}