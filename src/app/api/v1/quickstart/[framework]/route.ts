import { NextRequest, NextResponse } from 'next/server';

const SNIPPETS: Record<string, {
  installCmd: string;
  codeSnippet: string;
  playgroundUrl: string;
}> = {
  langchain: {
    installCmd: 'pip install langchain agentpick',
    codeSnippet: `import os
from langchain.tools import tool
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://agentpick.com/v1",
    api_key=os.environ["AGENTPICK_API_KEY"],
    model="auto",
)
response = llm.invoke("Search the web for AI news")
print(response.content)`,
    playgroundUrl: '/playground?framework=langchain&query=search+the+web+for+AI+news',
  },
  crewai: {
    installCmd: 'pip install crewai agentpick',
    codeSnippet: `import os
from crewai import Agent, Task, Crew, LLM

llm = LLM(
    model="openai/auto",
    base_url="https://agentpick.com/v1",
    api_key=os.environ["AGENTPICK_API_KEY"],
)
researcher = Agent(role="Researcher", goal="Find information", llm=llm,
                   backstory="Expert researcher")
task = Task(description="Research latest LLM benchmarks", agent=researcher,
            expected_output="Summary")
crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff()`,
    playgroundUrl: '/playground?framework=crewai&query=research+latest+LLM+benchmarks',
  },
  autogen: {
    installCmd: 'pip install pyautogen agentpick',
    codeSnippet: `import os
from autogen import AssistantAgent

config_list = [{
    "model": "auto",
    "base_url": "https://agentpick.com/v1",
    "api_key": os.environ["AGENTPICK_API_KEY"],
}]
assistant = AssistantAgent(
    name="assistant",
    llm_config={"config_list": config_list},
)
assistant.initiate_chat(assistant,
    message="Find top AI tools 2025", max_turns=1)`,
    playgroundUrl: '/playground?framework=autogen&query=find+top+AI+tools+2025',
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { framework: string } }
) {
  const key = params.framework.toLowerCase();
  const snippet = SNIPPETS[key];
  if (!snippet) {
    return NextResponse.json(
      { error: 'Unknown framework. Valid values: langchain, crewai, autogen' },
      { status: 404 }
    );
  }
  return NextResponse.json({ framework: key, ...snippet });
}
