-- H2 测试种子用户（密码: test123）
INSERT INTO users (id, username, discriminator, email, password_hash, verified, locale, mfa_enabled, flags, premium_type, public_flags, created_at, last_seen)
SELECT 1000000000000001, 'Alice',   '0001', 'alice@test.com',
       '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'zh-CN', FALSE, 0, 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alice@test.com');

INSERT INTO users (id, username, discriminator, email, password_hash, verified, locale, mfa_enabled, flags, premium_type, public_flags, created_at, last_seen)
SELECT 1000000000000002, 'Bob',     '0002', 'bob@test.com',
       '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'zh-CN', FALSE, 0, 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bob@test.com');

INSERT INTO users (id, username, discriminator, email, password_hash, verified, locale, mfa_enabled, flags, premium_type, public_flags, created_at, last_seen)
SELECT 1000000000000003, 'Charlie', '0003', 'charlie@test.com',
       '$2a$10$obTvB.hhHFATH5COug0qaegxB4bpl9/txJ5p30Xb5oGalXYp1pwcK', TRUE, 'en-US', FALSE, 0, 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'charlie@test.com');
