from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def chat_completion(
    messages: list[dict],
    model: str = "gpt-4o-mini",
    temperature: float = 0.3,
    max_tokens: int = 1000,
) -> str:
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content