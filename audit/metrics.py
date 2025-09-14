"""Metrics and diff calculation for thin-slice pipeline."""
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

HERE = Path(__file__).parent.resolve()

class MetricsCalculator:
    def __init__(self, run_id: str, output_dir: Path = HERE):
        self.run_id = run_id
        self.output_dir = output_dir
        self.metrics_file = output_dir / "metrics.json"
        self.prev_metrics = self._load_previous_metrics()
    
    def _load_previous_metrics(self) -> Optional[Dict]:
        """Load metrics from previous run if available."""
        try:
            with open(self.metrics_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return None
    
    def calculate(self, cards: list) -> Dict[str, Any]:
        """Calculate metrics from matched cards."""
        metrics = {
            "run_id": self.run_id,
            "timestamp": datetime.utcnow().isoformat(),
            "total_leads": len(cards),
            "matched_leads": 0,
            "abstain_rate": 0.0,
            "demand_tiers": {"high": 0, "medium": 0, "low": 0, "none": 0},
            "top_terms": {},
            "source_distribution": {}
        }
        
        # Count matches and demand tiers
        for card in cards:
            if match := card.get("match"):
                metrics["matched_leads"] += 1
                tier = match.get("demand_tier", "none")
                metrics["demand_tiers"][tier] += 1
                
                # Track sources
                source = card.get("source", "unknown")
                metrics["source_distribution"][source] = metrics["source_distribution"].get(source, 0) + 1
                
                # Track terms from reason
                if reason := match.get("reason", ""):
                    if "terms: " in reason:
                        terms_part = reason.split("terms: ")[1].split(" | ")[0]
                        for term in terms_part.split(", "):
                            term_base = term.split(" (")[0].split("->")[0].strip()
                            metrics["top_terms"][term_base] = metrics["top_terms"].get(term_base, 0) + 1
        
        # Calculate abstain rate
        if metrics["total_leads"] > 0:
            metrics["abstain_rate"] = 1 - (metrics["matched_leads"] / metrics["total_leads"])
        
        # Sort top terms
        metrics["top_terms"] = dict(
            sorted(metrics["top_terms"].items(), key=lambda x: x[1], reverse=True)[:10]
        )
        
        return metrics
    
    def generate_diff_summary(self, current_metrics: Dict) -> str:
        """Generate markdown diff summary vs previous run."""
        if not self.prev_metrics:
            return "No previous metrics found for comparison."
        
        prev = self.prev_metrics
        curr = current_metrics
        
        lines = ["# Metrics Diff Summary\n"]
        
        # Basic stats
        lines.extend([
            f"- Total leads: {prev['total_leads']} → {curr['total_leads']} "
            f"({curr['total_leads'] - prev['total_leads']:+.0f})",
            f"- Matched leads: {prev['matched_leads']} → {curr['matched_leads']} "
            f"({curr['matched_leads'] - prev['matched_leads']:+.0f})",
            f"- Abstain rate: {prev['abstain_rate']:.1%} → {curr['abstain_rate']:.1%} "
            f"({curr['abstain_rate'] - prev['abstain_rate']:+.1%})\n"
        ])
        
        # Demand tiers
        lines.append("## Demand Tiers\n")
        for tier in ["high", "medium", "low", "none"]:
            prev_count = prev["demand_tiers"].get(tier, 0)
            curr_count = curr["demand_tiers"].get(tier, 0)
            lines.append(f"- {tier.title()}: {prev_count} → {curr_count} "
                       f"({curr_count - prev_count:+.0f})")
        
        return "\n".join(lines)
    
    def save_metrics(self, metrics: Dict) -> Path:
        """Save metrics to JSON file."""
        with open(self.metrics_file, "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2)
        return self.metrics_file
    
    def save_diff_summary(self, diff_md: str) -> Path:
        """Save diff summary to markdown file."""
        diff_file = self.output_dir / "diff_summary.md"
        with open(diff_file, "w", encoding="utf-8") as f:
            f.write(diff_md)
        return diff_file
