import test_all_scenarios
import sys

# Patch the URL to match run.py
test_all_scenarios.BACKEND_URL = "http://localhost:8100"

if __name__ == "__main__":
    # Remove the script name from args so main doesn't get confused if it checks args (it doesn't seem to)
    test_all_scenarios.main()
