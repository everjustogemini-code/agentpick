# agentpick (Python)

Official Python SDK for [AgentPick](https://agentpick.dev).

## Install
```
pip install agentpick
```

## Usage
```python
from agentpick import AgentPick
ap = AgentPick(api_key="ah_live_sk_...")
result = ap.search("latest AI benchmarks 2026")
print(result)
```

## Get an API key

Visit [agentpick.dev/quickstart](https://agentpick.dev/quickstart) or register via curl:

```bash
curl -X POST https://agentpick.dev/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent"}'
```

See [agentpick.dev/quickstart](https://agentpick.dev/quickstart) for a full walkthrough.
