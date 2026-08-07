# Portfolio

A static portfolio and résumé website ready for GitHub Pages.

## Local preview

Project data is loaded with `fetch`, so preview the site through a local web server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Editing content

- Profile, skills, and contact details: edit `index.html`
- Project metadata and case-study sections: edit `data/projects.json`
- Colors, typography, and responsive layout: edit `styles.css`
- PDF reports: place them in `reports/`, then set a project's `report` value to a path such as `reports/example.pdf`
- Videos: place compressed MP4 files in `media/`, then add `"video": "media/example.mp4"` to any project section. Optional fields are `poster` and `videoCaption`.

Example project section with video:

```json
{
  "title": "Prototype Walkthrough",
  "content": "A short explanation of what the video demonstrates.",
  "video": "media/project-demo.mp4",
  "poster": "images/project-demo-cover.jpg",
  "videoCaption": "Final interactive prototype, 01:24"
}
```

## GitHub Pages

After pushing the project to GitHub, open **Settings → Pages** in the repository and deploy from the root of the main branch.

## On-site editor

The portfolio includes a Sveltia CMS editor at `/admin/`. It is configured for:

```text
chengyunhou3-bit/chengyunhou-portfolio
```

After the repository exists and the site is deployed:

1. Open `https://chengyunhou3-bit.github.io/chengyunhou-portfolio/admin/`.
2. Choose **Sign In with Token**.
3. Follow the GitHub link shown by the CMS to create a repository-scoped token.
4. Paste the token into the CMS in your own browser. Never send or commit the token.
5. Edit content and save; the CMS commits the changed JSON and uploaded media to GitHub.

Profile, experience, skills, and contact information are stored in `data/site.json`. Projects and case-study sections are stored in `data/projects.json`.
