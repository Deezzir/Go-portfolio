// Loader Web Component
fetch("../html/loader.html")
    .then(stream => stream.text())
    .then(html => defineLoader(html));

function defineLoader(html) {
    class Loader extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;
        }

        connectedCallback() {
            setTimeout(() => {
                this.shadowRoot.getElementById('loader-wrapper').classList.add("loaded");
            }, 350);
        }
    }

    customElements.define('loader-component', Loader);
}