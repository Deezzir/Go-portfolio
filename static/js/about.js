// About Web Component
fetch("../html/about.html")
    .then(stream => stream.text())
    .then(html => defineAbout(html));

function defineAbout(html) {
    class About extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;
        }
    }

    customElements.define('about-component', About);
}