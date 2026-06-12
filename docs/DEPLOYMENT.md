# Deployment

The site is deployed from the `frontend/` directory through GitHub Pages.

## Expected URL

```text
https://zable-star.github.io/ai-/
```

## GitHub Pages Setup

If the URL is not available yet, open the repository in GitHub and check:

1. Go to `Settings`.
2. Open `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Go to `Actions`.
5. Run or re-run `Deploy GitHub Pages`.

The workflow file is:

```text
.github/workflows/deploy-pages.yml
```

## Local Verification

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/frontend/
```

