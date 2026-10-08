import json
import random
from pathlib import Path

from fastapi import FastAPI, Query, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .api import JobAPIError, get_jobs
from .filters import build_stats, filter_jobs

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(title="Job API Collector")

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static",
)

templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"request": request},
    )


@app.get("/api/jobs")
def jobs(
    search: str = Query("", max_length=100),
    location: str = Query("", max_length=100),
    category: str = Query("", max_length=100),
    job_type: str = Query("", max_length=100),
    remote: bool = False,
    sort: str = Query("latest", pattern="^(latest|oldest|company|random)$"),
    limit: int = Query(100, ge=1, le=100),
):
    try:
        # Fetch a larger pool so refreshes can show a different set instead of
        # repeatedly displaying the same first 50 records from the API.
        all_jobs = get_jobs(search=search, limit=100)
        results = filter_jobs(
            all_jobs,
            keyword="",
            location=location,
            category=category,
            job_type=job_type,
            remote_only=remote,
        )

        # The public API commonly returns a stable first page. Build a rotating
        # pool so refreshing the dashboard does not keep showing the exact same cards.
        if len(results) > 40:
            results = random.sample(results, 40)

        if sort == "random":
            random.shuffle(results)
        elif sort == "company":
            results.sort(key=lambda job: job.get("company", "").lower())
        elif sort == "oldest":
            results.sort(key=lambda job: job.get("published", ""))
        else:
            results.sort(key=lambda job: job.get("published", ""), reverse=True)

        categories = sorted(
            {job.get("category", "Other") for job in all_jobs if job.get("category")}
        )
        job_types = sorted(
            {job.get("job_type", "Unknown") for job in all_jobs if job.get("job_type")}
        )

        return {
            "jobs": results[:limit],
            "total_matches": len(results),
            "stats": build_stats(results),
            "categories": categories,
            "job_types": job_types,
        }

    except JobAPIError as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})


@app.get("/api/jobs/{job_id}")
def job_details(job_id: int):
    try:
        jobs_data = get_jobs(limit=100)
    except JobAPIError as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})

    for job in jobs_data:
        if job.get("id") == job_id:
            return job

    return JSONResponse(status_code=404, content={"error": "Job not found."})


@app.get("/favicon.ico")
def favicon():
    return RedirectResponse(url="/static/favicon.svg")


@app.get("/api/export")
def export_jobs():
    try:
        jobs_data = get_jobs(limit=100)
    except JobAPIError as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})

    export_path = BASE_DIR / "data" / "jobs.json"
    export_path.parent.mkdir(exist_ok=True)
    export_path.write_text(
        json.dumps(jobs_data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    return FileResponse(
        export_path,
        filename="jobs.json",
        media_type="application/json",
    )
