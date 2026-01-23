-- ============================================================================
-- YESHUA GUIDE - FAITH COMPANION APP
-- Database Schema v1.0.0
-- PostgreSQL / Supabase Compatible
-- ============================================================================
-- 
-- Schema Design Principles:
-- 1. Privacy-first: Sensitive spiritual data encrypted, minimal exposure
-- 2. Soft deletes: Preserve data integrity, allow recovery
-- 3. Audit trails: Track all meaningful changes
-- 4. Performance: Strategic indexes on query patterns
-- 5. Scalability: Partitioning-ready for growth
--
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search on scripture

-- ============================================================================
-- SECTION 1: CORE USER MANAGEMENT
-- ============================================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,  -- Links to Supabase auth.users
    
    -- Basic Profile
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    
    -- Faith Profile
    denomination VARCHAR(100),  -- e.g., "Non-denominational", "Baptist", "Catholic"
    faith_journey_start DATE,   -- When they began their faith journey
    preferred_bible_version VARCHAR(20) DEFAULT 'ESV',  -- ESV, NIV, KJV, NASB, etc.
    include_apocrypha BOOLEAN DEFAULT false,  -- Include deuterocanonical books
    include_extra_biblical BOOLEAN DEFAULT false,  -- Enoch, Jasher, etc.
    
    -- Preferences
    daily_devotional_time TIME DEFAULT '07:00:00',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    notification_preferences JSONB DEFAULT '{
        "daily_devotional": true,
        "prayer_reminders": true,
        "group_activity": true,
        "friend_requests": true
    }'::jsonb,
    
    -- Privacy Settings
    profile_visibility VARCHAR(20) DEFAULT 'friends',  -- public, friends, private
    prayer_requests_visible BOOLEAN DEFAULT true,
    show_streak BOOLEAN DEFAULT true,
    anonymous_by_default BOOLEAN DEFAULT false,
    
    -- Engagement Tracking
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    total_conversations INTEGER DEFAULT 0,
    total_prayers_offered INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    CONSTRAINT valid_visibility CHECK (profile_visibility IN ('public', 'friends', 'private'))
);

-- User Streak History (for analytics and recovery)
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    streak_date DATE NOT NULL,
    activity_type VARCHAR(50) NOT NULL,  -- devotional, conversation, prayer, study
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, streak_date, activity_type)
);

-- User Relationships (Friendships)
CREATE TABLE user_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, blocked
    relationship_type VARCHAR(30) DEFAULT 'friend',  -- friend, accountability_partner
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT no_self_relationship CHECK (requester_id != addressee_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'blocked')),
    UNIQUE(requester_id, addressee_id)
);

-- ============================================================================
-- SECTION 2: SCRIPTURE DATABASE
-- ============================================================================

-- Bible Books Reference
CREATE TABLE bible_books (
    id SERIAL PRIMARY KEY,
    
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    testament VARCHAR(20) NOT NULL,  -- old, new, apocrypha, extra_biblical
    book_order INTEGER NOT NULL,
    chapter_count INTEGER NOT NULL,
    
    -- Categorization
    category VARCHAR(50),  -- law, history, wisdom, prophecy, gospel, epistle, apocalyptic
    author_traditional VARCHAR(100),
    
    is_canonical BOOLEAN DEFAULT true,
    is_deuterocanonical BOOLEAN DEFAULT false,
    is_extra_biblical BOOLEAN DEFAULT false,
    
    CONSTRAINT valid_testament CHECK (testament IN ('old', 'new', 'apocrypha', 'extra_biblical'))
);

-- Scripture Verses
CREATE TABLE scripture_verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    book_id INTEGER NOT NULL REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER,  -- For passages spanning multiple verses
    
    -- Multiple Translations
    text_esv TEXT,
    text_niv TEXT,
    text_kjv TEXT,
    text_nasb TEXT,
    text_nlt TEXT,
    
    -- Full-text search vector
    search_vector TSVECTOR,
    
    -- Reference string for easy lookup
    reference VARCHAR(50) NOT NULL,  -- e.g., "John 3:16", "Psalm 23:1-6"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(book_id, chapter, verse_start, verse_end)
);

