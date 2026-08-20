"""Agent entry point — exposes a clean API to invoke the LangGraph pipeline."""
from __future__ import annotations

from typing import Any

from src.agent.nodes import build_graph
from src.agent.service import generate_explanation
from src.agent.state import AgentState

_graph = None


def _get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


def run_recommendation_agent(farmer_input: dict[str, Any]) -> dict[str, Any]:
    """Run the crop recommendation agent end-to-end."""
    initial_state: AgentState = {"farmer_input": farmer_input}

    try:
        graph = _get_graph()
        result = graph.invoke(initial_state)
        top = list(result.get("top_crops", []))
        for rec in top:
            factors = rec.get("factors") or {}
            explanation = generate_explanation(
                rec.get("cropName", rec.get("crop", "")),
                rec.get("explanation", ""),
                factors,
                str(farmer_input.get("language", "en")),
            )
            if explanation:
                rec["explanation"] = explanation
        return {
            "recommendations": result.get("recommendations", []),
            "top_crops": top,
            "farmerContext": farmer_input,
            "season": farmer_input.get("season", "Yala"),
            "year": farmer_input.get("year", 2026),
            "generatedAt": __import__("datetime").datetime.now().isoformat(),
            "completed": result.get("completed", False),
        }
    except Exception as error:
        return {
            "recommendations": [],
            "top_crops": [],
            "farmerContext": farmer_input,
            "season": farmer_input.get("season", "Yala"),
            "year": farmer_input.get("year", 2026),
            "generatedAt": __import__("datetime").datetime.now().isoformat(),
            "completed": False,
            "error": str(error),
        }