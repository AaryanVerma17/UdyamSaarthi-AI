"""
app/rag/corpus.py — Aaryan

Small local knowledge base the RAG layer retrieves from before the AI
Advisor explains a report. Kept as plain Python data (not a live index)
so it runs with zero external services/API keys — swap for a real
FAISS/Pinecone index over a much larger corpus (scheme circulars, mandi
reports, agri extension guidance) once that data is collected.

IMPORTANT: none of this text is used to compute numbers. It only gives
the LLM grounded, citable context to explain WHY a number looks the way
it does — it can never override financials/scheme/repayment figures,
which always come from the deterministic engines.
"""

DOCUMENTS = [
    {
        "id": "scheme_micro_finance",
        "text": (
            "The Micro Finance Scheme applies to project costs up to Rs 1.40 lakh. "
            "It offers a concessional interest rate of 6.5% per annum, a 3-year "
            "repayment tenure including a 3-month moratorium, and a maximum loan "
            "of Rs 1.25 lakh."
        ),
        "tags": ["scheme", "micro_finance"],
    },
    {
        "id": "scheme_term_loan",
        "text": (
            "The Term Loan Scheme applies to project costs between Rs 1.40 lakh and "
            "Rs 50 lakh. It offers an interest rate of 8% per annum, a 7-year "
            "repayment tenure including a 6-month moratorium, and a maximum loan "
            "of Rs 45 lakh."
        ),
        "tags": ["scheme", "term_loan"],
    },
    {
        "id": "dairy_seasonality",
        "text": (
            "Dairy businesses in North Indian villages typically see reduced milk "
            "yield during peak summer months due to heat stress on livestock, and "
            "increased yield in winter. Value-added products like paneer, curd, and "
            "ghee can help smooth revenue across this seasonal cycle."
        ),
        "tags": ["dairy", "seasonality", "risk"],
    },
    {
        "id": "kirana_working_capital",
        "text": (
            "Kirana (general retail) stores typically require a much larger share "
            "of project cost tied up in initial inventory compared to equipment, "
            "since the core asset of the business is stocked goods rather than "
            "machinery."
        ),
        "tags": ["kirana", "working_capital"],
    },
    {
        "id": "data_confidence_note",
        "text": (
            "When local data confidence is low, figures such as consumer base, "
            "competitor counts, and pricing should be treated as preliminary "
            "estimates. Entrepreneurs are advised to validate demand directly "
            "with local buyers before committing capital."
        ),
        "tags": ["data_confidence", "risk"],
    },
]