-- Topical Index (for contextual scripture retrieval)
CREATE TABLE scripture_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_topic_id UUID REFERENCES scripture_topics(id),
    
    description TEXT,
    
    -- Hierarchical categorization
    category VARCHAR(50),  -- emotion, life_event, theological, relationship, growth
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scripture to Topic Mapping
CREATE TABLE scripture_topic_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    scripture_id UUID NOT NULL REFERENCES scripture_verses(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES scripture_topics(id) ON DELETE CASCADE,
    
    relevance_score DECIMAL(3,2) DEFAULT 1.00,  -- 0.00 to 1.00
    context_notes TEXT,  -- Why this scripture relates to this topic
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(scripture_id, topic_id)
);

-- ============================================================================
-- SECTION 3: AI CONVERSATIONS
-- ============================================================================

-- Conversation Sessions
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session Info
    title VARCHAR(255),  -- Auto-generated or user-defined
    
    -- Mood/Context at start
    initial_mood VARCHAR(50),  -- grateful, struggling, seeking, anxious, strong, questioning
    primary_topic VARCHAR(100),  -- anxiety, purpose, relationships, forgiveness, grief, etc.
    
    -- Session Metadata
    message_count INTEGER DEFAULT 0,
    scriptures_referenced INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Conversation Messages
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    role VARCHAR(20) NOT NULL,  -- user, assistant
    content TEXT NOT NULL,
    
    -- For assistant messages
    scriptures_cited UUID[],  -- Array of scripture_verse IDs
    topics_addressed UUID[],  -- Array of topic IDs
    
    -- Sentiment Analysis (computed)
    sentiment_score DECIMAL(3,2),  -- -1.00 to 1.00
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ordering
    sequence_number INTEGER NOT NULL,
    
    CONSTRAINT valid_role CHECK (role IN ('user', 'assistant'))
);

-- Saved Reflections (user can save meaningful exchanges)
CREATE TABLE saved_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    message_id UUID REFERENCES conversation_messages(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Content (preserved even if original deleted)
    title VARCHAR(255),
    content TEXT NOT NULL,
    scripture_reference VARCHAR(100),
    
    -- User additions
    personal_notes TEXT,
    
    -- Categorization
    tags VARCHAR(50)[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: DAILY DEVOTIONALS
-- ============================================================================

-- Devotional Content Library
CREATE TABLE devotionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    scripture_id UUID REFERENCES scripture_verses(id),
    scripture_reference VARCHAR(100) NOT NULL,
    scripture_text TEXT NOT NULL,
    
    reflection TEXT NOT NULL,
    prayer_prompt TEXT,
    action_step TEXT,
    
    -- Categorization
    topics UUID[],  -- Array of topic IDs
    themes VARCHAR(100)[],
    
    -- Scheduling
    scheduled_date DATE,  -- If part of a reading plan
    day_of_year INTEGER,  -- For annual rotation (1-366)
    
    -- Source
    author VARCHAR(100) DEFAULT 'Yeshua Guide',
    source VARCHAR(255),
    
    -- Metadata
    reading_time_minutes INTEGER DEFAULT 3,
    difficulty_level VARCHAR(20) DEFAULT 'all',  -- new_believer, growing, mature, all
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- User Devotional Engagement
CREATE TABLE user_devotional_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    devotional_id UUID NOT NULL REFERENCES devotionals(id) ON DELETE CASCADE,
    
    -- Engagement
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    
    -- User Response
    personal_reflection TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Sharing
    shared_to_group_id UUID,
    
    UNIQUE(user_id, devotional_id, viewed_at::DATE)
);

-- ============================================================================
-- SECTION 5: COMMUNITY & GROUPS
-- ============================================================================

-- Bible Study Groups
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(150) NOT NULL,
    description TEXT,
    avatar_emoji VARCHAR(10),
    cover_image_url TEXT,
    
    -- Study Focus
    current_book_id INTEGER REFERENCES bible_books(id),
    current_study_topic VARCHAR(255),
    study_pace VARCHAR(30) DEFAULT 'weekly',  -- daily, weekly, bi-weekly
    
    -- Settings
    is_public BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 20,
    
    -- Leadership
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Stats
    member_count INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Group Membership
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role VARCHAR(30) DEFAULT 'member',  -- owner, admin, moderator, member
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- pending, active, muted, removed
    
    -- Engagement
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    
    -- Notifications
    notifications_enabled BOOLEAN DEFAULT true,
    
    UNIQUE(group_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'muted', 'removed'))
);

