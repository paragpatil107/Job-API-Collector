from collections import Counter
from typing import Any


def filter_jobs(
    jobs: list[dict[str, Any]],
    keyword: str = "",
    location: str = "",
    category: str = "",
    job_type: str = "",
    remote_only: bool = False,
) -> list[dict[str, Any]]:
    keyword = keyword.strip().lower()
    location = location.strip().lower()
    category = category.strip().lower()
    job_type = job_type.strip().lower()

    results = []

    for job in jobs:
        searchable = " ".join(
            [
                str(job.get("title", "")),
                str(job.get("company", "")),
                str(job.get("category", "")),
                str(job.get("description", "")),
                " ".join(job.get("tags", [])),
            ]
        ).lower()

        job_location = str(job.get("location", "")).lower()
        job_category = str(job.get("category", "")).lower()
        job_kind = str(job.get("job_type", "")).lower()

        if keyword and keyword not in searchable:
            continue
        if location and location not in job_location:
            continue
        if category and category != job_category:
            continue
        if job_type and job_type != job_kind:
            continue
        if remote_only and "remote" not in job_location:
            continue

        results.append(job)

    return results


def build_stats(jobs: list[dict[str, Any]]) -> dict[str, Any]:
    categories = Counter(
        str(job.get("category", "Other")).strip() or "Other" for job in jobs
    )
    remote = sum("remote" in str(job.get("location", "")).lower() for job in jobs)

    return {
        "total": len(jobs),
        "remote": remote,
        "categories": [
            {"name": name, "count": count}
            for name, count in categories.most_common(6)
        ],
    }
