// Footer Web Component
fetch("../footer-component/footer.html")
    .then(stream => stream.text())
    .then(html => defineFooter(html));

function defineFooter(html) {
    class Footer extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;
        }
    }

    customElements.define('footer-component', Footer);
}