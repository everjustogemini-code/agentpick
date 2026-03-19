import httpx

BASE_URL = "https://agentpick.dev"

class AgentPick:
    def __init__(self, api_key: str, base_url: str = BASE_URL):
        self.api_key = api_key
        self.base_url = base_url

    def search(self, query: str, **kwargs) -> dict:
        response = httpx.post(
            f"{self.base_url}/api/v1/route/search",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"query": query, **kwargs},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
