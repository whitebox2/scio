-- NAMESPACE & DATABASE selection are handled by connection config in scripts.

-- USERS
DEFINE TABLE IF NOT EXISTS users SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS username      ON TABLE users TYPE string ASSERT string::len($value) > 0;
DEFINE FIELD IF NOT EXISTS password_hash ON TABLE users TYPE string ASSERT string::len($value) > 0;
DEFINE FIELD IF NOT EXISTS role          ON TABLE users TYPE string;           -- e.g., 'admin'|'member'
DEFINE FIELD IF NOT EXISTS ssh_keys      ON TABLE users TYPE array;            -- [{public_key, label, enabled}]
DEFINE FIELD IF NOT EXISTS created_at    ON TABLE users TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS updated_at    ON TABLE users TYPE datetime VALUE time::now();
DEFINE INDEX IF NOT EXISTS idx_users_username_unique ON TABLE users COLUMNS username UNIQUE;

-- PROJECTS
DEFINE TABLE IF NOT EXISTS projects SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name        ON TABLE projects TYPE string ASSERT string::len($value) > 0;
DEFINE FIELD IF NOT EXISTS visibility  ON TABLE projects TYPE string ASSERT $value IN ['private','team'];
DEFINE FIELD IF NOT EXISTS owner_id    ON TABLE projects TYPE record<users>;
DEFINE FIELD IF NOT EXISTS created_at  ON TABLE projects TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS updated_at  ON TABLE projects TYPE datetime VALUE time::now();
DEFINE INDEX IF NOT EXISTS idx_projects_owner_visibility ON TABLE projects COLUMNS owner_id, visibility;

-- FOLDERS
DEFINE TABLE IF NOT EXISTS folders SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS project_id  ON TABLE folders TYPE record<projects>;
DEFINE FIELD IF NOT EXISTS parent_id   ON TABLE folders TYPE option<record<folders>>;
DEFINE FIELD IF NOT EXISTS name        ON TABLE folders TYPE string;
DEFINE FIELD IF NOT EXISTS path        ON TABLE folders TYPE string;          -- normalized absolute path within project
DEFINE FIELD IF NOT EXISTS created_at  ON TABLE folders TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS updated_at  ON TABLE folders TYPE datetime VALUE time::now();
DEFINE INDEX IF NOT EXISTS idx_folders_project_path ON TABLE folders COLUMNS project_id, path UNIQUE;

-- FILES
DEFINE TABLE IF NOT EXISTS files SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS project_id   ON TABLE files TYPE record<projects>;
DEFINE FIELD IF NOT EXISTS folder_id    ON TABLE files TYPE record<folders>;
DEFINE FIELD IF NOT EXISTS name         ON TABLE files TYPE string;
DEFINE FIELD IF NOT EXISTS content_type ON TABLE files TYPE string;
DEFINE FIELD IF NOT EXISTS size         ON TABLE files TYPE number;
DEFINE FIELD IF NOT EXISTS storage_key  ON TABLE files TYPE string;          -- object store key
DEFINE FIELD IF NOT EXISTS created_at   ON TABLE files TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS updated_at   ON TABLE files TYPE datetime VALUE time::now();
DEFINE INDEX IF NOT EXISTS idx_files_folder_name ON TABLE files COLUMNS folder_id, name;

-- DOCUMENTS
DEFINE TABLE IF NOT EXISTS documents SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS project_id  ON TABLE documents TYPE record<projects>;
DEFINE FIELD IF NOT EXISTS folder_id   ON TABLE documents TYPE option<record<folders>>;
DEFINE FIELD IF NOT EXISTS title       ON TABLE documents TYPE string ASSERT string::len($value) > 0;
DEFINE FIELD IF NOT EXISTS body_rich   ON TABLE documents TYPE object;       -- Lexical JSON
DEFINE FIELD IF NOT EXISTS is_bundle   ON TABLE documents TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS toc         ON TABLE documents TYPE array;        -- optional TOC structure
DEFINE FIELD IF NOT EXISTS tags        ON TABLE documents TYPE array;        -- controlled by policy
DEFINE FIELD IF NOT EXISTS created_at  ON TABLE documents TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS updated_at  ON TABLE documents TYPE datetime VALUE time::now();

-- DOCUMENT REVISIONS
DEFINE TABLE IF NOT EXISTS document_revisions SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS document_id ON TABLE document_revisions TYPE record<documents>;
DEFINE FIELD IF NOT EXISTS summary     ON TABLE document_revisions TYPE string ASSERT string::len($value) <= 100;
DEFINE FIELD IF NOT EXISTS note        ON TABLE document_revisions TYPE string;  -- free-form
DEFINE FIELD IF NOT EXISTS diff_meta   ON TABLE document_revisions TYPE object;  -- optional diff summary
DEFINE FIELD IF NOT EXISTS created_at  ON TABLE document_revisions TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS author_id   ON TABLE document_revisions TYPE record<users>;
DEFINE INDEX IF NOT EXISTS idx_revisions_doc_time ON TABLE document_revisions COLUMNS document_id, created_at;

-- SHARES
DEFINE TABLE IF NOT EXISTS shares SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS resource_type ON TABLE shares TYPE string ASSERT $value IN ['project','folder','file','document'];
DEFINE FIELD IF NOT EXISTS resource_id   ON TABLE shares TYPE record;          -- record<any>
DEFINE FIELD IF NOT EXISTS url_id        ON TABLE shares TYPE string;          -- short, URL-safe id
DEFINE FIELD IF NOT EXISTS created_at    ON TABLE shares TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS expires_at    ON TABLE shares TYPE option<datetime>;
DEFINE INDEX IF NOT EXISTS idx_shares_url_id_unique ON TABLE shares COLUMNS url_id UNIQUE;
