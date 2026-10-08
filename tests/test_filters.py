from app.filters import filter_jobs


jobs = [
    {
        "id": 1,
        "title": "Python Developer",
        "company": "ABC",
        "location": "India",
        "category": "Software Development",
        "job_type": "full_time",
        "description": "Python backend development",
    },
    {
        "id": 2,
        "title": "Data Analyst",
        "company": "XYZ",
        "location": "Remote - Worldwide",
        "category": "Data Science",
        "job_type": "full_time",
        "description": "Analyze data",
    },
]


def test_keyword_filter():
    result = filter_jobs(jobs, keyword="python")
    assert len(result) == 1
    assert result[0]["title"] == "Python Developer"


def test_location_filter():
    result = filter_jobs(jobs, location="india")
    assert len(result) == 1
    assert result[0]["company"] == "ABC"


def test_remote_filter():
    result = filter_jobs(jobs, remote_only=True)
    assert len(result) == 1
    assert result[0]["title"] == "Data Analyst"


def test_combined_filter():
    result = filter_jobs(
        jobs,
        keyword="python",
        location="india",
    )
    assert len(result) == 1
