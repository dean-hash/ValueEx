# ValueX Live Data Pipeline

This pipeline fetches recent discussions from Hacker News and GitHub, analyzes them for potential demand signals, and matches them with relevant offers.

## Prerequisites

- Python 3.8+
- PowerShell 5.1+ (for Windows) or Bash (for Linux/macOS)
- (Optional) GitHub Personal Access Token for higher rate limits

## Setup

1. **Install Python dependencies**:
   ```bash
   pip install requests python-dotenv
   ```

2. **Set up GitHub Token (optional but recommended)**:
   - Create a Personal Access Token (classic) at https://github.com/settings/tokens
   - No special permissions are needed (public access is enough)
   - Set it as an environment variable:
     - Windows (PowerShell):
       ```powershell
       $env:GITHUB_TOKEN="your_token_here"
       ```
     - Linux/macOS:
       ```bash
       export GITHUB_TOKEN="your_token_here"
       ```

## Running the Pipeline

### Windows (PowerShell)

```powershell
# Run the full pipeline
.\audit\run_live.ps1

# Or run individual components
python audit\sources\hn.py
python audit\sources\github.py
python audit\thin_slice_v2.py --input-jsonl data\live\comments.jsonl --out data\live\previews.csv
```

### Linux/macOS (Bash)

```bash
# Make scripts executable
chmod +x audit/run_live.sh
chmod +x audit/sources/*.py

# Run the full pipeline
./audit/run_live.sh
```

## Output Files

- `data/live/hn.jsonl`: Raw Hacker News comments
- `data/live/github.jsonl`: Raw GitHub issue comments
- `data/live/comments.jsonl`: Merged comments from all sources
- `data/live/previews.csv`: Processed matches with scores and metadata

## Understanding the Output

The previews CSV contains these key columns:

- `source`: Data source (hn, github)
- `resonance2`: Overall score (0-100)
- `constraint_types`: Types of constraints (time|budget|access|location)
- `url`: Link to the original post
- `routed_offer`: Best matching offer URL
- `reason`: Why this match was made
- `extract_snippet`: Preview of the content
- `goal_present`: Whether a goal is mentioned
- `need_intensity`: How strongly the need is expressed (0-25)
- `constraint_strength`: How constrained the request is (0-25)
- `freshness`: How recent the post is (0-20)
- `solvability`: How solvable the request appears (0-20)
- `contactability`: How easy it is to contact the author (0-10)

## Troubleshooting

### Rate Limiting

- **GitHub API**: Unauthenticated requests are limited to 60 requests per hour. Set `GITHUB_TOKEN` to increase this to 5,000 requests per hour.
- **Hacker News**: No API key needed, but be respectful of their servers.

### Common Issues

1. **No data found**:
   - Check if the time window is too narrow (default is last 24-48 hours)
   - Verify API endpoints are accessible from your network

2. **Permission errors**:
   - Ensure the script has write access to the output directories
   - On Windows, run PowerShell as Administrator if needed

3. **Python module errors**:
   - Make sure all dependencies are installed: `pip install -r requirements.txt`

## Development

### Adding New Data Sources

1. Create a new Python script in `sources/` that:
   - Fetches data from the source
   - Outputs to `data/live/[source].jsonl`
   - Uses the standard JSONL format

2. The script will be automatically picked up by `run_live.ps1`

### Modifying Matching Logic

Edit `thin_slice_v2.py` to adjust:
- Scoring weights
- Matching thresholds
- Output format
