# JobPilot Africa frontend

The React, TypeScript, and Vite dashboard lets candidates explore tech jobs,
compare skills, prepare application documents, track applications and follow-ups,
import resume content, and prepare for interviews. The interface is available in
French and English.

## Development

Start the JobPilot API/web server from the repository root on port 8000, then
start the frontend:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api`
requests to `http://127.0.0.1:8000`.

## Checks and builds

```bash
npm run build
npm run lint
```

`npm run build` runs the TypeScript project build and creates the Vite bundle in
`frontend/dist`. To build the bundle served by the Starlette web app, run this
from the `frontend` directory:

```powershell
npx vite build --outDir ..\src\jobpilot\static
```

The API server serves that production UI from `src/jobpilot/static`.

## Application pack

The application-pack modal previews four editable documents for the selected
candidate and job. Each document can be copied or downloaded separately, or all
four can be downloaded as a ZIP containing the exact edited content. Adding the
job to application tracking is a separate, explicit action; it creates a `saved`
record or reuses the existing record without changing its status. A next action
and follow-up date can then be set. No document is submitted to an employer.

See the [application pack guide](../docs/application-pack.md) and
[PDF resume guide](../docs/resume-pdf.md) for behavior and limitations.
