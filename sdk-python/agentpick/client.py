import httpx
from dataclasses import dataclass
from typing import Any

BASE_URL = "https://agentpick.dev"


@dataclass
class SearchMeta:
    tool: str = ""
    latency_ms: int = 0      # snake_case mapping of latencyMs
    result_count: int = 0    # snake_case mapping of resultCount
    strategy: str = ""


class SearchResponse:
    def __init__(self, raw: dict):
        self._raw = raw
        meta_raw = raw.get("meta", {})
        self.meta = SearchMeta(
            tool=meta_raw.get("tool", ""),
            latency_ms=meta_raw.get("latencyMs", 0),
            result_count=meta_raw.get("resultCount", 0),
            strategy=meta_raw.get("strategy", ""),
        )
        self.data = raw.get("data", raw)  # fallback: if no data key, expose whole response

    def __getitem__(self, key):
        return self._raw[key]  # keep dict-style access for backwards compat

    def __repr__(self):
        return f"SearchResponse(tool={self.meta.tool!r}, latency_ms={self.meta.latency_ms}, result_count={self.meta.result_count})"


class AgentPick:
    def __init__(self, api_key: str, base_url: str = BASE_URL):
        self.api_key = api_key
        self.base_url = base_url

    def search(self, query: str, **kwargs) -> SearchResponse:
        response = httpx.post(
            f"{self.base_url}/api/v1/route/search",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"query": query, **kwargs},
            timeout=30,
        )
        response.raise_for_status()
        return SearchResponse(response.json())
