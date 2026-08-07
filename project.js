const container = document.querySelector("#project-detail");
document.querySelector("#year").textContent = new Date().getFullYear();
const projectId = new URLSearchParams(window.location.search).get("id");

function renderProject(project) {
  document.title = `${project.title} — Portfolio`;
  container.innerHTML = `
    <article>
      <div class="detail-hero">
        <div>
          <div class="section-label">${project.category} / ${project.year}</div>
          <h1>${project.title}</h1>
        </div>
        <p class="detail-summary">${project.summary}</p>
      </div>
      <img class="detail-cover" src="${project.cover}" alt="${project.title}">
      <div class="detail-info">
        <div class="info-item"><span>Role</span>${project.role}</div>
        <div class="info-item"><span>Year</span>${project.year}</div>
        <div class="info-item"><span>Tools</span>${project.tools.join(", ")}</div>
      </div>
      <div class="detail-body">
        ${project.sections.map(section => `
          <section>
            <h2>${section.title}</h2>
            <p>${section.content}</p>
            ${section.image ? `<img src="${section.image}" alt="${section.title}" loading="lazy">` : ""}
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

Promise.all([
  fetch("data/site.json").then(response => response.json()),
  fetch("data/projects.json").then(response => response.json())
])
  .then(([site, data]) => {
    document.querySelector("#detail-site-name").textContent = site.name;
    document.querySelector("#detail-footer-name").textContent = site.name.toUpperCase();
    const projects = Array.isArray(data) ? data : data.projects;
    const project = projects.find(item => item.id === projectId);
    if (!project) throw new Error("Project not found");
    renderProject(project);
  })
  .catch(() => {
    container.innerHTML = '<div class="not-found"><p class="section-label">404 / NOT FOUND</p><h1>This project could not be found.</h1><a class="report-link" href="index.html#work">Back to selected work</a></div>';
  });