-- Group Messages / Discussions
CREATE TABLE group_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Content
    content TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'text',  -- text, scripture_share, prayer_request, announcement
    
    -- Scripture Reference (if sharing)
    scripture_id UUID REFERENCES scripture_verses(id),
    scripture_reference VARCHAR(100),
    
    -- Reply Threading
    parent_message_id UUID REFERENCES group_messages(id),
    reply_count INTEGER DEFAULT 0,
    
    -- Reactions
    reaction_counts JSONB DEFAULT '{}'::jsonb,  -- {"🙏": 5, "❤️": 3}
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Pinned messages
    is_pinned BOOLEAN DEFAULT false,
    pinned_at TIMESTAMPTZ,
    pinned_by UUID REFERENCES users(id)
);

-- Message Reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    message_id UUID NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    emoji VARCHAR(10) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, emoji)
);

-- Group Events (Bible Studies, Prayer Meetings)
CREATE TABLE group_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Event Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'bible_study',  -- bible_study, prayer_meeting, discussion, other
    
    -- Timing
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    timezone VARCHAR(50),
    
    -- Location
    is_virtual BOOLEAN DEFAULT true,
    meeting_url TEXT,
    location_address TEXT,
    
    -- Study Content
    scripture_focus VARCHAR(100),
    discussion_questions TEXT[],
    
    -- RSVP Tracking
    max_attendees INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

-- Event RSVPs
CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    event_id UUID NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'going',  -- going, maybe, not_going
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- ============================================================================
-- SECTION 6: PRAYER SYSTEM
-- ============================================================================

-- Prayer Requests
CREATE TABLE prayer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Categorization
    category VARCHAR(50),  -- health, family, work, spiritual, relationships, gratitude, other
    
    -- Privacy
    visibility VARCHAR(30) DEFAULT 'community',  -- private, friends, group, community
    is_anonymous BOOLEAN DEFAULT false,
    group_id UUID REFERENCES study_groups(id),  -- If shared to specific group
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- active, answered, closed
    answered_at TIMESTAMPTZ,
    answered_testimony TEXT,  -- User's testimony of answered prayer
    
    -- Engagement Stats
    prayer_count INTEGER DEFAULT 0,
    encouragement_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- Optional expiration
    deleted_at TIMESTAMPTZ
);

-- Prayer Interactions (Praying for someone)
CREATE TABLE prayer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    interaction_type VARCHAR(30) DEFAULT 'prayed',  -- prayed, encouraged
    
    -- Optional message of encouragement
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Allow multiple prayers but track unique pray-ers
    UNIQUE(prayer_request_id, user_id, interaction_type, created_at::DATE)
);

