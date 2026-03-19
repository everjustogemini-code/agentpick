"""AgentPick Python SDK — thin wrapper around the AgentPick REST API."""

from __future__ import annotations

import time
from typing import Any

import httpx


class AgentPickError(Exception):
    """Base exception for AgentPick API errors."""

    def __init__(self, code: str, message: str, status: int):
        self.code = code
        self.message = message
        self.status = status
        super().__init__(f"[{code}] {message} (HTTP {status})")


class AgentPick:
    """AgentPick client — route queries through the best tool for each job.

    Usage::

        from agentpick import AgentPick

        ap = AgentPick(api_key="YOUR_KEY", strategy="auto")
        result = ap.search("NVIDIA Q4 earnings analysis")
        print(result["data"])
    """

    def __init__(
        self,
        api_key: str,
        *,
        strategy: str = "auto",
        base_url: str = "https://agentpick.dev/api/v1",
        timeout: float = 30.0,
    ):
        self.api_key = api_key
        self.strategy = strategy
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": f"agentpick-python/0.2.0",
            },
            timeout=timeout,
        )

    # ── Core routing methods ──

    def search(self, query: str, **kwargs: Any) -> dict:
        """Route a search query through the best search tool."""
        return self._route("search", query=query, **kwargs)

    def crawl(self, url: str, **kwargs: Any) -> dict:
        """Route a crawl/scrape request through the best crawling tool."""
        return self._route("crawl", url=url, **kwargs)

    def embed(self, text: str, **kwargs: Any) -> dict:
        """Route an embedding request through the best embedding tool."""
        return self._route("embed", text=text, **kwargs)

    def finance(self, query: str, **kwargs: Any) -> dict:
        """Route a finance data query through the best finance tool."""
        return self._route("finance", query=query, **kwargs)

    # ── Generic route ──

    def route(self, capability: str, **params: Any) -> dict:
        """Route a request to any capability."""
        return self._route(capability, **params)

    # ── Account management ──

    def account(self) -> dict:
        """Get your developer account info."""
        resp = self._client.get("/router/account")
        return self._handle(resp)

    def usage(self, days: int = 7) -> dict:
        """Get usage statistics."""
        resp = self._client.get("/router/usage", params={"days": days})
        return self._handle(resp)

    def set_strategy(self, strategy: str) -> dict:
        """Update your routing strategy."""
        resp = self._client.patch("/router/account", json={"strategy": strategy})
        return self._handle(resp)

    # ── Internal ──

    def _route(self, capability: str, **params: Any) -> dict:
        tool = params.pop("tool", None)
        tool_api_key = params.pop("tool_api_key", None)
        fallback = params.pop("fallback", None)
        strategy = params.pop("strategy", self.strategy)

        body: dict[str, Any] = {"params": params}
        if tool:
            body["tool"] = tool
        if tool_api_key:
            body["tool_api_key"] = tool_api_key
        if fallback:
            body["fallback"] = fallback
        if strategy:
            body["strategy"] = strategy

        resp = self._client.post(f"/route/{capability}", json=body)
        return self._handle(resp)

    def _handle(self, resp: httpx.Response) -> dict:
        data = resp.json()
        if resp.status_code >= 400:
            err = data.get("error", {})
            raise AgentPickError(
                code=err.get("code", "UNKNOWN"),
                message=err.get("message", resp.text),
                status=resp.status_code,
            )
        return data

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()

    def __enter__(self) -> "AgentPick":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def __repr__(self) -> str:
        masked = self.api_key[:12] + "..." if len(self.api_key) > 12 else "***"
        return f"AgentPick(api_key='{masked}', strategy='{self.strategy}')"
