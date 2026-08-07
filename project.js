const container = document.querySelector("#project-detail");
document.querySelector("#year").textContent = new Date().getFullYear();
const projectId = new URLSearchParams(window.location.search).get("id");

function renderProject(project, projectIndex) {
  document.title = `${project.title} — Portfolio`;
  container.innerHTML = `
    <article>
      <div class="detail-hero">
        <div>
          <div class="section-label"><span data-edit-path="projects.${projectIndex}.category">${project.category}</span> / <span data-edit-path="projects.${projectIndex}.year">${project.year}</span></div>
          <h1 data-edit-path="projects.${projectIndex}.title">${project.title}</h1>
        </div>
        <p class="detail-summary" data-edit-path="projects.${projectIndex}.summary">${project.summary}</p>
      </div>
      <img class="detail-cover" src="${project.cover}" alt="${project.title}" data-edit-path="projects.${projectIndex}.cover">
      <div class="detail-info">
        <div class="info-item"><span>Role</span><b data-edit-path="projects.${projectIndex}.role">${project.role}</b></div>
        <div class="info-item"><span>Year</span><b data-edit-path="projects.${projectIndex}.year">${project.year}</b></div>
        <div class="info-item"><span>Tools</span><b data-edit-path="projects.${projectIndex}.tools" data-edit-list="true">${project.tools.join(", ")}</b></div>
      </div>
      <div class="detail-body">
        ${project.sections.map((section, sectionIndex) => `
          <section>
            <h2 data-edit-path="projects.${projectIndex}.sections.${sectionIndex}.title">${section.title}</h2>
            <p data-edit-path="projects.${projectIndex}.sections.${sectionIndex}.content">${section.content}</p>
            ${section.image ? `<img src="${section.image}" alt="${section.title}" loading="lazy" data-edit-path="projects.${projectIndex}.sections.${sectionIndex}.image">` : ""}
            ${section.video ? `
              <video class="detail-video" controls playsinline preload="metadata" ${section.poster ? `poster="${section.poster}"` : ""}>
                <source src="${section.video}" type="video/mp4">
                Your browser does not support embedded video.
              </video>
              ${section.videoCaption ? `<p class="video-caption">${section.videoCaption}</p>` : ""}
            ` : ""}
          </section>
        `).join("")}
        ${project.report ? `<a class="report-link" href="${project.report}" target="_blank" rel="noopener">View full report ↗</a>` : ""}
        ${project.externalUrl ? `<a class="report-link" href="${project.externalUrl}" target="_blank" rel="noopener">View project link ↗</a>` : ""}
      </div>
    </article>
  `;
}

const visualDraft = new URLSearchParams(location.search).has("visual-edit")
  ? JSON.parse(sessionStorage.getItem("portfolioEditorDraft") || "null")
  : null;

(visualDraft ? Promise.resolve([visualDraft.site, { projects: visualDraft.projects }]) : Promise.all([
  fetch("data/site.json").then(response => response.json()),
  fetch("data/projects.json").then(response => response.json())
]))
  .then(([site, data]) => {
    document.querySelector("#detail-site-name").textContent = site.name;
    document.querySelector("#detail-footer-name").textContent = site.name.toUpperCase();
    const projects = Array.isArray(data) ? data : data.projects;
    const project = projects.find(item => item.id === projectId);
    if (!project) throw new Error("Project not found");
    renderProject(project, projects.indexOf(project));
  })
  .catch(() => {
    container.innerHTML = '<div class="not-found"><p class="section-label">404 / NOT FOUND</p><h1>This project could not be found.</h1><a class="report-link" href="index.html#work">Back to selected work</a></div>';
  });
document.documentElement.dataset.projectAppLoaded = "true";
