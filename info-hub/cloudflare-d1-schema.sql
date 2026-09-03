-- InfoHub Production Cloudflare D1 Database Schema
-- Run this in Cloudflare Dashboard D1 Console or via: wrangler d1 execute infohub-db --file=./cloudflare-d1-schema.sql

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'GUEST',
    email TEXT,
    avatar_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_units (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'NOTE' | 'MATERIAL' | 'ARTICLE' | 'LESSON' | 'COURSE'
    state TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'WORKING' | 'READY' | 'ARCHIVED'
    maturity INTEGER NOT NULL DEFAULT 0,
    topic_ids TEXT NOT NULL, -- JSON array of topic IDs: '["t1", "t2"]'
    purpose TEXT NOT NULL DEFAULT 'PERSONAL',
    visibility TEXT NOT NULL DEFAULT 'PRIVATE', -- 'PRIVATE' | 'SHARED' | 'PUBLIC'
    blocks TEXT NOT NULL, -- JSON serialized array of Block objects
    relations TEXT NOT NULL, -- JSON array of related IDs
    modules TEXT, -- Optional JSON for Course Modules
    author_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    block_id TEXT,
    selected_text TEXT,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(content_id) REFERENCES content_units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'BUG' | 'ENHANCEMENT' | 'ADDITION' | 'IDEA'
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-performance lookups
CREATE INDEX IF NOT EXISTS idx_content_type ON content_units(type);
CREATE INDEX IF NOT EXISTS idx_content_state ON content_units(state);
CREATE INDEX IF NOT EXISTS idx_content_visibility ON content_units(visibility);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id);
