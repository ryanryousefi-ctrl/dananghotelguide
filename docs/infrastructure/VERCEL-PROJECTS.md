# Vercel projects for this repository

Verified 2026-10-27 (team `ryanryousefi-ctrls-projects`, Hobby plan).

| Vercel project | Role | Domains |
|---|---|---|
| `dananghotelguide-rq9a` | **Production. Keep.** | dananghotelguide.com, www.dananghotelguide.com, dananghotelguide-rq9a.vercel.app |
| `dananghotelguide-33mw` | Duplicate, automatic Git deployments disabled | dananghotelguide-33mw.vercel.app only |
| `dananghotelguide` | Duplicate, automatic Git deployments disabled | dananghotelguide.vercel.app only |

All three were connected to this repository, so every push to `main` was built three times (about 2,600 production deployments in total).

## What was changed

On 2026-10-27 the project setting **Ignored Build Step** (`commandForIgnoringBuildStep`) was set to `exit 0` on the two duplicates only, so their builds are skipped. Nothing was deleted: both projects, their `.vercel.app` domains, their Git connection and every historical deployment remain. `dananghotelguide-rq9a` was not modified.

## How to undo

Clear the Ignored Build Step in each duplicate project (Settings, Git, Ignored Build Step, "Automatic"), or send `PATCH /v9/projects/<id>` with `{"commandForIgnoringBuildStep": null}`.
