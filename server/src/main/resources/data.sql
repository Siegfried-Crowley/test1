-- ============================================================================
-- H2 开发测试数据 (自动加载)
-- 仅在 users 表为空时插入测试用户，不影响注册功能
-- ============================================================================

-- 测试用户 (密码: test123)
-- 使用 NOT EXISTS 确保不会覆盖注册的用户
INSERT INTO users (id, username, discriminator, email, password_hash, verified, locale, created_at, last_seen)
SELECT 1000000000000001, 'Alice',   '0001', 'alice@test.com',
       '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'zh-CN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alice@test.com');

INSERT INTO users (id, username, discriminator, email, password_hash, verified, locale, created_at, last_seen)
SELECT 1000000000000002, 'Bob',     '0002', 'bob@test.com',
       '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'zh-CN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bob@test.com');

INSERT INTO users (id, username, discriminator, email, password_hash, verified, locale, created_at, last_seen)
SELECT 1000000000000003, 'Charlie', '0003', 'charlie@test.com',
       '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'en-US', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'charlie@test.com');
