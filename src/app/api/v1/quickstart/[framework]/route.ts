import { NextResponse } from "next/server";

const FRAMEWORKS: Record<
  string,
  { installCmd: string; codeSnippet: string; playgroundUrl: string }
> = {
  langchain: {
    installCmd: "pip install langchain agentpick",
    codeSnippet: `import os
from langchain.tools import Tool
from agentpick import AgentPickClient

client = AgentPickClient(api_key=os.environ["AGENTPICK_API_KEY"])

def agentpick_search(query: str) -> str:
    response = client.chat.completions.create(
        model="agentpick-router",
        messages=[{"role": "user", "content": query}],
    )
    return response.choices[0].message.content

tool = Tool(name="AgentPick", func=agentpick_search, description="AgentPick tool router")`,
    playgroundUrl:
      "/playground?framework=langchain&query=search+the+web+for+AI+news",
  },
  crewai: {
    installCmd: "pip install crewai agentpick",
    codeSnippet: `import os
from crewai import Agent, Task, Crew
from agentpick import AgentPickClient

client = AgentPickClient(api_key=os.environ["AGENTPICK_API_KEY"])

def agentpick_route(query: str) -> str:
    response = client.chat.completions.create(
        model="agentpick-router",
        messages=[{"role": "user", "content": query}],
    )
    return response.choices[0].message.content

researcher = Agent(role="Researcher", goal="Find information", backstory="Expert researcher")
task = Task(description="Research {topic}", agent=researcher, expected_output="Report")
crew = Crew(agents=[researcher], tasks=[task])`,
    playgroundUrl:
      "/playground?framework=crewai&query=research+latest+LLM+benchmarks",
  },
  autogen: {
    installCmd: "pip install pyautogen agentpick",
    codeSnippet: `import os
import autogen
from agentpick import AgentPickClient

client = AgentPickClient(api_key=os.environ["AGENTPICK_API_KEY"])

config_list = [{"model": "agentpick-router", "api_key": os.environ["AGENTPICK_API_KEY"]}]

assistant = autogen.AssistantAgent(
    name="assistant",
    llm_config={"config_list": config_list},
)
user_proxy = autogen.UserProxyAgent(name="user_proxy", human_input_mode="NEVER")
user_proxy.initiate_chat(assistant, message="Find top AI tools 2025")`,
    playgroundUrl: "/playground?framework=autogen&query=find+top+AI+tools+2025",
  },
};

export async function GET(
  _req: Request,
  { params }: { params: { framework: string } }
) {
  const { framework } = params;
  const data = FRAMEWORKS[framework];

  if (!data) {
    return NextResponse.json({ error: "Unknown framework" }, { status: 404 });
  }

  return NextResponse.json({ framework, ...data });
}
