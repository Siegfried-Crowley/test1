# 🎮 Discord Clone

<div align="center">

> **学习项目** — 仅供本地编程学习，拆解 Discord 底层实现逻辑  
> 功能：文字聊天 · 语音频道（控制面）· 群组权限 · 好友系统 · 私信 · 文件附件

[![JDK](https://img.shields.io/badge/JDK-17+-blue?logo=openjdk)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen?logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Tomcat](https://img.shields.io/badge/Tomcat-10.1-F8DC75?logo=apache-tomcat)](https://tomcat.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## 🔑 测试账号（直接登录用）

项目启动后，**浏览器打开 `http://localhost:3000`**，用以下任一账号登录：

| 头像 | 用户名 | 邮箱 | 密码 | 角色说明 |
|:----:|:------:|:----:|:----:|:--------:|
| 👩 | **Alice** | `alice@test.com` | `test123` | 已创建了服务器，有好友 |
| 👨 | **Bob** | `bob@test.com` | `test123` | 可加好友，体验聊天 |
| 👨 | **Charlie** | `charlie@test.com` | `test123` | 普通用户 |

> 💡 **小提示**：开两个浏览器窗口分别登录 Alice 和 Bob，就能看到**实时聊天**（新消息、在线状态、语音进出实时推送）效果！

---

## 📖 目录

- [🚀 5 分钟快速启动](#-5-分钟快速启动)
- [✨ 功能展示](#-功能展示)
- [✅ 自动化测试](#-自动化测试)
- [🏗️ 系统架构](#️-系统架构)
- [⚠️ 已知限制](#️-已知限制)
- [📂 项目结构](#-项目结构)
- [⚙️ 详细部署指南](#️-详细部署指南)
- [💻 IntelliJ IDEA 配置](#-intellij-idea-配置)
- [🔗 API 接口一览](#-api-接口一览)
- [🔐 权限系统](#-权限系统)
- [🗄️ 数据库设计](#️-数据库设计)
- [🌐 Gateway 协议](#-gateway-协议)
- [🎤 语音系统架构](#-语音系统架构)
- [🧠 学习路线建议](#-学习路线建议)
- [📋 待办 (Todo)](#-待办-todo)

---

## 🚀 5 分钟快速启动

### 你需要准备什么

> 🚀 **零 Docker / 零数据库**，本方案用 H2 内嵌数据库，开箱即跑。装好下面两项即可：

| 软件 | 下载地址 | 用途 |
|------|---------|------|
| **IntelliJ IDEA**（Ultimate，含 Tomcat 插件）| [官网](https://www.jetbrains.com/idea/) | 启动后端 |
| **Node.js** | [官网下载](https://nodejs.org/) ≥ 18 | 运行前端 |

> 💡 后端默认用 **H2 内嵌数据库**（文件持久化），无需安装 PostgreSQL / Redis / MinIO / Docker。

### 第 1 步：打开项目

用 IntelliJ IDEA 打开 `D:\idea databas\test1`（会自动识别 Maven 项目）。

### 第 2 步：用 IDEA + Tomcat 启动后端

后端根项目（`src/`，即 IDEA 部署的 `discord-clone`）默认 profile 使用 **MySQL**（需本地 MySQL 已启动，数据库名 `discord_clone`，JPA 自动建表；用户名/密码见 `src/main/resources/application.yml`）。`server/` 树才是 H2 零依赖配置（docker 用）。

1. **确认 Tomcat 已配置**：`Run → Edit Configurations`，新建或使用已有的 **Tomcat Server → Local**
2. **配置 Tomcat**：
   - **HTTP port**：`8080`
   - **VM options**：**留空或不填任何 `-Dspring.profiles.active=*` 和 DB 环境变量**（用默认配置）
   - **Deployment**：添加 `discord-clone:war exploded`，**Application context** 填 `/discord`
3. **确保 MySQL 已启动**（本机 3306），数据库 `discord_clone` 存在
4. 点 ▶ **运行 Tomcat**，控制台出现 **Tomcat started** 且无报错即部署成功

**验证后端**：浏览器打开以下地址，返回 **401 或 403** 都说明应用已正常启动（Spring Security 拦截了未登录请求）：
```
http://localhost:8080/discord/api/auth/me
```

> ⚠️ **重要提醒**：README 下方旧章节提到的 `-Dspring.profiles.active=tomcat` profile 已不存在；Redis / MinIO 相关配置已从代码中移除。请**不要**照旧配置，否则 Tomcat 会因找不到 profile / 连不上库而启动失败。就用上面第 2 步的默认方式（根 `src/` 用 MySQL；想零依赖用 `server/` 树的 H2 配置）即可。

### 第 3 步：启动前端

> ⚠️ **重要：以下命令必须在 `client` 目录下执行，不是在项目根目录！**

```bash
# 先切换到 client 目录！
cd client

# 然后执行:
npm install
npm start
```

浏览器自动打开 `http://localhost:3000` 🎉

> 🔍 **端口分工**：`3000` 是前端页面（Vite），`8080` 是后端接口（Tomcat）。登录时前端会通过 `client/.env` 里的地址把请求发到 `http://localhost:8080/discord`，两者缺一不可。若后端端口不是 8080，请同步修改 `client/.env` 并重启前端。

### 第 4 步：登录体验

> 测试账号见本文最上方 [🔑 测试账号](#-测试账号直接登录用) 表格。

### 第 5 步：开始探索

- **创建服务器**：点击左侧"+"按钮
- **创建频道**：右键服务器 → 创建频道
- **加好友**：输入对方邮箱或用户 ID
- **语音频道**：点击语音频道即可看到谁在线、静音/禁听、说话检测（控制面，不含真实音频）

---

## ✨ 功能展示

### 💬 文字聊天
| 功能 | 说明 |
|------|------|
| 实时消息发送 | WebSocket 推送，毫秒级到达 |
| 消息编辑/删除 | 自己消息 hover 后 ✏️/🗑️ |
| 多频道支持 | 文字频道、语音频道分类管理 |
| 消息历史 | 自动加载最近 50 条，顶部"加载更早"分页 |
| Nonce 去重 | 断网重发不会产生重复消息 |
| 附件 | 输入框附件按钮上传图片/文件，消息内渲染预览 |

### 📩 私信 (DM)
| 功能 | 说明 |
|------|------|
| 好友发起私信 | 好友列表"私信"按钮，自动创建/复用 DM 频道 |
| 侧边栏私信列表 | 左侧"私信"图标进入，实时刷新最后消息预览 |
| DM 实时广播 | 新私信只推给频道双方，越权访问被拒 |

### 🎤 语音频道（控制面）
> ⚠️ 目前只实现**语音控制面**（谁在线、进出广播、静音/禁听、说话检测），**不含真实音频传输**。原因：浏览器无法直发 UDP，前端 WebRTC 客户端与后端裸 RTP 服务器协议不兼容。
| 功能 | 说明 |
|------|------|
| 进出广播 | 加入/离开通过 Gateway OP4 实时推给同频道成员 |
| 说话检测 (VAD) | 说话时头像绿框高亮（需麦克风权限） |
| 麦克风控制 | 点击按钮一键静音/取消静音 |
| 耳机控制 | 一键禁听 |

### 👥 服务器管理
| 功能 | 说明 |
|------|------|
| 创建服务器 | 点"+"按钮，输入名称即可 |
| 频道管理 | 创建文字/语音频道，设置分类 |
| 角色管理 | 创建角色，配置权限 |
| 邀请系统 | 生成邀请链接（TODO） |

### 🤝 好友系统
| 功能 | 说明 |
|------|------|
| 发送好友请求 | 输入对方用户 ID |
| 接受/拒绝请求 | 待处理列表一键操作 |
| 删除好友 | 好友列表右键移除 |
| 屏蔽用户 | 不再接收消息 |
| 在线状态 | 登录/登出实时推送给好友，登录时拉好友在线快照 |

### 🔐 权限系统（Discord 完全对齐）
| 层级 | 说明 |
|------|------|
| @everyone 角色 | 服务器所有成员的默认权限 |
| 角色叠加 (Role) | 每个角色有独立权限位，按 Position 排序 |
| 频道覆盖 | 对特定频道覆盖角色的权限 |
| 特定成员覆盖 | 对单独成员设置权限（最高优先级） |
| 管理员 | `ADMINISTRATOR` 权限位 = 全部权限 |
| 服务器所有者 | 不受任何权限限制 |

**权限覆盖 UI**：文字/语音频道右侧齿轮 → 选择角色/成员，左键=允许、右键=拒绝对应权限位（查看、发消息、管理消息、上传、连接语音、说话）。

---

## ✅ 自动化测试

后端（Spring Boot 集成测试，真实 Tomcat + H2 内存库）与前端（Vitest 状态机测试）各有独立测试套件：

| 套件 | 命令 | 覆盖 |
|------|------|------|
| 后端 `src/test` | `mvn test` | 登录/注册、安全配置（voice/受保护接口需鉴权、业务异常返回 JSON 而非 403）、消息 CRUD、私信流程与越权、附件持久化（12 个用例） |
| 前端 `client/src/gateway/GatewayClient.test.ts` | `cd client && npm test` | 网关重连状态机：Identify、幂等 connect、断线走 Resume 不重新 Identify、连接稳定不死循环、destroy 后过期回调不触发重连、心跳 ACK（6 个用例） |

> 后端另有 `server/` 树（docker 部署用）也带同一套测试：`mvn -f server/pom.xml test`。
> 测试账号密码哈希已统一修正为 `test123` 对应的 bcrypt 值（原先 `server/` 种子误用了 `password` 的哈希，docker 登录会失败）。

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🌐 客户端 (React)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ 💬 Chat  │  │ 🎤 Voice │  │ 👥 Friend│  │ ⚙️ Guild 管理    │  │
│  │  Module  │  │  Module  │  │  System  │  │                  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       └──────────────┴─────────────┴─────────────────┘            │
│                       ┌─────────────────┐                         │
│                       │  Gateway Client │ WebSocket (wss)         │
│                       └────────┬────────┘                         │
│                       ┌────────┴────────┐                         │
│                       │  REST Client    │ HTTP                    │
│                       └────────┬────────┘                         │
│                       ┌────────┴────────┐                         │
│                       │  Voice Client   │ UDP + WS                │
│                       └─────────────────┘                         │
└──────────────────────────────┬────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────────┐
          │                    │                        │
    ┌─────▼──────┐     ┌──────▼──────┐         ┌───────▼───┐
    │  REST API  │     │  Gateway    │         │ Voice SFU │
    │  :8080     │◄───►│  WebSocket  │         │  UDP:4003 │
    │  /api/*    │     │  /ws        │         │           │
    └─────┬──────┘     └──────┬──────┘         └───────┬───┘
          │                   │                        │
    ┌─────▼───────────────────▼────────────────────────▼──────┐
    │                    业务服务层                            │
    │  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
    │  │  Auth   │ │ Guild  │ │Channel │ │ Message│ │Voice │ │
    │  │ Service │ │Service │ │Service │ │Service │ │Service│ │
    │  └─────────┘ └────────┘ └────────┘ └────────┘ └──────┘ │
    │  ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────────────┐ │
    │  │  Friend │ │ Perm.  │ │  File  │ │   Notification  │ │
    │  │ Service │ │Service │ │ Service │ │    (Pub/Sub)    │ │
    │  └─────────┘ └────────┘ └────────┘ └─────────────────┘ │
    └─────────────────────────┬───────────────────────────────┘
                              │
    ┌─────────────────────────▼───────────────────────────────┐
    │                      数据层                              │
    │  ┌──────────────────┐    ┌───────────────────────────┐  │
    │  │  PostgreSQL 16   │    │     Redis 7               │  │
    │  │  · 用户/公会      │    │  · Session 缓存 (30s TTL) │  │
    │  │  · 消息(分区表)   │    │  · Gateway 心跳           │  │
    │  │  · 权限/角色      │    │  · Pub/Sub 事件广播       │  │
    │  │  · 好友关系       │    │  · 速率限制               │  │
    │  └──────────────────┘    └───────────────────────────┘  │
    │  ┌────────────────────────────────────────────────────┐  │
    │  │  MinIO (S3 兼容对象存储)                            │  │
    │  │  · 文件附件 / 头像 / 缩略图 / 表情图片              │  │
    │  └────────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────────┘
```

所有服务通过 **Tomcat 同一端口（8080）**对外暴露，REST API 和 WebSocket Gateway 共用端口，简化部署。

---

## 📂 项目结构

```
D:\IDEA DATABAS\TEST1\              # 项目根目录
│
├── 📁 server/                       # 🖥️ 后端 (Spring Boot + Tomcat)
│   ├── 📁 src/main/java/org/discord/
│   │   ├── 📄 DiscordApplication.java   # 启动入口 (implements SpringBootServletInitializer)
│   │   ├── 📁 config/                   # 配置类
│   │   │   ├── SecurityConfig.java      # Spring Security (JWT无状态)
│   │   │   ├── JwtAuthFilter.java       # JWT 令牌过滤器
│   │   │   ├── WebSocketConfig.java     # Gateway WS 配置
│   │   │   └── RedisConfig.java         # Redis 配置
│   │   ├── 📁 entity/                   # 📦 数据实体 (14个类)
│   │   │   ├── User.java, Guild.java, GuildMember.java
│   │   │   ├── Channel.java, Message.java (分区表)
│   │   │   ├── Role.java, MemberRole.java
│   │   │   ├── ChannelOverwrite.java (权限覆盖)
│   │   │   ├── Relationship.java (好友关系)
│   │   │   ├── VoiceState.java, VoiceAllocation.java, VoiceServer.java
│   │   │   └── DmChannel.java, DmChannelMember.java
│   │   ├── 📁 repository/               # 🔍 数据访问层 (14个接口)
│   │   ├── 📁 service/                  # ⚙️ 业务逻辑层 (7个服务)
│   │   │   ├── AuthService.java         # 注册/登录
│   │   │   ├── GuildService.java        # 服务器管理
│   │   │   ├── ChannelService.java      # 频道管理
│   │   │   ├── MessageService.java      # 消息CRUD (含去重)
│   │   │   ├── PermissionService.java   # 64位权限引擎 ⭐
│   │   │   ├── FriendService.java       # 好友系统
│   │   │   └── VoiceService.java        # 语音调度
│   │   ├── 📁 controller/               # 🌐 REST API (6个控制器)
│   │   │   ├── AuthController.java      # /api/auth/*
│   │   │   ├── GuildController.java     # /api/guilds/*
│   │   │   ├── ChannelController.java   # /api/channels/*
│   │   │   ├── MessageController.java   # /api/channels/:id/messages/*
│   │   │   ├── FriendController.java    # /api/friends/*
│   │   │   └── VoiceController.java     # /api/voice/*
│   │   ├── 📁 gateway/                  # 🔌 WebSocket Gateway
│   │   │   └── GatewayWebSocketHandler.java  # 协议实现 (Opcode 1-12)
│   │   ├── 📁 voice/                    # 🔊 Voice SFU
│   │   │   └── VoiceSfuServer.java      # UDP 选择性转发引擎
│   │   ├── 📁 dto/                      # 数据传输对象
│   │   └── 📁 util/
│   │       ├── JwtUtil.java             # JWT 令牌工具
│   │       └── SnowflakeGenerator.java  # Twitter Snowflake ID
│   │
│   ├── 📁 src/main/resources/
│   │   ├── 📄 application.yml           # 配置 (3个Profile: default/tomcat/prod)
│   │   ├── 📄 schema.sql                # 15张表的完整建表脚本
│   │   └── 📄 seed.sql                  # 3个测试用户
│   │
│   ├── 📁 src/main/webapp/WEB-INF/
│   │   └── 📄 web.xml                   # Tomcat 部署描述符
│   │
│   ├── 📄 Dockerfile                    # 构建WAR → Tomcat10镜像
│   ├── 📄 deploy.bat                    # 一键部署到本地Tomcat
│   └── 📄 setenv.bat                    # Tomcat环境变量模板
│
├── 📁 client/                           # 🎨 前端 (React 18 + TypeScript)
│   ├── 📁 public/
│   │   └── index.html
│   ├── 📁 src/
│   │   ├── 📁 components/               # UI 组件 (12个)
│   │   │   ├── App.tsx                  # 根组件 (Gateway连接管理)
│   │   │   ├── MainLayout.tsx           # 主布局 (4列网格)
│   │   │   ├── 📁 auth/                 # 登录/注册
│   │   │   │   └── LoginPage.tsx        # 登录+注册双模式
│   │   │   ├── 📁 guild/                # 服务器侧栏
│   │   │   │   ├── GuildSidebar.tsx     # 服务器图标列表
│   │   │   │   ├── ChannelSidebar.tsx   # 频道列表
│   │   │   │   └── CreateGuildModal.tsx # 创建服务器弹窗
│   │   │   ├── 📁 chat/                 # 聊天区域
│   │   │   │   ├── ChatArea.tsx         # 聊天主面板
│   │   │   │   ├── MessageList.tsx      # 消息列表 (自动滚动)
│   │   │   │   └── MessageInput.tsx     # 输入框 (Enter发送)
│   │   │   ├── 📁 voice/                # 语音面板
│   │   │   │   └── VoicePanel.tsx       # 浮动语音控制窗
│   │   │   ├── 📁 friends/              # 好友页面
│   │   │   │   └── FriendsPage.tsx      # 好友列表+请求管理
│   │   │   └── 📁 common/
│   │   │       └── UserPanel.tsx        # 底部用户栏
│   │   ├── 📁 gateway/
│   │   │   └── GatewayClient.ts         # WebSocket 客户端 (心跳/重连/事件)
│   │   ├── 📁 voice/
│   │   │   └── VoiceClient.ts           # WebRTC 语音客户端
│   │   ├── 📁 store/
│   │   │   └── index.ts                # Zustand 状态管理 (归一化)
│   │   ├── 📁 utils/
│   │   │   └── api.ts                  # REST API 封装 (axios)
│   │   └── 📁 styles/
│   │       └── discord.css             # 暗色主题完整样式
│   └── 📄 .env                         # 连接地址配置
│
├── 📄 docker-compose.yml               # 🐳 一键编排所有服务
├── 📄 pom.xml                          # Maven 依赖 (WAR打包)
└── 📄 README.md                        # 📖 本文档
```

---

## ⚙️ 详细部署指南

### 🐳 方案一：Docker 一键部署（推荐，最简单）

> 适合：**只想体验功能、不想装任何开发环境**

```bash
# 1. 确保 Docker Desktop 已安装并运行

# 2. 在项目根目录执行（第一次会下载镜像，约 2-5 分钟）
docker compose up -d

# 3. 查看所有服务是否正常启动
docker compose ps
# 应该看到 postgres/redis/minio/server 全部 running

# 4. 后端已经跑在 Tomcat 上了！
#    验证: 浏览器打开 http://localhost:4001/discord/api/auth/me
#    应该在登录前返回 401，说明API正常

# 5. 启动前端
cd client
npm install
npm start
```

**停止服务：**
```bash
docker compose down          # 停止所有
docker compose down -v       # 停止并删除数据（重新开始）
```

---

### 🪟 方案二：外置 Tomcat 部署（最真实）

> 适合：**想模拟生产环境、学习完整的 Java Web 部署流程**

#### 安装前置软件

| 软件 | 版本 | 下载 | 安装说明 |
|------|------|------|---------|
| Tomcat | 10.1+ | [apache-tomcat-10.1.x.exe](https://tomcat.apache.org/download-10.cgi) | 安装时设置端口 8080 |
| PostgreSQL | 16 | [官网下载](https://www.postgresql.org/download/) | 安装时密码设 `discord_dev_2026` |
| Redis | 7+ | [Redis for Windows](https://github.com/microsoftarchive/redis/releases) | 默认端口 6379 |
| MinIO | latest | [MinIO Server](https://min.io/download#/windows) | 命令行启动 |
| JDK | 17+ | [Adoptium Temurin 17](https://adoptium.net/temurin/releases/) | 配置 JAVA_HOME |
| Node.js | 18+ | [官网下载](https://nodejs.org/) | 一路下一步 |

#### 配置 Tomcat

```bash
# 1. 把环境变量文件复制到 Tomcat
copy server\setenv.bat "C:\Program Files\Apache Software Foundation\Tomcat 10.0\bin\"

# 2. 或者手动编辑 %TOMCAT_HOME%\bin\setenv.bat，内容如下：
@echo off
set JAVA_OPTS=%JAVA_OPTS% -Dspring.profiles.active=tomcat
set JAVA_OPTS=%JAVA_OPTS% -DDB_URL=jdbc:postgresql://localhost:5432/discord_clone
set JAVA_OPTS=%JAVA_OPTS% -DDB_USER=discord
set JAVA_OPTS=%JAVA_OPTS% -DDB_PASSWORD=discord_dev_2026
set JAVA_OPTS=%JAVA_OPTS% -DREDIS_URL=redis://localhost:6379
```

#### 构建和部署

```bash
# 1. 确保 PostgreSQL、Redis、MinIO 都已启动
#    最简单方式：用 Docker 启动中间件
docker compose up -d postgres redis minio

# 2. 构建 WAR 包
cd server
mvn clean package -DskipTests

# 3. 部署到 Tomcat
#    把 target/discord-clone-1.0.0.war 复制到
#    C:\Program Files\Apache Software Foundation\Tomcat 10.0\webapps\discord.war

# 4. 启动 Tomcat
net start Tomcat10
# 或双击: C:\...\Tomcat 10.0\bin\startup.bat

# 5. 验证部署
#    浏览器打开 http://localhost:8080/discord/api/auth/me
#    应该在未登录时返回 401

# 6. 启动前端
cd client
npm install
npm start
```

> 也可以直接用 `server\deploy.bat "你的Tomcat安装路径"` 一键完成第2-3步。

---

### 💨 方案三：嵌入式 Tomcat 快速开发

> 适合：**开发者想快速调试、断点跟踪代码**

```bash
# 1. 启动中间件
docker compose up -d postgres redis minio

# 2. 直接运行 Spring Boot（自带内嵌 Tomcat）
cd server
mvn spring-boot:run

# 3. 验证
#    http://localhost:4001/discord/api/auth/me

# 4. 启动前端
cd client && npm install && npm start
```

---

## 💻 IntelliJ IDEA 配置

### 第一次打开项目

```bash
File → Open → 选择 D:\idea databas\test1 目录
# IDEA 会自动识别为 Maven 项目，下载依赖
```

### 配置 Tomcat 运行按钮（打断点调试用）

```
1. Run → Edit Configurations
2. 点 "+" → Tomcat Server → Local
3. 配置：
   ┌─────────────────────────────────────────┐
   │ Server 标签页                            │
   │   Application server: 选你的 Tomcat      │
   │   HTTP port: 8080                        │
   │   VM options: -Dspring.profiles.active=tomcat  │
   │                                  │
   │ Deployment 标签页                       │
   │   + → Artifact → discord-cline:war exploded    │
   │   Application context: /discord                 │
   │                                  │
   │ Server 标签页 (下方)                  │
   │   On frame deactivation: Update resources       │
   └─────────────────────────────────────────┘
4. Before launch: Build → Apply
5. 点 ▶️ 运行 / 🐞 调试
```

### 启动前端

```bash
# 在 IntelliJ Terminal 中
cd client && npm start
```

### 常用 Maven 命令

| 命令 | 说明 |
|------|------|
| `mvn clean package -DskipTests` | 打包 WAR |
| `mvn spring-boot:run` | 嵌入式启动 |
| `mvn test` | 运行测试 |
| `mvn dependency:resolve` | 下载依赖 |

---

## 🔗 API 接口一览

### 认证接口 `/api/auth`

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | `/api/auth/register` | 注册 | `{username, email, password}` |
| POST | `/api/auth/login` | 登录 | `{email, password}` |
| GET | `/api/auth/me` | 当前用户 | Header: `Authorization: Bearer <token>` |

### 服务器接口 `/api/guilds`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/guilds` | 我的服务器列表 |
| POST | `/api/guilds` | 创建服务器 |
| GET | `/api/guilds/{id}` | 服务器详情 |
| GET | `/api/guilds/{id}/channels` | 频道列表 |
| GET | `/api/guilds/{id}/members` | 成员列表 |
| GET | `/api/guilds/{id}/roles` | 角色列表 |

### 频道接口 `/api/channels`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/channels` | 创建频道 |
| GET | `/api/channels/{id}` | 频道详情 |
| PATCH | `/api/channels/{id}` | 修改频道 |
| DELETE | `/api/channels/{id}` | 删除频道 |

### 消息接口 `/api/channels/{id}/messages`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `.../messages?limit=50&before={id}` | 消息历史 |
| POST | `.../messages` | 发送消息 |
| PATCH | `.../messages/{id}` | 编辑消息 |
| DELETE | `.../messages/{id}` | 删除消息 |

### 好友接口 `/api/friends`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/friends` | 好友列表 |
| POST | `/api/friends/requests` | 发送好友请求 |
| PUT | `/api/friends/requests/{id}/accept` | 接受请求 |
| PUT | `/api/friends/requests/{id}/reject` | 拒绝请求 |
| DELETE | `/api/friends/{id}` | 删除好友 |
| PUT | `/api/friends/blocks` | 屏蔽用户 |

### 语音接口 `/api/voice`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/voice/join` | 加入语音频道 |
| POST | `/api/voice/leave` | 离开语音频道 |
| POST | `/api/voice/mute` | 切换静音 |
| POST | `/api/voice/deaf` | 切换禁听 |

---

## 🔐 权限系统

Discord 的权限系统是**业界最复杂的权限模型之一**，本项目完整对齐。

### 权限位一览 (64-bit)

```
Bit   权限                值
──────────────────────────────────────
0     CREATE_INSTANT_INVITE   1
1     KICK_MEMBERS            2
2     BAN_MEMBERS             4
3     ADMINISTRATOR           8          ← 覆盖所有
4     MANAGE_CHANNELS         16
5     MANAGE_GUILD            32
6     ADD_REACTIONS           64
7     VIEW_AUDIT_LOG          128
8     PRIORITY_SPEAKER        256
9     STREAM                  512
10    VIEW_CHANNEL            1024       ← 看频道
11    SEND_MESSAGES           2048       ← 发消息
12    SEND_TTS_MESSAGES       4096
13    MANAGE_MESSAGES         8192
14    EMBED_LINKS             16384
15    ATTACH_FILES            32768
16    READ_MESSAGE_HISTORY    65536
17    MENTION_EVERYONE        131072
18    USE_EXTERNAL_EMOJI      262144
20    CONNECT                 1048576    ← 进语音
21    SPEAK                   2097152    ← 语音说话
22    MUTE_MEMBERS            4194304
23    DEAFEN_MEMBERS          8388608
24    MOVE_MEMBERS            16777216
25    USE_VAD                 33554432
26    CHANGE_NICKNAME         67108864
27    MANAGE_NICKNAMES        134217728
28    MANAGE_ROLES            268435456
...（共 40+ 个权限位）
```

### 权限计算流程

```
用户权限 = @everyone基础权限 + 所有角色权限(Position升序)
         + 频道@everyone覆盖 + 频道角色覆盖(Position升序)
         + 频道成员覆盖(最高优先级)

特殊情况:
  服务器所有者 → 全部权限
  有 ADMIN → 全部权限
```

> 实现代码：`server/.../service/PermissionService.java`

---

## 🗄️ 数据库设计

### ER 概览

```
users ──┬── guild_members ──┬── guilds
        │                   │
        │                   ├── roles ──┬── member_roles
        │                   │           │
        │                   └── channels ──┬── messages (分区表 ×8)
        │                                  │
        │                                  └── channel_overwrites
        │
        ├── relationships (好友)
        │
        ├── dm_channels ──┬── dm_channel_members
        │
        ├── voice_states
        │
        └── attachments
```

### 核心表清单

| 表名 | 行数预测 | 说明 |
|------|---------|------|
| `users` | 用户数 | 用户名、邮箱、头像、flags |
| `guilds` | 服务器数 | 名称、Owner、设置 |
| `guild_members` | 用户×服务器 | 昵称、角色、状态 |
| `roles` | 服务器数×10 | 名称、颜色、权限位 |
| `channels` | 频道数 | 类型(text/voice/category)、配置 |
| `messages` | **巨大** | **按channel_id哈希分区(8张)** |
| `channel_overwrites` | 频道数×5 | 允许/拒绝的权限覆盖 |
| `relationships` | 用户数×好友数 | 类型(friend/blocked/request) |
| `voice_states` | 语音在线用户 | session_id、mute/deaf |
| `attachments` | 文件数 | URL、尺寸、类型 |

### 消息分区表

```sql
-- 消息表按 channel_id 哈希分成 8 个物理分区
-- 查询 WHERE channel_id = ? → 只扫描 1 个分区
CREATE TABLE messages (
    id BIGINT, channel_id BIGINT, ...
    PRIMARY KEY (channel_id, id)  -- 分区键在前！
) PARTITION BY HASH (channel_id);

-- 8 个分区: messages_0 ~ messages_7
```

> 完整的建表 SQL：`server/src/main/resources/schema.sql`

---

## 🌐 Gateway 协议

Gateway 是实时通信的核心，完全对齐 **Discord Gateway Protocol v9**。

### 连接生命周期

```
客户端                         服务端
  │                              │
  │──── ws://host:port/ws ──────►│  建立 WebSocket
  │                              │
  │◄──── OP 10 Hello ───────────│  服务端发送心跳间隔
  │                              │
  │──── OP 1 Heartbeat ────────►│  ◄── 每 41.25s
  │◄──── OP 11 Heartbeat ACK ───│  ◄── 服务端确认
  │                              │
  │──── OP 2 Identify ─────────►│  ◄── 发送 Token 认证
  │                              │
  │◄──── OP 0 Ready ────────────│  认证通过!
  │      │ session_id            │
  │      │ guilds               │
  │      │ relationships        │
  │                              │
  │◄──── OP 0 MESSAGE_CREATE ───│  实时消息推送
  │◄──── OP 0 PRESENCE_UPDATE ──│  在线状态
  │◄──── OP 0 VOICE_STATE_UPDATE│  语音状态
```

### Opcode 列表

| Op | 方向 | 名称 | 说明 |
|----|------|------|------|
| 0 | ◀服务端 | Dispatch | 事件推送（MESSAGE_CREATE 等） |
| 1 | ▶客户端 | Heartbeat | 心跳 |
| 2 | ▶客户端 | Identify | 认证 |
| 3 | ▶客户端 | Presence Update | 在线状态更新 |
| 4 | ▶客户端 | Voice State Update | 语音状态 |
| 6 | ▶客户端 | Resume | 断线重连 |
| 7 | ◀服务端 | Reconnect | 服务端要求重连 |
| 8 | ▶客户端 | Request Guild Members | 请求成员 |
| 9 | ◀服务端 | Invalid Session | 会话无效 |
| 10 | ◀服务端 | Hello | 欢迎帧 + 心跳间隔 |
| 11 | ◀服务端 | Heartbeat ACK | 心跳确认 |

### 断线重连 (Resume)

```
断线 → 3次心跳未回复 → 客户端关闭连接
  │
  ├─ 30秒内重连?
  │   ├─ YES → OP 6 Resume(token, session_id, seq)
  │   │        → 服务端从 Redis 读取会话
  │   │        → 从断线位置继续推送事件
  │   │
  │   └─ NO  → 会话过期 → OP 9 Invalid Session
  │             → 重新 OP 2 Identify
```

> 实现代码：`client/src/gateway/GatewayClient.ts`
> 服务端：`server/.../gateway/GatewayWebSocketHandler.java`

---

## 🎤 语音系统架构

> 📌 **设计文档（愿景）**：下面对应的是"理想中的完整音频链路"。当前实际实现是**控制面**（进出/静音/说话检测广播），**音频传输未实现**——见上方"已知限制"。当前实际：前端 `VoicePanel` 通过 Gateway OP4 加入/离开 → 服务端 `VoiceService` 记录状态并广播 `VOICE_STATE_UPDATE`；`VoiceSfuServer` 维护转发表但无音频数据流。

```
🎤 麦克风
    │
    ├── Opus 编码 (48kHz / 64kbps / 20ms帧)
    │
    ├── WebRTC PeerConnection
    │
    ├── UDP (端口 4003) ─────►  Voice SFU Server
    │                              │
    │                    ┌─────────┼─────────┐
    │                    │         │         │
    │             选择性转发     选择性转发   选择性转发
    │                    │         │         │
    ▼                    ▼         ▼         ▼
  🎧 用户A            用户B     用户C      用户D
  (听到B+C)         (听到A+C)  (听到A+B)  (听到A+B)
```

### 关键技术参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 采样率 | 48kHz | 语音最优 |
| 帧大小 | 960 samples (20ms) | 每包 |
| 编码码率 | 64kbps | 可调 8-512 |
| 丢包保护 | 15% FEC | 前向纠错 |
| 加密 | xsalsa20_poly1305 | UDP 负载加密 |

### SFU (Selective Forwarding Unit)

本项目使用 **SFU 架构**（非 MCU），原因：

- **MCU**：服务端混音后发一个流 → 服务端 CPU 高、无法单独调音量
- **SFU**：服务端只转发，每个客户端收 N 个独立流 → 低延迟、可单独调音量

> 实现代码：`server/.../voice/VoiceSfuServer.java`  
> 前端：`client/src/voice/VoiceClient.ts`

---

## 🧠 学习路线建议

如果你是**初学者**，想通过这个项目理解 Discord 的底层原理，建议按以下顺序阅读代码：

### 第一阶段：理解业务流程（30分钟）

```
前端 → 后端 → 数据库 的完整请求链
```

推荐追踪一个"**发送消息**"的完整流程：

```
1. 📄 客户端: MessageInput.tsx
   → 用户输入文字 → 回车

2. 📄 前端: api.ts
   → POST /api/channels/:id/messages

3. 📄 后端: MessageController.java
   → 接收 HTTP 请求

4. 📄 后端: MessageService.java
   → 业务逻辑 → 插入数据库

5. 📄 后端: GatewayWebSocketHandler.java
   → 广播 MESSAGE_CREATE 事件

6. 📄 前端: GatewayClient.ts
   → 收到 WS 推送 → 更新界面
```

### 第二阶段：理解实时系统（30分钟）

追踪"**加入语音频道**"流程：

```
1. GatewayClient.ts          → OP 4 Voice State Update
2. GatewayWebSocketHandler   → 调用 VoiceService
3. VoiceService              → 分配 SFU 服务器
4. VoiceSfuServer            → UDP 转发建立
5. VoiceClient.ts            → WebRTC 连接
```

### 第三阶段：理解最难的部分（1小时）

**权限系统 和 Gateway 协议** 是 Discord 最核心的两个设计：

- 📄 `PermissionService.java` — 权限计算引擎（核心算法）
- 📄 `GatewayWebSocketHandler.java` — 实时协议处理器
- 📄 `GatewayClient.ts` — 客户端心跳/重连机制

### 第四阶段：挑战（任选）

- 添加消息的 **@提及** 解析和通知
- 添加 **消息中富文本渲染**（Markdown）
- 添加 **Emoji 反应** 功能
- 实现 **Stage 频道**（听众/发言者模式）
- 实现 **真实音频传输**（WebSocket Opus 中继，WebCodecs）
- 给权限覆盖加**可视化位掩码编辑**（目前是简化后的 6 个常用权限位）

---

## 🔧 配置文件速查

### 后端配置 `server/src/main/resources/application.yml`

```yaml
# 三套配置 Profile:
# default  → 嵌入式 Tomcat (mvn spring-boot:run)
# tomcat   → 外置 Tomcat (catalina.sh run)
# prod     → 生产模式 (关闭 debug 日志)

# 关键配置项:
server.port: 4001              # 嵌入式端口
server.servlet.context-path: /discord  # 上下文路径

spring.datasource.url:          # 数据库连接
spring.data.redis.url:          # Redis 连接
app.jwt.secret:                 # JWT 密钥
app.minio.endpoint:             # MinIO 地址
```

### 前端配置 `client/.env`

```env
REACT_APP_API_URL=http://localhost:8080/discord
REACT_APP_GATEWAY_URL=ws://localhost:8080/discord/ws
REACT_APP_VOICE_URL=ws://localhost:4004
```

---

## 📊 端口规划

| 端口 | 服务 | 协议 | 说明 |
|------|------|------|------|
| **8080** | Tomcat | HTTP/WS | REST API + Gateway WebSocket |
| **4003** | Voice SFU | UDP | 音频数据转发 |
| **4004** | Voice WS | WebSocket | Voice Server 信令（预留） |
| 5432 | PostgreSQL | TCP | 数据库 |
| 6379 | Redis | TCP | 缓存 + Pub/Sub |
| 9000 | MinIO | HTTP | S3 文件存储 API |
| 9001 | MinIO Console | HTTP | 管理控制台 |
| 3000 | React Dev Server | HTTP | 前端开发 |

---

## 🚨 常见问题

### 1. `docker-compose` 命令找不到

```bash
# 报错: "无法将"docker-compose"项识别为 cmdlet"
```

**原因**：新版 Docker Desktop 使用 `docker compose`（空格），不再支持 `docker-compose`（横线）。

**解决**：

```bash
# ✅ 新版 Docker: 用空格
docker compose up -d

# ❌ 旧版写法已废弃: docker-compose up -d
```

如果 `docker compose` 也不行，说明 Docker Desktop 没装好 → 去 [docker.com](https://www.docker.com/products/docker-desktop/) 下载安装。

---

### 2. `npm start` 报找不到 package.json

```bash
# 报错: "Could not read package.json"
```

**原因**：在项目根目录直接运行了 `npm start`，但前端代码在 `client` 子目录里。

**解决**：

```bash
# ❌ 错误: 在 D:\idea databas\test1\ 下运行
npm start

# ✅ 正确: 先切换到 client 目录
cd client
npm start
```

---

### 3. Docker 启动后访问不到后端

```bash
# 浏览器打开 http://localhost:4001/discord/api/auth/me
# 返回 404 或连接失败
```

**原因**：Docker 部署用的是 Tomcat 端口映射。

**解决**：

```bash
# 确认所有容器都正常运行
docker compose ps

# 应该看到 4 个服务都是 "Up" 状态
# postgres, redis, minio, server

# Tomcat 的端口映射到 4001，访问地址是:
# http://localhost:4001/discord/api/auth/me

# 如果 4001 连不上，试试直接访问 Tomcat 端口:
# http://localhost:8080/discord/api/auth/me
```

---

### 4. 数据库连不上

```bash
# 报错: "Connection refused" 或 "数据库验证失败"
```

**原因**：PostgreSQL 还没完全启动，或密码不匹配。

**解决**：

```bash
# 查看数据库日志
docker compose logs postgres

# 等看到 "database system is ready to accept connections" 再试

# 确认 .env 或 setenv.bat 中的密码一致:
# 用户名: discord
# 密码: discord_dev_2026
# 数据库名: discord_clone
```

---

### 5. 端口被占用

```bash
# 报错: "port is already allocated"
```

**解决**：修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  postgres:
    ports:
      - "5433:5432"   # 把左边改成其他端口，右边是容器内端口不要动
  server:
    ports:
      - "4005:8080"   # 把 4001 改成 4005
```

改完重启：`docker compose up -d`

---

### 6. 前端 CORS 报错

```bash
# 浏览器控制台: "Access-Control-Allow-Origin" 错误
```

**解决**：确认 `client/.env` 中的地址是否正确指向 Tomcat 地址：

```env
# 外置 Tomcat 部署:
REACT_APP_API_URL=http://localhost:8080/discord

# Docker 部署:
REACT_APP_API_URL=http://localhost:4001/discord

# 嵌入式启动:
REACT_APP_API_URL=http://localhost:4001/discord
```

修改后要**重启前端**（Ctrl+C 停掉，重新 `npm start`）才会生效。

---

## ⚠️ 已知限制

- **无真实音频传输**：语音目前是控制面（进出/静音/说话检测），听不到声音。要加需 WebSocket Opus 中继（WebCodecs，仅 Chrome/Edge）或服务端 DTLS/SRTP 网关（数周工作量）
- **无表情选择器、@提及、消息搜索**：不在当前范围
- **无头像/用户资料页、手动在线状态切换**
- **单机内存版**：SFU 转发表与缓存（`CacheService`）都是进程内实现，不支持多实例横向扩展
- **会话 resume 窗口 30 秒**：超过后重连需重新 Identify
- **docker-compose 配置已修正但本机未装 Docker 验证**：`server/` 树与 `src/` 树保持手动同步，改后端记得两处都改

---

## 📋 待办 (Todo)

> 下一步建议按优先级做这两件工程化事项，做完项目就"闭环"了。

### ☑️ 1. 配置 CI（每次 push 自动跑测试）

**目标**：项目推上 GitHub 后，每次 `git push` 云端自动跑 `mvn test`（后端 12 个集成测试）+ `npm test`（前端 6 个状态机测试），红了立刻提示。

**待办步骤**：
- [ ] `git init` 并把项目推到 GitHub（当前项目还不是 git 仓库）
- [ ] 在仓库加 `.github/workflows/ci.yml`，配置两个 job：
  - [ ] 后端 job：`setup-java@17` → `mvn test`
  - [ ] 前端 job：`setup-node@20` → `cd client && npm ci && npm test`
- [ ] push 后确认 Actions 跑绿

### ☑️ 2. 收敛双源码树（消除手动同步的坑）

**问题**：`src/`（线上 IDEA 部署用，MySQL）与 `server/`（docker 部署用，H2/PostgreSQL）是两份几乎相同的后端源码，改一处要手动复制另一处，容易漂移。

**待办步骤（任选其一）**：
- [ ] **方案 A（推荐）**：删掉 `server/src`，让 Dockerfile 直接基于根 `src/` 构建（只保留 `server/` 的 Dockerfile / pom / 资源差异）
- [ ] **方案 B**：写一个同步脚本（如 `sync.bat`）一键把 `src/main/java` 复制到 `server/src/main/java`，减少漏改
- [ ] 同步后跑 `mvn test` + `mvn -f server/pom.xml test` 双验证

---

## 🤝 贡献指南

这是一个学习项目，欢迎提 Issue 和 PR！

**想加功能？** 建议先看上面的"学习路线"，从第四阶段的任务挑一个做。

**发现 Bug？** 直接提 Issue，我会尽快修复。

---

## ⚠️ 免责声明

- 🎯 **本项目纯属学习目的**，仅限本地运行
- 🚫 **不会联网公开、不提供给他人使用、不存在商用**
- 🔍 仅用来拆解学习 Discord 的底层实现逻辑
- ™️ Discord 是 Discord Inc. 的商标

---

<div align="center">
  
**Happy Coding!** 🚀

</div>
