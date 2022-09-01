// Home Web Component
fetch("../home-component/home.html")
    .then(stream => stream.text())
    .then(html => defineHome(html));

function defineHome(html) {
    class Home extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;
        }
    }

    customElements.define('home-component', Home);
}