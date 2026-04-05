-- =========================
-- EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- USERS (optional, multi-user system)
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- URLS (core mapping)
-- =========================
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    short_key VARCHAR(10) UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- metadata
    title TEXT,
    description TEXT,

    -- control flags
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,

    -- counters (denormalized for fast reads)
    click_count BIGINT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- INDEXES (critical for performance)
-- =========================
CREATE INDEX idx_urls_short_key ON urls(short_key);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_created_at ON urls(created_at);

-- Partial index for active links
CREATE INDEX idx_urls_active ON urls(short_key)
WHERE is_active = TRUE;

-- =========================
-- ANALYTICS (high write table)
-- =========================
CREATE TABLE analytics (
    id BIGSERIAL PRIMARY KEY,
    short_key VARCHAR(10) REFERENCES urls(short_key) ON DELETE CASCADE,

    ip_address INET,
    user_agent TEXT,
    referer TEXT,

    -- geo/device enrichment
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_short_key ON analytics(short_key);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);

-- =========================
-- RATE LIMITING / ABUSE CONTROL
-- =========================
CREATE TABLE rate_limits (
    id BIGSERIAL PRIMARY KEY,
    ip_address INET,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limits_ip ON rate_limits(ip_address);

-- =========================
-- CUSTOM DOMAINS (advanced feature)
-- =========================
CREATE TABLE domains (
    id BIGSERIAL PRIMARY KEY,
    domain_name TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- URL TAGGING / ORGANIZATION
-- =========================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE url_tags (
    url_id BIGINT REFERENCES urls(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (url_id, tag_id)
);

-- =========================
-- CLICK AGGREGATES (for fast dashboards)
-- =========================
CREATE TABLE url_daily_stats (
    short_key VARCHAR(10),
    date DATE,
    clicks BIGINT DEFAULT 0,
    PRIMARY KEY (short_key, date)
);

-- =========================
-- TRIGGER: AUTO-INCREMENT CLICK COUNT
-- =========================
CREATE OR REPLACE FUNCTION increment_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE urls
    SET click_count = click_count + 1
    WHERE short_key = NEW.short_key;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_click
AFTER INSERT ON analytics
FOR EACH ROW
EXECUTE FUNCTION increment_click_count();