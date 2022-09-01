// Experience Web Component
fetch("../html/experience.html")
    .then(stream => stream.text())
    .then(html => defineExperience(html));

function defineExperience(html) {
    class Experience extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;
        }
    }

    customElements.define('experience-component', Experience);
}