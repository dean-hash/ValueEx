PY=python

api:
	uvicorn app.main:app --reload --port 8000

run:
	$(PY) ingest/runner.py

sample:
	$(PY) qa/sample_labeler.py

daily:
	$(PY) ingest/runner.py --once
