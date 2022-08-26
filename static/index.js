var fields = {}; // dict with contact form fields
var navs = {};   // div to hold navigation objects
var links = [];
var filters = [];
var ticking = false;

document.addEventListener("DOMContentLoaded", function () {
    links = document.querySelectorAll('.link');
    filters = document.querySelectorAll('.filter-btn');

    navs.about = document.getElementById('about-section');
    navs.home = document.getElementById('home-section');
    navs.project = document.getElementById('project-section');
    navs.skill = document.getElementById('skill-section');
    navs.contact = document.getElementById('contact-section');

    navs.aboutLink = document.getElementById('about-link');
    navs.homeLink = document.getElementById('home-link');
    navs.projectLink = document.getElementById('project-link');
    navs.skillLink = document.getElementById('skill-link');
    navs.contactLink = document.getElementById('contact-link');

    fields.msg = document.querySelector('.message');
    fields.email = document.querySelector('.email');
    fields.firstName = document.querySelector('.first-name');
    fields.lastName = document.querySelector('.last-name');

    // handle scroll 
    setTimeout(() => {
        document.body.classList.add("loaded");
    }, 350);
    checkScroll();
    setUpScrollEvent();

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
    filters.forEach(btn => { btn.addEventListener('click', () => { filterBtn(btn); }) });

    // Handle contact form button
    document.querySelector('.contact-btn').addEventListener('click', fetchContact);
});

function filterBtn(btn) {
    let id = btn.getAttribute('id');
    let projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        if (card.getAttribute('data-tags').includes(id)) {
            card.classList.remove('hide');
        } else {
            card.classList.add('hide');
        }
    })
    filters.forEach(btn => btn.classList.remove('active'));
    btn.classList.add('active');
}

function setUpScrollEvent() {
    var raf = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame;


    if (raf) {
        document.addEventListener('scroll', (e) => {
            if (!ticking) {
                raf(() => {
                    checkScroll();
                    ticking = false;
                });

                ticking = true;
                changeHash(Array.from(links).find(ele => ele.classList.contains('active')).hash);
            }
        });
    } else {
        window.scroll = () => { ticking = true; };
        setInterval(() => {
            if (scrolling) {
                scrolling = false;
                checkScroll();
            } else {
                changeHash(Array.from(links).find(ele => ele.classList.contains('active')).hash);
            }
        }, 250);
    }
}

function fetchContact() {
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
}

function scrollToSmoothly(pos, time) {
    var currentPos = window.pageYOffset;
    var start = null;
    if (time == null) time = 500;
    pos = +pos, time = +time;
    window.requestAnimationFrame(function step(currentTime) {
        start = !start ? currentTime : start;
        var progress = currentTime - start;
        if (currentPos < pos) {
            window.scrollTo(0, ((pos - currentPos) * progress / time) + currentPos);
        } else {
            window.scrollTo(0, currentPos - ((currentPos - pos) * progress / time));
        }
        if (progress < time) {
            window.requestAnimationFrame(step);
        } else {
            window.scrollTo(0, pos);
        }
    });
}

function changeHash(hash) {
    if (hash == null) return;

    if (hash == '') hash = '#home-section'
    let id = hash.replace(/^.*#/, '');

    const elem = document.getElementById(id)
    elem.id = `${id}-tmp`
    window.location.hash = hash
    elem.id = id
}

function checkScroll() {
    if (navs.home.getBoundingClientRect().bottom >= 100)
        changeActiveNav(navs.homeLink);

    if (navs.project.getBoundingClientRect().top <= 99 && navs.project.getBoundingClientRect().bottom >= 100)
        changeActiveNav(navs.projectLink);

    if (navs.about.getBoundingClientRect().top <= 99 && navs.about.getBoundingClientRect().bottom >= 100)
        changeActiveNav(navs.aboutLink);

    if (navs.skill.getBoundingClientRect().top <= 99 && navs.skill.getBoundingClientRect().bottom >= 200)
        changeActiveNav(navs.skillLink);

    if (navs.contact.getBoundingClientRect().top <= 199 || navs.contact.getBoundingClientRect().bottom <= 800)
        changeActiveNav(navs.contactLink);
}

function changeActiveNav(active) {
    links.forEach(ele => ele.classList.remove('active'));
    active.classList.add('active');
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