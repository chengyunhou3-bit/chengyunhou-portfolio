const REPO = "chengyunhou3-bit/chengyunhou-portfolio";
const API = `https://api.github.com/repos/${REPO}`;
const TOKEN_KEY = "portfolioEditorToken";
const DRAFT_KEY = "portfolioEditorDraft";

const loginPanel = document.querySelector("#login-panel");
const editorShell = document.querySelector("#editor-shell");
const preview = document.querySelector("#preview");
const toast = document.querySelector("#toast");
let token = sessionStorage.getItem(TOKEN_KEY) || "";
let draft = null;
let changes = new Set();
let selectedPath = "";

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function encodeContent(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value, null, 2) + "\n");
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function encodeFile(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const size = 0x8000;
  for (let i = 0; i < bytes.length; i += size) binary += String.fromCharCode(...bytes.subarray(i, i + size));
  return btoa(binary);
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || `GitHub error ${response.status}`);
  return response.status === 204 ? null : response.json();
}

async function readJson(path) {
  const file = await api(`/contents/${path}?ref=main`);
  const content = atob(file.content.replace(/\s/g, ""));
  const bytes = Uint8Array.from(content, char => char.charCodeAt(0));
  return { data: JSON.parse(new TextDecoder().decode(bytes)), sha: file.sha };
}

async function loadContent() {
  const [site, projects] = await Promise.all([readJson("data/site.json"), readJson("data/projects.json")]);
  draft = { site: site.data, projects: projects.data.projects, shas: { site: site.sha, projects: projects.sha } };
  persistDraft();
}

function persistDraft() {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ site: draft.site, projects: draft.projects }));
}

function getAtPath(path) {
  return path.split(".").reduce((value, key) => value?.[/^\d+$/.test(key) ? Number(key) : key], draft);
}

function setAtPath(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const parent = keys.reduce((object, key) => object[/^\d+$/.test(key) ? Number(key) : key], draft);
  parent[/^\d+$/.test(last) ? Number(last) : last] = value;
  changes.add(path);
  persistDraft();
  updateChanges();
}

function updateChanges() {
  const count = changes.size;
  document.querySelector("#change-count").textContent = count ? `${count} change${count === 1 ? "" : "s"}` : "No changes";
  document.querySelector("#changes-list").innerHTML = [...changes].slice(-10).reverse().map(path => `<div class="change-item">${path}</div>`).join("");
}

function currentProjectIndex() {
  const url = new URL(preview.contentWindow.location.href);
  const id = url.searchParams.get("id");
  return draft.projects.findIndex(project => project.id === id);
}

function previewUrl(path = "index.html") {
  return `../${path}${path.includes("?") ? "&" : "?"}visual-edit=1&t=${Date.now()}`;
}

function reloadPreview(path) {
  persistDraft();
  preview.src = previewUrl(path || "index.html");
}

function currentPreviewPath() {
  const url = new URL(preview.contentWindow.location.href);
  return `${url.pathname.split("/").pop() || "index.html"}${url.search.replace(/([?&])visual-edit=1(&|$)/, "$1").replace(/[?&]t=\d+/, "").replace(/[?&]$/, "")}`;
}

function selectedListInfo() {
  let match = selectedPath.match(/^site\.(skills|experiences|facts)\.(\d+)/);
  if (match) return { array: draft.site[match[1]], index: Number(match[2]), changePath: `site.${match[1]}` };
  match = selectedPath.match(/^projects\.(\d+)\.sections\.(\d+)/);
  if (match) return { array: draft.projects[Number(match[1])].sections, index: Number(match[2]), changePath: `projects.${match[1]}.sections` };
  return null;
}

function updateSelectionActions() {
  document.querySelector("#list-actions").hidden = !selectedListInfo();
}

