import os

from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv(
    "JOB_API_URL",
    "https://remotive.com/api/remote-jobs",
)

API_TIMEOUT = int(os.getenv("JOB_API_TIMEOUT", "15"))
