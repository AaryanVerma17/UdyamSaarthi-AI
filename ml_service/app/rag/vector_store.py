"""
app/rag/vector_store.py — Aaryan

TF-IDF based retrieval over app/rag/corpus.py. Uses scikit-learn's
TfidfVectorizer + cosine similarity — no external embedding API required,
so this runs fully offline/free. Swap for FAISS/Pinecone + real
embeddings (OpenAI/Anthropic/local sentence-transformers) once the corpus
grows beyond what TF-IDF handles well (roughly hundreds to low thousands
of documents).

Usage:
    from app.rag.vector_store import retrieve
    results = retrieve("dairy seasonal risk", top_k=2)
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.rag.corpus import DOCUMENTS

_vectorizer = TfidfVectorizer(stop_words="english")
_doc_texts = [doc["text"] for doc in DOCUMENTS]
_doc_matrix = _vectorizer.fit_transform(_doc_texts)


def retrieve(query: str, top_k: int = 3):
    """
    Returns the top_k most relevant documents from DOCUMENTS for the query,
    each as {"id", "text", "tags", "score"}.
    """
    query_vec = _vectorizer.transform([query])
    scores = cosine_similarity(query_vec, _doc_matrix)[0]
    ranked = sorted(zip(DOCUMENTS, scores), key=lambda pair: pair[1], reverse=True)

    results = []
    for doc, score in ranked[:top_k]:
        if score <= 0:
            continue
        results.append({**doc, "score": round(float(score), 4)})
    return results


def build_context_block(business_category: str, risk_types: list[str] | None = None) -> str:
    """
    Convenience helper for nlp_explain.py: builds a short grounding-context
    string relevant to this report's business category and risk types.
    """
    query = f"{business_category} " + " ".join(risk_types or [])
    results = retrieve(query, top_k=3)
    if not results:
        return ""
    return "\n".join(f"- {r['text']}" for r in results)