function activateInlineEditing() {
  const doc = preview.contentDocument;
  if (!doc) return;
  const isProject = preview.contentWindow.location.pathname.endsWith("project.html");
  document.querySelector("#add-section-btn").disabled = !isProject;
  document.querySelector("#add-media-btn").disabled = !isProject;
  document.querySelector("#delete-btn").disabled = !isProject;
  document.querySelector("#move-up-btn").disabled = !isProject;
  document.querySelector("#move-down-btn").disabled = !isProject;

  doc.querySelectorAll("[data-edit-path]").forEach(element => {
    const path = element.dataset.editPath;
    if (element.tagName === "IMG") {
      element.style.cursor = "pointer";
      element.style.outline = "2px dashed rgba(255,92,53,.7)";
      element.addEventListener("click", event => {
        event.preventDefault();
        selectedPath = path;
        document.querySelector("#selection-title").textContent = "Image selected";
        document.querySelector("#selection-help").textContent = path;
        document.querySelector("#selection-actions").hidden = false;
        updateSelectionActions();
      });
      return;
    }
    element.contentEditable = "true";
    element.spellcheck = true;
    element.style.outline = "1px dashed rgba(255,92,53,.4)";
    element.style.outlineOffset = "4px";
    element.addEventListener("focus", () => {
      selectedPath = path;
      document.querySelector("#selection-title").textContent = "Editing text";
      document.querySelector("#selection-help").textContent = path;
      document.querySelector("#selection-actions").hidden = true;
      updateSelectionActions();
    });
    element.addEventListener("input", () => {
      const value = element.dataset.editHtml === "true"
        ? element.innerHTML
        : element.dataset.editList === "true"
          ? element.textContent.split(",").map(item => item.trim()).filter(Boolean)
          : element.textContent.trim();
      setAtPath(path, value);
    });
  });

  doc.querySelectorAll("a").forEach(link => {
    if (!link.href || link.href.startsWith("mailto:")) return;
    link.addEventListener("click", event => {
      if (event.target.closest("[data-edit-path]")) {
        event.preventDefault();
        return;
      }
      const url = new URL(link.href);
      if (url.origin !== location.origin) return;
      event.preventDefault();
      reloadPreview(`${url.pathname.split("/").pop() || "index.html"}${url.search}`);
    });
  });
}

async function saveJson(path, value, sha, message) {
  return api(`/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: encodeContent(value), sha, branch: "main" })
  });
}

async function saveAll() {
  if (!changes.size) return notify("Nothing to save.");
  const button = document.querySelector("#save-btn");
  button.disabled = true;
  button.textContent = "Saving…";
  try {
    const siteResult = await saveJson("data/site.json", draft.site, draft.shas.site, "Update portfolio profile");
    draft.shas.site = siteResult.content.sha;
    const projectsResult = await saveJson("data/projects.json", { projects: draft.projects }, draft.shas.projects, "Update portfolio projects");
    draft.shas.projects = projectsResult.content.sha;
    changes.clear();
    updateChanges();
    notify("Saved. GitHub Pages is rebuilding.");
  } catch (error) {
    notify(`Save failed: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "Save to GitHub";
  }
}