-- Personal Prayer Journal
CREATE TABLE prayer_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Type
    entry_type VARCHAR(30) DEFAULT 'prayer',  -- prayer, gratitude, confession, intercession, praise
    
    -- Linked Scripture
    scripture_id UUID REFERENCES scripture_verses(id),
    scripture_reference VARCHAR(100),
    
    -- Status
    is_answered BOOLEAN DEFAULT false,
    answered_at TIMESTAMPTZ,
    answered_notes TEXT,
    
    -- Privacy (journal is always private, but can be shared)
    shared_to_group_id UUID REFERENCES study_groups(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- SECTION 7: READING PLANS & PROGRESS
-- ============================================================================

-- Reading Plans
CREATE TABLE reading_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Plan Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    
    -- Structure
    duration_days INTEGER NOT NULL,
    plan_type VARCHAR(50),  -- bible_in_year, topical, book_study, devotional_series
    
    -- Content Source
    topics UUID[],
    books INTEGER[],  -- bible_books IDs
    
    -- Metadata
    author VARCHAR(100) DEFAULT 'Yeshua Guide',
    difficulty_level VARCHAR(20) DEFAULT 'all',
    
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    participant_count INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Plan Days (Daily Content)
CREATE TABLE reading_plan_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    
    -- Content
    title VARCHAR(255),
    scripture_references VARCHAR(100)[],  -- Array of references
    devotional_id UUID REFERENCES devotionals(id),
    
    reflection_questions TEXT[],
    
    UNIQUE(plan_id, day_number)
);

-- User Plan Enrollment & Progress
CREATE TABLE user_reading_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    
    -- Progress
    started_at TIMESTAMPTZ DEFAULT NOW(),
    current_day INTEGER DEFAULT 1,
    completed_days INTEGER DEFAULT 0,
    
    -- Completion
    completed_at TIMESTAMPTZ,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Settings
    reminder_time TIME,
    is_paused BOOLEAN DEFAULT false,
    paused_at TIMESTAMPTZ,
    
    -- Group Study (optional)
    group_id UUID REFERENCES study_groups(id),
    
    UNIQUE(user_id, plan_id)
);

-- Daily Progress Tracking
CREATE TABLE reading_plan_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_plan_id UUID NOT NULL REFERENCES user_reading_plans(id) ON DELETE CASCADE,
    plan_day_id UUID NOT NULL REFERENCES reading_plan_days(id) ON DELETE CASCADE,
    
    -- Completion
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER,
    
    -- User Engagement
    personal_notes TEXT,
    
    UNIQUE(user_plan_id, plan_day_id)
);

-- ============================================================================
-- SECTION 8: NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    body TEXT,
    
    -- Type & Action
    notification_type VARCHAR(50) NOT NULL,
    -- Types: devotional_reminder, prayer_answered, friend_request, group_invite,
    --        group_message, prayer_request, event_reminder, streak_milestone
    
    -- Action URL/Data
    action_type VARCHAR(50),
    action_id UUID,  -- Reference to relevant entity
    action_data JSONB,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Delivery
    push_sent BOOLEAN DEFAULT false,
    push_sent_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ============================================================================
-- SECTION 9: ANALYTICS & INSIGHTS
-- ============================================================================

-- User Faith Journey Analytics (Aggregated Daily)
CREATE TABLE user_analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    
    -- Activity Counts
    devotionals_completed INTEGER DEFAULT 0,
    conversations_count INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    prayers_offered INTEGER DEFAULT 0,
    scriptures_read INTEGER DEFAULT 0,
    time_in_app_seconds INTEGER DEFAULT 0,
    
    -- Mood Tracking (from conversations)
    primary_mood VARCHAR(50),
    mood_scores JSONB,  -- {"grateful": 2, "anxious": 1}
    
    -- Topics Explored
    topics_explored UUID[],
    
    UNIQUE(user_id, date)
);

-- Scripture Engagement (What scriptures resonate with users)
CREATE TABLE scripture_engagement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    scripture_id UUID NOT NULL REFERENCES scripture_verses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL for aggregate stats
    
    engagement_type VARCHAR(30) NOT NULL,  -- viewed, saved, shared, discussed
    
    context VARCHAR(50),  -- devotional, conversation, search, plan
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 10: INDEXES FOR PERFORMANCE
-- ============================================================================

