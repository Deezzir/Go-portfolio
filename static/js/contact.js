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
        }
    }
    customElements.define('contact-component', Contact);
}