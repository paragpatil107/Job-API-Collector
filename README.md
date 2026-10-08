# Job API Collector

Job API Collector is a small web app I made with Python and FastAPI.

It gets job listings from the Remotive Jobs API and puts them into a searchable dashboard. I added filters, sorting, pagination, JSON export and a separate readable job-details view so it is easier to actually use than a basic API demo.

## Features

- Get live job listings from a public API
- Search by job title, company, category, skills or description
- Filter by location, category, job type and remote status
- Sort by latest, oldest, company or random
- Refresh to get a different rotating set of listings
- Pagination
- Company logo and job information when provided by the API
- View formatted job descriptions in a separate page
- Open the original job posting
- Export fetched jobs as JSON
- Loading and error states

## Tech used

- Python
- FastAPI
- Jinja2
- HTML
- CSS
- JavaScript
- Requests
- REST API
- JSON

## How it works

```text
Browser
   |
   v
FastAPI
   |
   v
Remotive Jobs API
   |
   v
Cleaned job data
   |
   +----> Search / Filters / Sorting
   |
   +----> Job cards / Pagination
   |
   +----> Job details
   |
   +----> JSON export
```

## Project structure

```text
job_api_collector/
|
├── app/
│   ├── __init__.py
│   ├── api.py
│   ├── config.py
│   ├── filters.py
│   └── main.py
├── static/
│   ├── app.js
│   └── style.css
├── templates/
│   └── index.html
├── tests/
│   └── test_filters.py
├── data/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Setup

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Install the packages:

```bash
pip install -r requirements.txt
```

Start the app:

```bash
uvicorn app.main:app --reload
```

Then open:

```text
http://127.0.0.1:8000
```

## API

The project currently uses:

```text
https://remotive.com/api/remote-jobs
```

No API key is required for the current setup.

## Tests

Run:

```bash
pytest
```

## Future improvements

- Add more job APIs
- Store jobs in a database
- Add a database for job history and analytics
- Add more analytics
- Add deployment

## Note

Job listings come from an external API, so the available jobs can change.