-- User lookups
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Relationships
CREATE INDEX idx_relationships_addressee ON user_relationships(addressee_id, status);
CREATE INDEX idx_relationships_requester ON user_relationships(requester_id, status);

-- Scripture search
CREATE INDEX idx_scripture_search ON scripture_verses USING GIN(search_vector);
CREATE INDEX idx_scripture_reference ON scripture_verses(reference);
CREATE INDEX idx_scripture_book_chapter ON scripture_verses(book_id, chapter);

-- Topic lookups
CREATE INDEX idx_topic_mappings_scripture ON scripture_topic_mappings(scripture_id);
CREATE INDEX idx_topic_mappings_topic ON scripture_topic_mappings(topic_id);

-- Conversations
CREATE INDEX idx_conversations_user ON conversations(user_id, started_at DESC);
CREATE INDEX idx_conversation_messages ON conversation_messages(conversation_id, sequence_number);

-- Devotionals
CREATE INDEX idx_devotionals_date ON devotionals(scheduled_date);
CREATE INDEX idx_devotionals_day ON devotionals(day_of_year);
CREATE INDEX idx_user_devotional_logs ON user_devotional_logs(user_id, viewed_at DESC);

-- Groups
CREATE INDEX idx_group_members_user ON group_members(user_id, status);
CREATE INDEX idx_group_members_group ON group_members(group_id, status);
CREATE INDEX idx_group_messages ON group_messages(group_id, created_at DESC);
CREATE INDEX idx_group_messages_parent ON group_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Prayer
CREATE INDEX idx_prayer_requests_visibility ON prayer_requests(visibility, status, created_at DESC);
CREATE INDEX idx_prayer_requests_user ON prayer_requests(user_id, created_at DESC);
CREATE INDEX idx_prayer_requests_group ON prayer_requests(group_id, created_at DESC) WHERE group_id IS NOT NULL;
CREATE INDEX idx_prayer_interactions ON prayer_interactions(prayer_request_id, created_at DESC);

-- Reading Plans
CREATE INDEX idx_user_reading_plans ON user_reading_plans(user_id, completed_at);
CREATE INDEX idx_reading_plan_progress ON reading_plan_progress(user_plan_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- Analytics
CREATE INDEX idx_analytics_user_date ON user_analytics_daily(user_id, date DESC);
CREATE INDEX idx_scripture_engagement ON scripture_engagement(scripture_id, engagement_type);

-- ============================================================================
-- SECTION 11: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prayer_requests_updated_at BEFORE UPDATE ON prayer_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_devotionals_updated_at BEFORE UPDATE ON devotionals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update scripture search vector
CREATE OR REPLACE FUNCTION update_scripture_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = 
        setweight(to_tsvector('english', COALESCE(NEW.text_esv, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.text_niv, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.text_kjv, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scripture_search BEFORE INSERT OR UPDATE ON scripture_verses
    FOR EACH ROW EXECUTE FUNCTION update_scripture_search_vector();

-- Increment prayer count
CREATE OR REPLACE FUNCTION increment_prayer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.interaction_type = 'prayed' THEN
        UPDATE prayer_requests 
        SET prayer_count = prayer_count + 1 
        WHERE id = NEW.prayer_request_id;
    ELSIF NEW.interaction_type = 'encouraged' THEN
        UPDATE prayer_requests 
        SET encouragement_count = encouragement_count + 1 
        WHERE id = NEW.prayer_request_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_prayer_interaction INSERT ON prayer_interactions
    FOR EACH ROW EXECUTE FUNCTION increment_prayer_count();

-- Update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE study_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE study_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE study_groups SET member_count = member_count - 1 WHERE id = NEW.group_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE study_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_count AFTER INSERT OR UPDATE OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Update message reply count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_message_id IS NOT NULL THEN
        UPDATE group_messages 
        SET reply_count = reply_count + 1 
        WHERE id = NEW.parent_message_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_message_reply INSERT ON group_messages
    FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- ============================================================================
-- SECTION 12: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile details (except public fields)
CREATE POLICY users_select_own ON users
    FOR SELECT USING (
        auth.uid() = auth_id OR 
        profile_visibility = 'public' OR
        (profile_visibility = 'friends' AND EXISTS (
            SELECT 1 FROM user_relationships 
            WHERE status = 'accepted' AND (
                (requester_id = id AND addressee_id = (SELECT id FROM users WHERE auth_id = auth.uid())) OR
                (addressee_id = id AND requester_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
            )
        ))
    );

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Conversations - users only see their own
CREATE POLICY conversations_own ON conversations
    FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY conversation_messages_own ON conversation_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        )
    );

-- Prayer requests - based on visibility settings
CREATE POLICY prayer_requests_view ON prayer_requests
    FOR SELECT USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
        visibility = 'community' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM user_relationships 
            WHERE status = 'accepted' AND (
                (requester_id = user_id AND addressee_id = (SELECT id FROM users WHERE auth_id = auth.uid())) OR
                (addressee_id = user_id AND requester_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
            )
        )) OR
        (visibility = 'group' AND group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND status = 'active'
        ))
    );

