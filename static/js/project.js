// Project Web Component
fetch("../html/project.html")
    .then(stream => stream.text())
    .then(html => defineProject(html));

function defineProject(html) {
    class Project extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;
        }
    }

    customElements.define('project-component', Project);
}