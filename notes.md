## Session Management System Database Structure

### Tables Overview

1. **sessions**
   - Stores main session information
   - Primary table for educational content organization

2. **modules**
   - Contains module information
   - Linked to sessions with ordering capability

3. **videos**
   - Stores video content information
   - Associated with specific modules

### Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'Linear Flow',
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modules table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, order_index)
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,
    file_size INTEGER NOT NULL, -- in bytes
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_modules_session_id ON modules(session_id);
CREATE INDEX idx_modules_order ON modules(session_id, order_index);
CREATE INDEX idx_videos_module_id ON videos(module_id);

-- Row Level Security Policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
    ON sessions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
    ON sessions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
    ON sessions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
    ON sessions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Modules policies
CREATE POLICY "Users can view modules of their sessions"
    ON modules FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = modules.session_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage modules of their sessions"
    ON modules FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = modules.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- Videos policies
CREATE POLICY "Users can view videos of their modules"
    ON videos FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM modules
            JOIN sessions ON sessions.id = modules.session_id
            WHERE modules.id = videos.module_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage videos of their modules"
    ON videos FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM modules
            JOIN sessions ON sessions.id = modules.session_id
            WHERE modules.id = videos.module_id
            AND sessions.user_id = auth.uid()
        )
    );
```

### Key Features

1. **UUID Primary Keys**
   - All tables use UUID primary keys for better security and distribution

2. **Timestamps**
   - `created_at` and `updated_at` fields for audit tracking
   - Automatically managed through triggers

3. **Referential Integrity**
   - Foreign key constraints ensure data consistency
   - Cascade deletes maintain data cleanliness

4. **Row Level Security**
   - Comprehensive RLS policies for data protection
   - User-based access control for all operations

5. **Indexing**
   - Strategic indexes for common query patterns
   - Optimized for performance at scale

### Common Queries

1. Get all sessions for a user:
```sql
SELECT * FROM sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

2. Get modules with videos for a session:
```sql
SELECT 
    m.*,
    json_agg(v.*) as videos
FROM modules m
LEFT JOIN videos v ON v.module_id = m.id
WHERE m.session_id = :session_id
GROUP BY m.id
ORDER BY m.order_index;
```

3. Update module order:
```sql
UPDATE modules
SET order_index = :new_index
WHERE id = :module_id
AND session_id = :session_id;
```

### Security Considerations

1. **Authentication**
   - All access requires authentication
   - User ID verification on all operations

2. **Row Level Security**
   - Table-level policies restrict access
   - Users can only access their own data

3. **Input Validation**
   - File size limits on videos
   - MIME type restrictions
   - Name length constraints

### Performance Optimization

1. **Indexes**
   - Optimized for common query patterns
   - Covers frequently used WHERE clauses

2. **Constraints**
   - Unique constraints prevent duplicates
   - Check constraints maintain data integrity

3. **Cascade Operations**
   - Automatic cleanup of related records
   - Maintains referential integrity