CREATE POLICY prayer_requests_own ON prayer_requests
    FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Prayer journal is always private
CREATE POLICY prayer_journal_own ON prayer_journal
    FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Saved reflections are private
CREATE POLICY saved_reflections_own ON saved_reflections
    FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Analytics are private
CREATE POLICY analytics_own ON user_analytics_daily
    FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================================
-- SECTION 13: INITIAL SEED DATA - BIBLE BOOKS
-- ============================================================================

INSERT INTO bible_books (name, abbreviation, testament, book_order, chapter_count, category, is_canonical) VALUES
-- Old Testament
('Genesis', 'Gen', 'old', 1, 50, 'law', true),
('Exodus', 'Exod', 'old', 2, 40, 'law', true),
('Leviticus', 'Lev', 'old', 3, 27, 'law', true),
('Numbers', 'Num', 'old', 4, 36, 'law', true),
('Deuteronomy', 'Deut', 'old', 5, 34, 'law', true),
('Joshua', 'Josh', 'old', 6, 24, 'history', true),
('Judges', 'Judg', 'old', 7, 21, 'history', true),
('Ruth', 'Ruth', 'old', 8, 4, 'history', true),
('1 Samuel', '1Sam', 'old', 9, 31, 'history', true),
('2 Samuel', '2Sam', 'old', 10, 24, 'history', true),
('1 Kings', '1Kgs', 'old', 11, 22, 'history', true),
('2 Kings', '2Kgs', 'old', 12, 25, 'history', true),
('1 Chronicles', '1Chr', 'old', 13, 29, 'history', true),
('2 Chronicles', '2Chr', 'old', 14, 36, 'history', true),
('Ezra', 'Ezra', 'old', 15, 10, 'history', true),
('Nehemiah', 'Neh', 'old', 16, 13, 'history', true),
('Esther', 'Esth', 'old', 17, 10, 'history', true),
('Job', 'Job', 'old', 18, 42, 'wisdom', true),
('Psalms', 'Ps', 'old', 19, 150, 'wisdom', true),
('Proverbs', 'Prov', 'old', 20, 31, 'wisdom', true),
('Ecclesiastes', 'Eccl', 'old', 21, 12, 'wisdom', true),
('Song of Solomon', 'Song', 'old', 22, 8, 'wisdom', true),
('Isaiah', 'Isa', 'old', 23, 66, 'prophecy', true),
('Jeremiah', 'Jer', 'old', 24, 52, 'prophecy', true),
('Lamentations', 'Lam', 'old', 25, 5, 'prophecy', true),
('Ezekiel', 'Ezek', 'old', 26, 48, 'prophecy', true),
('Daniel', 'Dan', 'old', 27, 12, 'prophecy', true),
('Hosea', 'Hos', 'old', 28, 14, 'prophecy', true),
('Joel', 'Joel', 'old', 29, 3, 'prophecy', true),
('Amos', 'Amos', 'old', 30, 9, 'prophecy', true),
('Obadiah', 'Obad', 'old', 31, 1, 'prophecy', true),
('Jonah', 'Jonah', 'old', 32, 4, 'prophecy', true),
('Micah', 'Mic', 'old', 33, 7, 'prophecy', true),
('Nahum', 'Nah', 'old', 34, 3, 'prophecy', true),
('Habakkuk', 'Hab', 'old', 35, 3, 'prophecy', true),
('Zephaniah', 'Zeph', 'old', 36, 3, 'prophecy', true),
('Haggai', 'Hag', 'old', 37, 2, 'prophecy', true),
('Zechariah', 'Zech', 'old', 38, 14, 'prophecy', true),
('Malachi', 'Mal', 'old', 39, 4, 'prophecy', true),

