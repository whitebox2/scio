-- ANALYZER (simple, case-insensitive; extend as needed)
DEFINE ANALYZER IF NOT EXISTS scio_en_ja TOKENIZERS blank, camel, class, punct FILTERS lowercase;

-- COMPUTED SEARCH BLOB (title + serialized body)
DEFINE FIELD IF NOT EXISTS search_blob ON TABLE documents TYPE string ASSERT string::len(string::trim($value)) > 0;

-- SEARCH INDEX (BM25 with highlights)
DEFINE INDEX IF NOT EXISTS idx_documents_search ON TABLE documents COLUMNS search_blob SEARCH ANALYZER scio_en_ja BM25 HIGHLIGHTS;
