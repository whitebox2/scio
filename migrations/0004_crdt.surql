-- Extend documents with optional CRDT state (base64-encoded Yjs update)
DEFINE FIELD IF NOT EXISTS crdt_b64 ON TABLE documents TYPE option<string>;
DEFINE FIELD IF NOT EXISTS updated_by ON TABLE documents TYPE option<record<users>>;

-- Application layer is responsible for keeping updated_at consistent when CRDT merges occur.