-- New Testament
('Matthew', 'Matt', 'new', 40, 28, 'gospel', true),
('Mark', 'Mark', 'new', 41, 16, 'gospel', true),
('Luke', 'Luke', 'new', 42, 24, 'gospel', true),
('John', 'John', 'new', 43, 21, 'gospel', true),
('Acts', 'Acts', 'new', 44, 28, 'history', true),
('Romans', 'Rom', 'new', 45, 16, 'epistle', true),
('1 Corinthians', '1Cor', 'new', 46, 16, 'epistle', true),
('2 Corinthians', '2Cor', 'new', 47, 13, 'epistle', true),
('Galatians', 'Gal', 'new', 48, 6, 'epistle', true),
('Ephesians', 'Eph', 'new', 49, 6, 'epistle', true),
('Philippians', 'Phil', 'new', 50, 4, 'epistle', true),
('Colossians', 'Col', 'new', 51, 4, 'epistle', true),
('1 Thessalonians', '1Thess', 'new', 52, 5, 'epistle', true),
('2 Thessalonians', '2Thess', 'new', 53, 3, 'epistle', true),
('1 Timothy', '1Tim', 'new', 54, 6, 'epistle', true),
('2 Timothy', '2Tim', 'new', 55, 4, 'epistle', true),
('Titus', 'Titus', 'new', 56, 3, 'epistle', true),
('Philemon', 'Phlm', 'new', 57, 1, 'epistle', true),
('Hebrews', 'Heb', 'new', 58, 13, 'epistle', true),
('James', 'Jas', 'new', 59, 5, 'epistle', true),
('1 Peter', '1Pet', 'new', 60, 5, 'epistle', true),
('2 Peter', '2Pet', 'new', 61, 3, 'epistle', true),
('1 John', '1John', 'new', 62, 5, 'epistle', true),
('2 John', '2John', 'new', 63, 1, 'epistle', true),
('3 John', '3John', 'new', 64, 1, 'epistle', true),
('Jude', 'Jude', 'new', 65, 1, 'epistle', true),
('Revelation', 'Rev', 'new', 66, 22, 'apocalyptic', true),

-- Deuterocanonical (Apocrypha)
('Tobit', 'Tob', 'apocrypha', 67, 14, 'wisdom', false),
('Judith', 'Jdt', 'apocrypha', 68, 16, 'history', false),
('Wisdom of Solomon', 'Wis', 'apocrypha', 69, 19, 'wisdom', false),
('Sirach', 'Sir', 'apocrypha', 70, 51, 'wisdom', false),
('Baruch', 'Bar', 'apocrypha', 71, 6, 'prophecy', false),
('1 Maccabees', '1Macc', 'apocrypha', 72, 16, 'history', false),
('2 Maccabees', '2Macc', 'apocrypha', 73, 15, 'history', false),

