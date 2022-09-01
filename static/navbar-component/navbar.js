// Navbar Web Component
fetch("../navbar-component/navbar.html")
    .then(stream => stream.text())
    .then(html => defineNavbar(html));

function defineNavbar(html) {
    class Navbar extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;

            this.navs = {};
            this.links = {};

        }
        
        connectedCallback() {
            this._set();
            this._checkScroll();
            this._setUpScrollEvent();

            this.toggleBtn.addEventListener('click', this._toggle.bind(this));
            this.linksContainer.addEventListener('click', this._toggle.bind(this));
            document.addEventListener('click', (e) => { this._outOfFocus(e); });
        }

        disconnectedCallback() {
            this.toggleBtn.removeEventListener('click', this._toggle);
            this.linksContainer.removeEventListener('click', this._toggle);
            document.removeEventListener('scroll', this._outOfFocus);
        }

        _outOfFocus(e) {
            if (e.target.closest("#navbar")) return;
            if (this.linksContainer.classList.contains('show')) this._toggle();
        }

        _changeHash(hash) {
            if (hash == null) return;
        
            if (hash == '') hash = '#home'
            let id = hash.replace(/^.*#/, '');
        
            const elem = document.getElementById(id)
            elem.id = `${id}-tmp`
            window.location.hash = hash
            elem.id = id
        }

        _set() {
            this.ticking = false;
            this.toggleBtn = this.shadow.querySelector('.toggle-btn');
            this.linksContainer = this.shadow.querySelector('.links-container');

            this.navs.home = document.getElementById('home');
            this.navs.exp = document.getElementById('experience');
            this.navs.project = document.getElementById('projects');
            this.navs.about = document.getElementById('about');
            this.navs.skill = document.getElementById('skills');
            this.navs.contact = document.getElementById('contact');

            this.links.aboutLink = this.shadow.getElementById('about-link');
            this.links.homeLink = this.shadow.getElementById('home-link');
            this.links.expLink = this.shadow.getElementById('experience-link');
            this.links.projectLink = this.shadow.getElementById('project-link');
            this.links.skillLink = this.shadow.getElementById('skill-link');
            this.links.contactLink = this.shadow.getElementById('contact-link');
        }

        _setUpScrollEvent() {
            var raf = window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                window.oRequestAnimationFrame;


            if (raf) {
                document.addEventListener('scroll', (e) => {
                    if (!this.ticking) {
                        raf(() => {
                            this._checkScroll();
                            this.ticking = false;
                        });

                        this.ticking = true;
                        this._changeHash(Object.values(this.links).find(ele => ele.classList.contains('active')).hash);
                    }
                });
            } else {
                window.scroll = () => { ticking = true; };
                setInterval(() => {
                    if (this.ticking) {
                        this.ticking = false;
                        checkScroll();
                    } else {
                        this._changeHash(Object.values(this.links).find(ele => ele.classList.contains('active')).hash);
                    }
                }, 250);
            }
        }

        _changeActiveNav(active) {
            Object.values(this.links).forEach(ele => ele.classList.remove('active'));
            active.classList.add('active');
        }

        _checkScroll() {
            if (this.navs.home.getBoundingClientRect().bottom >= 100)
                this._changeActiveNav(this.links.homeLink);

            else if (this.navs.exp.getBoundingClientRect().top <= 99 && this.navs.exp.getBoundingClientRect().bottom >= 100)
                this._changeActiveNav(this.links.expLink);

            else if (this.navs.project.getBoundingClientRect().top <= 99 && this.navs.project.getBoundingClientRect().bottom >= 100)
                this._changeActiveNav(this.links.projectLink);

            else if (this.navs.about.getBoundingClientRect().top <= 99 && this.navs.about.getBoundingClientRect().bottom >= 100)
                this._changeActiveNav(this.links.aboutLink);

            else if (this.navs.skill.getBoundingClientRect().top <= 99 && this.navs.skill.getBoundingClientRect().bottom >= 200)
                this._changeActiveNav(this.links.skillLink);

            else if (this.navs.contact.getBoundingClientRect().top <= 199 || this.navs.contact.getBoundingClientRect().bottom <= 800)
                this._changeActiveNav(this.links.contactLink);
        }

        _toggle() {
            this.toggleBtn.classList.toggle('active');
            this.linksContainer.classList.toggle('show');
        }
    }

    customElements.define('navbar-component', Navbar);
}