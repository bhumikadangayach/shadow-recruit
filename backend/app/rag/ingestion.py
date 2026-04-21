from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from app.core.config import settings

_embeddings = None

def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings

def _get_resume_store(user_id: str):
    return Chroma(
        collection_name=f"resume_{user_id}",
        embedding_function=_get_embeddings(),
        persist_directory=settings.chroma_persist_dir,
    )

def _get_jd_store(jd_id: str):
    return Chroma(
        collection_name=f"jd_{jd_id}",
        embedding_function=_get_embeddings(),
        persist_directory=settings.chroma_persist_dir,
    )

def ingest_resume(user_id: str, file_path: str):
    if file_path.endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    store = _get_resume_store(user_id)
    store.add_documents(chunks)

def ingest_jd(jd_id: str, text: str):
    from langchain_core.documents import Document
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs = [Document(page_content=text)]
    chunks = splitter.split_documents(docs)
    store = _get_jd_store(jd_id)
    store.add_documents(chunks)

def retrieve_resume_context(user_id: str, query: str, k: int = 3):
    try:
        store = _get_resume_store(user_id)
        return store.similarity_search(query, k=k)
    except Exception:
        return []

def retrieve_jd_context(jd_id: str, query: str, k: int = 3):
    try:
        store = _get_jd_store(jd_id)
        return store.similarity_search(query, k=k)
    except Exception:
        return []