-- Extra-Biblical
('1 Enoch', '1En', 'extra_biblical', 74, 108, 'apocalyptic', false),
('Book of Jasher', 'Jasher', 'extra_biblical', 75, 91, 'history', false),
('Book of Jubilees', 'Jub', 'extra_biblical', 76, 50, 'history', false);

-- Update deuterocanonical flags
UPDATE bible_books SET is_deuterocanonical = true WHERE testament = 'apocrypha';
UPDATE bible_books SET is_extra_biblical = true WHERE testament = 'extra_biblical';

-- ============================================================================
-- SECTION 14: INITIAL SEED DATA - SCRIPTURE TOPICS
-- ============================================================================

INSERT INTO scripture_topics (name, category, description) VALUES
-- Emotions
('Anxiety', 'emotion', 'Scriptures addressing worry, fear, and anxious thoughts'),
('Grief', 'emotion', 'Scriptures for times of loss and mourning'),
('Joy', 'emotion', 'Scriptures about joy, happiness, and celebration'),
('Anger', 'emotion', 'Scriptures about righteous anger and managing wrath'),
('Loneliness', 'emotion', 'Scriptures for feeling isolated or alone'),
('Fear', 'emotion', 'Scriptures addressing fear and finding courage'),
('Depression', 'emotion', 'Scriptures for dark seasons and hopelessness'),
('Peace', 'emotion', 'Scriptures about inner peace and tranquility'),
('Gratitude', 'emotion', 'Scriptures about thanksgiving and appreciation'),

-- Life Events
('Marriage', 'life_event', 'Scriptures about marriage and union'),
('Parenting', 'life_event', 'Scriptures about raising children'),
('Career', 'life_event', 'Scriptures about work, calling, and vocation'),
('Financial Struggles', 'life_event', 'Scriptures about provision and stewardship'),
('Health Crisis', 'life_event', 'Scriptures for illness and healing'),
('New Beginnings', 'life_event', 'Scriptures for starting fresh'),
('Death of Loved One', 'life_event', 'Scriptures for bereavement'),
('Transitions', 'life_event', 'Scriptures for seasons of change'),

-- Relationships
('Forgiveness', 'relationship', 'Scriptures about forgiving others'),
('Reconciliation', 'relationship', 'Scriptures about restoring relationships'),
('Conflict Resolution', 'relationship', 'Scriptures about handling disagreements'),
('Friendship', 'relationship', 'Scriptures about godly friendships'),
('Family', 'relationship', 'Scriptures about family relationships'),
('Community', 'relationship', 'Scriptures about fellowship and belonging'),

-- Spiritual Growth
('Faith', 'growth', 'Scriptures about trusting God'),
('Prayer', 'growth', 'Scriptures about communication with God'),
('Worship', 'growth', 'Scriptures about praise and adoration'),
('Obedience', 'growth', 'Scriptures about following Gods commands'),
('Spiritual Warfare', 'growth', 'Scriptures about battling spiritual forces'),
('Temptation', 'growth', 'Scriptures about resisting sin'),
('Repentance', 'growth', 'Scriptures about turning back to God'),
('Wisdom', 'growth', 'Scriptures about seeking understanding'),
('Purpose', 'growth', 'Scriptures about calling and destiny'),
('Identity', 'growth', 'Scriptures about who we are in Christ'),

-- Theological
('Salvation', 'theological', 'Scriptures about being saved'),
('Grace', 'theological', 'Scriptures about Gods unmerited favor'),
('Love of God', 'theological', 'Scriptures about Gods love for us'),
('Holy Spirit', 'theological', 'Scriptures about the Spirit'),
('Second Coming', 'theological', 'Scriptures about Christs return'),
('Heaven', 'theological', 'Scriptures about eternal life'),
('Kingdom of God', 'theological', 'Scriptures about Gods reign'),
('Redemption', 'theological', 'Scriptures about being bought back');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
