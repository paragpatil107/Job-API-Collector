from typing import Any

import requests

from .config import API_TIMEOUT, API_URL


class JobAPIError(Exception):
    pass


def get_jobs(search: str = "", limit: int = 100) -> list[dict[str, Any]]:
    params = {"limit": max(1, min(limit, 100))}

    if search.strip():
        params["search"] = search.strip()

    try:
        response = requests.get(
            API_URL,
            params=params,
            timeout=API_TIMEOUT,
            headers={"User-Agent": "JobAPICollector/2.0"},
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        raise JobAPIError("Could not connect to the job API.") from exc
    except ValueError as exc:
        raise JobAPIError("The API returned invalid JSON.") from exc

    jobs = data.get("jobs")

    if not isinstance(jobs, list):
        raise JobAPIError("Unexpected response from the job API.")

    return [clean_job(job) for job in jobs]


def clean_job(job: dict[str, Any]) -> dict[str, Any]:
    tags = job.get("tags", [])
    if not isinstance(tags, list):
        tags = []

    return {
        "id": job.get("id"),
        "title": str(job.get("title", "Unknown title")).strip(),
        "company": str(job.get("company_name", "Unknown company")).strip(),
        "location": str(job.get("candidate_required_location", "Remote")).strip(),
        "category": str(job.get("category", "Other")).strip(),
        "job_type": str(job.get("job_type", "Unknown")).strip(),
        "url": str(job.get("url", "")).strip(),
        "published": str(job.get("publication_date", "")).strip(),
        "description": str(job.get("description", "")).strip(),
        "salary": str(job.get("salary", "")).strip(),
        "logo": str(job.get("company_logo", "")).strip(),
        "tags": [str(tag).strip() for tag in tags if str(tag).strip()],
    }
