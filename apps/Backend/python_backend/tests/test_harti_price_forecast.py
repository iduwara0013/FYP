from datetime import date, timedelta

from src.services import harti_price_forecast as forecast


def _history(days: int = 12):
    start = date(2026, 8, 1)
    return [
        {
            "date": str(start + timedelta(days=index)),
            "entries": [
                {"cropName": "Tomato", "prices": [str(180 + index), str(200 + index)]},
                {"cropName": "Beans", "prices": [str(400 + index), str(440 + index)]},
            ],
        }
        for index in range(days)
    ]


def test_normalizes_archived_bulletins():
    frame = forecast.bulletins_to_frame(_history(3))
    assert len(frame) == 6
    assert set(frame["crop"]) == {"tomato", "beans"}
    assert frame["price"].min() == 190


def test_trains_and_predicts_with_guarded_artifact(tmp_path, monkeypatch):
    monkeypatch.setattr(forecast, "MODELS_DIR", tmp_path)
    monkeypatch.setattr(forecast, "MODEL_PATH", tmp_path / "model.joblib")
    monkeypatch.setattr(forecast, "METADATA_PATH", tmp_path / "metadata.json")
    monkeypatch.setattr(forecast, "MIN_OBSERVATIONS", 10)

    result = forecast.train_from_history(_history())
    assert result["promoted"] is True
    assert result["observations"] == 24

    prediction = forecast.predict_price("Tomato", 3)
    assert prediction["predictedPriceRsPerKg"] > 0
    assert prediction["source"] == "HARTI historical bulletins"


def test_refuses_training_when_history_is_too_small(tmp_path, monkeypatch):
    monkeypatch.setattr(forecast, "MODEL_PATH", tmp_path / "model.joblib")
    monkeypatch.setattr(forecast, "MIN_OBSERVATIONS", 20)
    result = forecast.train_from_history(_history(2))
    assert result["promoted"] is False
    assert result["reason"] == "not_enough_history"
