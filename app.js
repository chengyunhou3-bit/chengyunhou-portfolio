const grid = document.querySelector("#project-grid");
const filters = document.querySelector("#filters");
document.querySelector("#year").textContent = new Date().getFullYear();

let projects = [];

function formatHeroName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const lastName = parts.pop();
  return `${parts.join(" ")}<br><em>${lastName}</em>`;
}

function renderSite(site) {
  document.title = `Portfolio — ${site.name}`;
  document.querySelector("#site-name").textContent = site.name;
  document.querySelector("#hero-name").innerHTML = formatHeroName(site.name);
  document.querySelector("#hero-headline").innerHTML = site.headline;
  document.querySelector("#availability").textContent = site.availability;
  document.querySelector("#portrait-image").src = site.portrait;
  document.querySelector("#portrait-image").alt = `Portrait of ${site.name}`;
  document.querySelector("#portrait-caption").textContent = site.portraitCaption;
  document.querySelector("#hero-intro").textContent = site.intro;
  document.querySelector("#profile-title").innerHTML = site.profileTitle;
  document.querySelector("#profile-bio").textContent = site.profileBio;
  document.querySelector("#profile-facts").innerHTML = site.facts.map((fact, index) => `
    <div><dt data-edit-path="site.facts.${index}.label">${fact.label}</dt><dd data-edit-path="site.facts.${index}.value">${fact.value}</dd></div>
  `).join("");
  document.querySelector("#skill-list").innerHTML = site.skills.map((skill, index) => `
    <li><span>${String(index + 1).padStart(2, "0")}</span><span data-edit-path="site.skills.${index}">${skill}</span></li>
  `).join("");
  document.querySelector("#experience-list").innerHTML = site.experiences.map((item, index) => `
    <div class="experience-row">
      <span data-edit-path="site.experiences.${index}.period">${item.period}</span>
      <h3 data-edit-path="site.experiences.${index}.role">${item.role}</h3>
      <p data-edit-path="site.experiences.${index}.organization">${item.organization}</p>
    </div>
  `).join("");
  document.querySelector("#contact-heading").innerHTML = site.contactHeading;

  const contactLinks = [
    site.email && { label: "Email", url: `mailto:${site.email}` },
    site.linkedin && { label: "LinkedIn", url: site.linkedin },
    site.github && { label: "GitHub", url: site.github },
    site.resume && { label: "Résumé", url: site.resume }
  ].filter(Boolean);
  document.querySelector("#contact-links").innerHTML = contactLinks.map(link => `
    <a href="${link.url}"${link.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${link.label} ↗</a>
  `).join("");
  document.querySelector("#nav-email").href = `mailto:${site.email}`;
  document.querySelector("#footer-name").textContent = site.name.toUpperCase();
  document.querySelector("#footer-location").textContent = site.footerLocation;

  const textBindings = {
    "site-name": "site.name", "hero-headline": "site.headline",
    "availability": "site.availability", "portrait-image": "site.portrait",
    "portrait-caption": "site.portraitCaption", "hero-intro": "site.intro",
    "profile-title": "site.profileTitle", "profile-bio": "site.profileBio",
    "contact-heading": "site.contactHeading",
    "footer-location": "site.footerLocation"
  };
  Object.entries(textBindings).forEach(([id, path]) => { document.querySelector(`#${id}`).dataset.editPath = path; });
  ["hero-headline", "profile-title", "contact-heading"].forEach(id => { document.querySelector(`#${id}`).dataset.editHtml = "true"; });
}

function renderProjectIndex() {
  document.querySelector("#project-index-list").innerHTML = projects.map((project, index) => `
    <li><a href="project.html?id=${encodeURIComponent(project.id)}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong data-edit-path="projects.${index}.title">${project.title}</strong>
      <em data-edit-path="projects.${index}.category">${project.category}</em>
      <b>↗</b>
    </a></li>
  `).join("");
}

function renderProjects(category = "All") {
  const visible = category === "All" ? projects : projects.filter(p => p.category === category);
  if (!visible.length) {
    grid.innerHTML = '<p class="empty">No projects in this category yet.</p>';
    return;
  }
  grid.innerHTML = visible.map((project, index) => {
    const projectIndex = projects.indexOf(project);
    return `
    <a class="project-card" href="project.html?id=${encodeURIComponent(project.id)}">
      <div class="project-cover">
        <img src="${project.cover}" alt="${project.title}" loading="lazy" data-edit-path="projects.${projectIndex}.cover">
        <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="project-meta">
        <div>
          <h3 data-edit-path="projects.${projectIndex}.title">${project.title}</h3>
          <p><span data-edit-path="projects.${projectIndex}.category">${project.category}</span> · <span data-edit-path="projects.${projectIndex}.year">${project.year}</span></p>
        </div>
        <span class="project-arrow">↗</span>
      </div>
    </a>`;
  }).join("");
}

function renderFilters() {
  const categories = ["All", ...new Set(projects.map(p => p.category))];
  filters.innerHTML = categories.map((category, index) => `
    <button class="filter-btn ${index === 0 ? "active" : ""}" type="button" data-category="${category}">${category}</button>
  `).join("");
  filters.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    filters.querySelectorAll("button").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderProjects(button.dataset.category);
  });
}

const visualDraft = new URLSearchParams(location.search).has("visual-edit")
  ? JSON.parse(sessionStorage.getItem("portfolioEditorDraft") || "null")
  : null;

(visualDraft ? Promise.resolve([visualDraft.site, { projects: visualDraft.projects }]) : Promise.all([
  fetch("data/site.json").then(response => {
    if (!response.ok) throw new Error("Could not load site content");
    return response.json();
  }),
  fetch("data/projects.json").then(response => {
    if (!response.ok) throw new Error("Could not load project data");
    return response.json();
  })
]))
  .then(([site, projectData]) => {
    projects = Array.isArray(projectData) ? projectData : projectData.projects;
    renderSite(site);
    renderProjectIndex();
    renderFilters();
    renderProjects();
  })
  .catch(error => {
    console.error(error);
    grid.innerHTML = '<p class="empty">Portfolio content could not be loaded. Please try again later.</p>';
  });
document.documentElement.dataset.appLoaded = "true";