async function uploadSelectedFile(file) {
  const folder = file.type.startsWith("video/") ? "media" : file.type === "application/pdf" ? "reports" : "images/uploads";
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;
  notify("Uploading…");
  await api(`/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `Upload ${file.name}`, content: encodeFile(await file.arrayBuffer()), branch: "main" })
  });
  setAtPath(selectedPath, path);
  reloadPreview(preview.contentWindow.location.pathname.endsWith("project.html") ? `project.html?id=${draft.projects[currentProjectIndex()].id}` : "index.html");
  notify("Uploaded and inserted.");
}

async function openEditor() {
  document.querySelector("#login-status").textContent = "Checking GitHub access…";
  try {
    await api("");
    await loadContent();
    sessionStorage.setItem(TOKEN_KEY, token);
    loginPanel.hidden = true;
    editorShell.hidden = false;
    reloadPreview();
  } catch (error) {
    sessionStorage.removeItem(TOKEN_KEY);
    document.querySelector("#login-status").textContent = error.message;
  }
}

document.querySelector("#login-form").addEventListener("submit", event => {
  event.preventDefault();
  token = document.querySelector("#token").value.trim();
  openEditor();
});
preview.addEventListener("load", activateInlineEditing);
document.querySelector("#home-btn").addEventListener("click", () => reloadPreview());
document.querySelector("#viewport-btn").addEventListener("click", event => {
  const mobile = document.querySelector("#preview-wrap").classList.toggle("mobile");
  event.currentTarget.textContent = mobile ? "Desktop" : "Mobile";
});
document.querySelector("#replace-url-btn").addEventListener("click", () => {
  const value = prompt("Paste an image URL or repository path:", getAtPath(selectedPath) || "");
  if (value) { const path = currentPreviewPath(); setAtPath(selectedPath, value); reloadPreview(path); }
});
document.querySelector("#upload-btn").addEventListener("click", () => document.querySelector("#file-input").click());
document.querySelector("#file-input").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  if (event.target.dataset.mode === "projectMedia") {
    const projectIndex = currentProjectIndex();
    const sectionMatch = selectedPath.match(/^projects\.\d+\.sections\.(\d+)/);
    const sectionIndex = sectionMatch ? Number(sectionMatch[1]) : Math.max(0, draft.projects[projectIndex].sections.length - 1);
    selectedPath = file.type === "application/pdf"
      ? `projects.${projectIndex}.report`
      : file.type.startsWith("video/")
        ? `projects.${projectIndex}.sections.${sectionIndex}.video`
        : `projects.${projectIndex}.sections.${sectionIndex}.image`;
  }
  event.target.dataset.mode = "";
  uploadSelectedFile(file).catch(error => notify(error.message));
});
document.querySelector("#add-project-btn").addEventListener("click", () => {
  const title = prompt("Project title:");
  if (!title) return;
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  draft.projects.push({ id, title, category:"New Project", year:new Date().getFullYear().toString(), summary:"Add a short project summary.", cover:"images/uploads/project-placeholder.jpg", role:"Your role", tools:[], report:"", externalUrl:"", sections:[{ title:"Project Overview", content:"Add the project story here." }] });
  changes.add("projects"); persistDraft(); updateChanges(); reloadPreview(`project.html?id=${id}`);
});
document.querySelector("#add-section-btn").addEventListener("click", () => {
  const index = currentProjectIndex(); if (index < 0) return;
  draft.projects[index].sections.push({ title:"New Section", content:"Click here to add content." });
  changes.add(`projects.${index}.sections`); persistDraft(); updateChanges(); reloadPreview(`project.html?id=${draft.projects[index].id}`);
});
document.querySelector("#add-media-btn").addEventListener("click", () => {
  const input = document.querySelector("#file-input");
  input.dataset.mode = "projectMedia";
  input.accept = "image/*,video/mp4,application/pdf";
  input.click();
});
document.querySelector("#add-skill-btn").addEventListener("click", () => {
  draft.site.skills.push("New skill — click to edit"); changes.add("site.skills"); persistDraft(); updateChanges(); reloadPreview();
});
document.querySelector("#add-experience-btn").addEventListener("click", () => {
  draft.site.experiences.push({ period:"Year — Year", role:"New role", organization:"Organization, Location" });
  changes.add("site.experiences"); persistDraft(); updateChanges(); reloadPreview();
});
function moveSelectedItem(offset) {
  const info = selectedListInfo(); if (!info) return;
  const target = info.index + offset; if (target < 0 || target >= info.array.length) return;
  [info.array[info.index], info.array[target]] = [info.array[target], info.array[info.index]];
  changes.add(`${info.changePath}.order`); persistDraft(); updateChanges(); selectedPath = ""; reloadPreview(currentPreviewPath());
}
document.querySelector("#item-up-btn").addEventListener("click", () => moveSelectedItem(-1));
document.querySelector("#item-down-btn").addEventListener("click", () => moveSelectedItem(1));
document.querySelector("#item-delete-btn").addEventListener("click", () => {
  const info = selectedListInfo(); if (!info || !confirm("Delete the selected item?")) return;
  info.array.splice(info.index, 1); changes.add(info.changePath); persistDraft(); updateChanges(); selectedPath = ""; reloadPreview(currentPreviewPath());
});
function moveProject(offset) {
  const index = currentProjectIndex(); const target = index + offset;
  if (index < 0 || target < 0 || target >= draft.projects.length) return;
  [draft.projects[index], draft.projects[target]] = [draft.projects[target], draft.projects[index]];
  changes.add("projects.order"); persistDraft(); updateChanges(); reloadPreview(`project.html?id=${draft.projects[target].id}`);
}
document.querySelector("#move-up-btn").addEventListener("click", () => moveProject(-1));
document.querySelector("#move-down-btn").addEventListener("click", () => moveProject(1));
document.querySelector("#delete-btn").addEventListener("click", () => {
  const index = currentProjectIndex(); if (index < 0 || !confirm(`Delete “${draft.projects[index].title}”?`)) return;
  draft.projects.splice(index, 1); changes.add("projects"); persistDraft(); updateChanges(); reloadPreview();
});
document.querySelector("#discard-btn").addEventListener("click", async () => {
  if (changes.size && !confirm("Discard all unsaved changes?")) return;
  await loadContent(); changes.clear(); updateChanges(); reloadPreview(); notify("Draft discarded.");
});
document.querySelector("#save-btn").addEventListener("click", saveAll);
document.querySelector("#sign-out-btn").addEventListener("click", () => {
  sessionStorage.clear(); location.reload();
});

if (token) openEditor();
document.documentElement.dataset.editorLoaded = "true";
