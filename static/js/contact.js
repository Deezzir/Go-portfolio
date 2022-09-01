//Contact Web Component
fetch("../html/contact.html")
    .then(stream => stream.text())
    .then(html => defineContact(html));

function defineContact(html) {
    class Contact extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;

            this.fields = {}; // dict with contact form fields
        }

        connectedCallback() {
            this._set();

            // Onfocus change validation
            this.shadow.querySelector('.last-name').addEventListener('blur', () => { fieldValidation(this.fields.fields.lastName, isNotEmpty); })
            this.shadow.querySelector('.first-name').addEventListener('blur', () => { fieldValidation(this.fields.fields.firstName, isNotEmpty); })
            this.shadow.querySelector('.message').addEventListener('blur', () => { fieldValidation(this.fields.ields.msg, isNotEmpty); })
            this.shadow.querySelector('.email').addEventListener('blur', () => { fieldValidation(this.fields.fields.email, isEmail); })

            // Handle contact form button
            this.shadow.querySelector('.contact-btn').addEventListener('click', this._fetchContact);
        }

        disconnectedCallback() {
            this.shadow.querySelector('.contact-btn').removeEventListener('click', this._fetchContact);

        }

        _set() {
            // Get contact form fields
            this.fields.msg = this.shadow.querySelector('.message');
            this.fields.email = this.shadow.querySelector('.email');
            this.fields.firstName = this.shadow.querySelector('.first-name');
            this.fields.lastName = this.shadow.querySelector('.last-name');
        }

        _fetchContact() {
            if (this._isValid()) {
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
                    .then(res => res.json())
                    .then(data => {
                        console.log(data)
                    })
            }
        }

        // Validate all fields
        _isValid() {
            var valid = true;

            valid &= fieldValidation(this.fields.lastName, isNotEmpty);;
            valid &= fieldValidation(this.fields.firstName, isNotEmpty);;
            valid &= fieldValidation(this.fields.msg, isNotEmpty);;
            valid &= fieldValidation(this.fields.email, isEmail);

            return valid;
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

// Function to validate given field with a given function validator
function fieldValidation(field, validationFunction) {
    if (field == null) return false;
    let error = document.getElementById(field.className);

    let isFieldValid = validationFunction(field.value)
    if (!isFieldValid) {
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

    return isFieldValid;
}

// const projectContainer = document.querySelector('.project-container');
// projects.forEach(project => {
//     projectContainer.innerHTML += `
//     <div class="project-card" data-tags="#all, ${project.tags}">
//         <img src="img/${project.image}" alt="">
//         <div class="content">
//             <h1 class="project-name">${project.name}</h1>
//             <span class="tags">${project.tags}</span>
//         </div>
//     </div>
//     `;
// })