"""Application logging.

Deliberately avoids logging credentials or chain-of-thought. Tool-level
telemetry (request_id, tool name, duration, error flag) is logged at INFO.
"""
from __future__ import annotations

import logging
import sys

_CONFIGURED = False


def get_logger(name: str) -> logging.Logger:
    global _CONFIGURED
    if not _CONFIGURED:
        _configure()
    return logging.getLogger(name)


def _configure() -> None:
    global _CONFIGURED
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    )
    root = logging.getLogger("smartcrop")
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    # Keep noisy libraries quiet by default.
    logging.getLogger("neo4j").setLevel(logging.WARNING)
    _CONFIGURED = True