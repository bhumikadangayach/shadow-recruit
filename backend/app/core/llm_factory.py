from app.core.config import settings

def get_llm(provider: str = "openai", temperature: float = 0.7, streaming: bool = False):
    if provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            api_key=settings.groq_api_key,
            model="llama-3.3-70b-versatile",
            temperature=temperature,
            streaming=streaming,
        )
    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            api_key=settings.openai_api_key,
            model="gpt-4o",
            temperature=temperature,
            streaming=streaming,
        )
    # Default fallback to groq if no openai key
    from langchain_groq import ChatGroq
    return ChatGroq(
        api_key=settings.groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=temperature,
        streaming=streaming,
    )