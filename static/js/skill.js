// Skill Web Component
fetch("../html/skill.html")
    .then(stream => stream.text())
    .then(html => defineSkill(html));

function defineSkill(html) {
    class Skill extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;
        }
    }
    customElements.define('skill-component', Skill);
}