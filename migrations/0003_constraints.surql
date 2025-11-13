-- TAG POLICY: reject duplicates at API; on DB, enforce array length limit and basic shape if needed
DEFINE FIELD OVERWRITE tags ON TABLE documents TYPE array ASSERT array::len($value) <= 50;

-- SUMMARY POLICY: already limited to <=100 chars; optionally reject emoji/symbols via regex if desired
-- Example (loose): ASSERT regex::is($value, '^[\x20-\x7E]{0,100}$');  -- ASCII printable only

DEFINE FIELD OVERWRITE summary ON TABLE document_revisions TYPE string ASSERT string::len($value) <= 100;

-- UPDATED_AT AUTOMATION: ensure updates refresh timestamps
DEFINE EVENT IF NOT EXISTS update_users_timestamp ON TABLE users WHEN $event = "UPDATE" THEN (UPDATE $after SET updated_at = time::now());
DEFINE EVENT IF NOT EXISTS update_projects_timestamp ON TABLE projects WHEN $event = "UPDATE" THEN (UPDATE $after SET updated_at = time::now());
DEFINE EVENT IF NOT EXISTS update_folders_timestamp ON TABLE folders WHEN $event = "UPDATE" THEN (UPDATE $after SET updated_at = time::now());
DEFINE EVENT IF NOT EXISTS update_files_timestamp ON TABLE files WHEN $event = "UPDATE" THEN (UPDATE $after SET updated_at = time::now());
DEFINE EVENT IF NOT EXISTS update_documents_timestamp ON TABLE documents WHEN $event = "UPDATE" THEN (UPDATE $after SET updated_at = time::now());
