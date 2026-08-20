"""API smoke tests using FastAPI's TestClient (no external credentials)."""
from fastapi.testclient import TestClient

from src.api import app
from src.agent import service

client = TestClient(app)


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ai_health_returns_integration_status():
    response = client.get("/api/ai/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "llm" in body
    assert "neo4j" in body


def test_tools_listed():
    response = client.get("/tools")
    assert response.status_code == 200
    names = response.json()["tools"]
    assert "get_crop_relationships" in names


def test_ai_chat_returns_crop_recommendations_in_deterministic_mode(monkeypatch):
    monkeypatch.setattr(service, "generate_explanation", lambda *args, **kwargs: "Deterministic explanation")
    monkeypatch.setattr(
        service,
        "build_recommendations",
        lambda **kwargs: {
            "scored": [
                {
                    "cropId": "tomato",
                    "cropName": "Tomato",
                    "score": 88.0,
                    "predictedYield": 12.5,
                    "marketPrice": 180.0,
                    "expectedDemand": 45.0,
                    "expectedSupply": 20.0,
                    "demandGap": 25.0,
                    "expectedGrossRevenue": 225000.0,
                    "competitionLevel": "Low",
                    "riskLevel": "Low",
                    "reason": "Strong demand and low competition.",
                    "dataStatus": "ESTIMATED",
                    "factors": {
                        "yieldScore": 62.5,
                        "priceScore": 60.0,
                        "demandScore": 37.5,
                        "supplyGapScore": 77.8,
                        "competitionScore": 85.0,
                        "weatherScore": 70.0,
                        "revenueScore": 22.5,
                        "riskScore": 10.0,
                    },
                },
                {
                    "cropId": "cabbage",
                    "cropName": "Cabbage",
                    "score": 72.0,
                    "predictedYield": 10.0,
                    "marketPrice": 130.0,
                    "expectedDemand": 30.0,
                    "expectedSupply": 18.0,
                    "demandGap": 12.0,
                    "expectedGrossRevenue": 130000.0,
                    "competitionLevel": "Medium",
                    "riskLevel": "Medium",
                    "reason": "Balanced option.",
                    "dataStatus": "ESTIMATED",
                    "factors": {
                        "yieldScore": 50.0,
                        "priceScore": 43.3,
                        "demandScore": 25.0,
                        "supplyGapScore": 70.0,
                        "competitionScore": 55.0,
                        "weatherScore": 65.0,
                        "revenueScore": 13.0,
                        "riskScore": 35.0,
                    },
                },
            ],
            "data_sources": [
                {"source": "catalog", "timestamp": "", "status": "ESTIMATED", "url": ""}
            ],
            "warnings": [],
        },
    )

    response = client.post(
        "/api/ai/chat",
        json={
            "message": "What should I grow in Kandy?",
            "language": "en",
            "location": "Kandy",
            "cultivatedArea": 1.0,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["requestId"].startswith("REQ-")
    assert body["type"] == "crop_recommendation"
    assert "best option is Tomato" in body["message"]
    assert len(body["recommendations"]) == 2
    assert body["recommendations"][0]["cropName"] == "Tomato"
    assert body["recommendations"][0]["reason"] == "Deterministic explanation"
    assert body["dataSources"][0]["source"] == "catalog"


def test_ai_chat_market_question_hides_recommendation_tiles(monkeypatch):
    monkeypatch.setattr(service, "generate_explanation", lambda *args, **kwargs: "Deterministic explanation")
    monkeypatch.setattr(
        service,
        "build_recommendations",
        lambda **kwargs: {
            "scored": [
                {
                    "cropId": "tomato",
                    "cropName": "Tomato",
                    "score": 88.0,
                    "predictedYield": 12.5,
                    "marketPrice": 180.0,
                    "expectedDemand": 45.0,
                    "expectedSupply": 20.0,
                    "demandGap": 25.0,
                    "expectedGrossRevenue": 225000.0,
                    "competitionLevel": "Low",
                    "riskLevel": "Low",
                    "reason": "Strong demand and low competition.",
                    "dataStatus": "ESTIMATED",
                    "factors": {
                        "yieldScore": 62.5,
                        "priceScore": 60.0,
                        "demandScore": 37.5,
                        "supplyGapScore": 77.8,
                        "competitionScore": 85.0,
                        "weatherScore": 70.0,
                        "revenueScore": 22.5,
                        "riskScore": 10.0,
                    },
                }
            ],
            "data_sources": [
                {"source": "catalog", "timestamp": "", "status": "ESTIMATED", "url": ""}
            ],
            "warnings": [],
        },
    )

    response = client.post(
        "/api/ai/chat",
        json={
            "message": "Tell me market prices in Kandy",
            "language": "en",
            "location": "Kandy",
            "cultivatedArea": 1.0,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "market_price"
    assert "Tomato: Rs.180/kg" in body["message"]
    assert body["recommendations"] == []


def test_ai_chat_general_question_uses_llm_answer(monkeypatch):
    monkeypatch.setattr(service, "generate_general_answer", lambda *args, **kwargs: "OOP stands for Object-Oriented Programming.")
    monkeypatch.setattr(
        service,
        "build_recommendations",
        lambda **kwargs: {
            "scored": [],
            "data_sources": [
                {"source": "catalog", "timestamp": "", "status": "ESTIMATED", "url": ""}
            ],
            "warnings": [],
        },
    )

    response = client.post(
        "/api/ai/chat",
        json={
            "message": "What is OOP?",
            "language": "en",
            "location": "Kandy",
            "cultivatedArea": 1.0,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "general_question"
    assert body["message"] == "OOP stands for Object-Oriented Programming."
    assert body["recommendations"] == []
