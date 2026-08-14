-- ============================================================================
-- 开发测试数据
-- ============================================================================

-- 测试用户 (密码: test123)
INSERT INTO users (id, username, discriminator, email, password_hash, verified, locale, created_at, last_seen)
VALUES
    (generate_snowflake(1), 'Alice',   '0001', 'alice@test.com',
     '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'zh-CN', NOW(), NOW()),
    (generate_snowflake(1), 'Bob',     '0002', 'bob@test.com',
     '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'zh-CN', NOW(), NOW()),
    (generate_snowflake(1), 'Charlie', '0003', 'charlie@test.com',
     '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'en-US', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
