// Project Web Component
fetch("../project-component/project.html")
    .then(stream => stream.text())
    .then(html => defineProject(html));

function defineProject(html) {
    class Project extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = html;

            this.filters = this.shadow.querySelectorAll('.filter-btn');
            this.projectCards = this.shadow.querySelectorAll('.project-card');
        }
        
        connectedCallback() {
            this.filters.forEach(btn => { btn.addEventListener('click', () => { this._filterBtn.call(this, btn); }) });
        }

        disconnectedCallback() {
            this.filters.forEach(btn => { btn.removeEventListener('click', () => { this._filterBtn }) });
        }

        _filterBtn(btn) {
            let id = btn.getAttribute('id');
            this.projectCards.forEach(card => {
                if (card.getAttribute('data-tags').includes(id)) {
                    card.classList.remove('hide');
                } else {
                    card.classList.add('hide');
                }
            })
            this.filters.forEach(btn => btn.classList.remove('active'));
            btn.classList.add('active');
        }
    }

    customElements.define('project-component', Project);
}