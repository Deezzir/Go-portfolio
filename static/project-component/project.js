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

            this.filters = []; // array with project filters
            this.projectCards = []; // array with project cards
        }

        connectedCallback() {
            this.projectContainer = this.shadow.querySelector('.project-container');
            this._fetchProject();

            this.filters = this.shadow.querySelectorAll('.filter-btn');
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

        _fetchProject() {
            fetch('/project')
                .then(stream => stream.json())
                .then(json => {
                    this._setProject(json);
                    this.projectCards = this.shadow.querySelectorAll('.project-card');
                })
                .catch(err => {
                    //console.log(err);
                });
        }

        _setProject(json) {
            if (json) {
                json.slice(0, 15).forEach(repo => {
                    let card = document.createElement('a');
                    card.classList.add('project-card');
                    card.setAttribute('href', repo.html_url);
                    card.setAttribute('data-tags', repo.topics.join(' ') + ' ' + 'all');
                    card.innerHTML = `
                        <h1 class="project-name">${repo.name}</h1>
                        <div class="content">             
                            <p class="desc">${repo.description}</p>
                            <br/>
                            <p class="tags"><span>Tags</span>: ${repo.topics.join(', ')}</p>
                        </div>
                        <p class="project-lang">${repo.language || ''}</p>
                    `;
                    this.projectContainer.appendChild(card);
                }
                );
                this.projectContainer.classList.add('loaded');
            }
        }
    }

    customElements.define('project-component', Project);
}