var fields = {}; // dict with contact form fields
var scrolling = false;

const links = document.querySelectorAll('.link');

const about = document.getElementById('about-section');
const home = document.getElementById('home-section');
const skill = document.getElementById('skill-section');
const contact = document.getElementById('contact-section');

const aboutLink = document.getElementById('about-link');
const homeLink = document.getElementById('home-link');
const skillLink = document.getElementById('skill-link');
const contactLink = document.getElementById('contact-link');


document.addEventListener("DOMContentLoaded", function () {
    checkScroll();

    window.addEventListener('scroll', () => { scrolling = true; });
    setInterval(() => {
        if (scrolling) {
            scrolling = false;
            checkScroll();
        } else {
            changeHash(Array.from(links).find(ele => ele.classList.contains('active')).hash);
        }
    }, 250);

    fields.msg = document.querySelector('.message');
    fields.email = document.querySelector('.email');
    fields.firstName = document.querySelector('.first-name');
    fields.lastName = document.querySelector('.last-name');

    // //download CV button
    // fields.download = document.querySelector('#download')

    // Onfocus change validation
    document.querySelector('.last-name').addEventListener('blur', () => { fieldValidation(fields.lastName, isNotEmpty); })
    document.querySelector('.first-name').addEventListener('blur', () => { fieldValidation(fields.firstName, isNotEmpty); })
    document.querySelector('.message').addEventListener('blur', () => { fieldValidation(fields.msg, isNotEmpty); })
    document.querySelector('.email').addEventListener('blur', () => { fieldValidation(fields.email, isEmail); })

    // Misk click handlers 
    document.addEventListener('click', function (event) {
        if (event.target.closest(".navbar")) return;
        if (document.querySelector('.links-container').classList.contains('show')) toggle();
    });
    document.querySelector('.toggle-btn').addEventListener('click', toggle);
    document.querySelector('.links-container').addEventListener('click', toggle);

    // Handle contact form button
    document.querySelector('.contact-btn').addEventListener('click', () => {
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
    });
});

function changeHash(hash) {
    if (hash == null) return;
 
    let id = hash.replace(/^.*#/, '');
    if (id === '') id = 'home-section';

    const elem = document.getElementById(id)
    elem.id = `${id}-tmp`
    window.location.hash = hash
    elem.id = id
}

function checkScroll() {
    console.log(contact.getBoundingClientRect().top)
    console.log(contact.getBoundingClientRect().bottom)
    if (home.getBoundingClientRect().bottom >= 100) {
        links.forEach(ele => ele.classList.remove('active'));
        homeLink.classList.add('active');
    }
    if (about.getBoundingClientRect().top <= 99 && about.getBoundingClientRect().bottom >= 50) {
        links.forEach(ele => ele.classList.remove('active'));
        aboutLink.classList.add('active');
    }
    if (skill.getBoundingClientRect().top <= 49 && skill.getBoundingClientRect().bottom >= 50) {
        links.forEach(ele => ele.classList.remove('active'));
        skillLink.classList.add('active');
    }
    if (contact.getBoundingClientRect().bottom <= 800 || contact.getBoundingClientRect().top <= 49) {
        links.forEach(ele => ele.classList.remove('active'));
        contactLink.classList.add('active');
    }
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
    if (!isFieldValid || error.classList.contains('hidden')) {
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

// Validate all fields
function isValid() {
    var valid = true;

    valid &= fieldValidation(fields.lastName, isNotEmpty);;
    valid &= fieldValidation(fields.firstName, isNotEmpty);;
    valid &= fieldValidation(fields.msg, isNotEmpty);;
    valid &= fieldValidation(fields.email, isEmail);

    return valid;
}

// Toggle navbar
function toggle() {
    document.querySelector('.toggle-btn').classList.toggle('active');
    document.querySelector('.links-container').classList.toggle('show');
}