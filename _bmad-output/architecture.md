---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - 'docs/architecture/README.md'
  - 'docs/architecture/WORKING.md'
  - 'docs/API/SEARCH.md'
  - 'docs/installation/UPDATING.md'
workflowType: 'architecture'
project_name: 'Perplexica'
user_name: 'Karljiang'
date: '2025-12-25'
hasProjectContext: false
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## 项目上下文分析

### 需求概览

**功能需求（从现有架构推断）：**

Perplexica是一个开源的AI驱动搜索引擎，提供以下核心功能：

1. **多模式智能搜索**
   - Web搜索：通用互联网搜索
   - 学术搜索：针对学术资源优化
   - 写作助手：辅助内容创作
   - Wolfram Alpha搜索：数学和科学计算
   - YouTube搜索：视频内容检索
   - Reddit搜索：社区讨论检索

2. **AI驱动的查询理解**
   - 基于对话历史理解用户意图
   - 智能判断是否需要web搜索
   - 自动生成优化的搜索查询

3. **智能结果处理**
   - Embedding模型重排序（余弦相似度、点积距离）
   - 自动结果引用和来源追踪
   - 图片和视频搜索支持

4. **灵活的AI集成**
   - 支持多个LLM提供商（Claude、GPT等）
   - 可配置的chat模型和embedding模型
   - UUID-based提供商管理

5. **实时响应能力**
   - Server-Sent Events (SSE)流式响应
   - 分块数据传输优化用户体验

**非功能需求：**

- **性能**：embedding相似度搜索需要高效算法实现
- **可扩展性**：多提供商架构支持添加新的LLM
- **可用性**：Web界面 + RESTful API双接口
- **准确性**：多阶段过滤确保搜索结果相关性
- **可维护性**：支持Docker和非Docker部署方式

### 技术规模与复杂度

**项目规模评估：**

- **复杂度级别**：中到高级
- **主要技术领域**：全栈AI应用（前端UI + 后端API + AI/ML集成 + 第三方搜索引擎集成）
- **预估架构组件数量**：5个主要层级，多个子系统

**复杂度指标：**

- ✅ **实时功能**：流式AI响应生成
- ⚠️ **多租户**：未明确提及（需确认）
- ✅ **集成复杂性**：SearXNG搜索引擎 + 多个LLM提供商 + Embedding服务
- ✅ **用户交互复杂性**：对话历史管理、多模式搜索、实时流式更新
- ✅ **数据复杂性**：搜索结果处理、向量embedding、相似度计算

### 技术约束与依赖

**已知依赖：**

1. **SearXNG**：元搜索引擎，作为web搜索的核心基础设施
2. **LLM API**：依赖外部AI服务提供商（Claude、OpenAI等）
3. **Embedding模型API**：用于结果重排序的向量化服务
4. **Docker（可选）**：支持容器化部署

**技术约束：**

- 依赖外部LLM API的可用性和响应时间
- Embedding模型的计算成本和延迟
- SearXNG搜索引擎的性能和稳定性

### 已识别的跨领域关注点

以下关注点将影响多个架构组件：

1. **LLM提供商管理**
   - 提供商配置和切换
   - API密钥管理和安全存储
   - 错误处理和fallback策略
   - 成本监控和限流

2. **Embedding相似度搜索**
   - 向量化算法选择
   - 相似度计算优化（cosine vs dot product）
   - 结果重排序策略
   - 缓存机制

3. **流式响应架构**
   - SSE连接管理
   - 分块数据传输
   - 错误恢复和重连机制
   - 客户端状态同步

4. **API设计与版本控制**
   - RESTful端点设计
   - 请求/响应格式标准化
   - 向后兼容性
   - 错误响应规范

5. **搜索质量保证**
   - 查询优化策略
   - 结果相关性评估
   - 引用准确性验证
   - 用户反馈循环

## 现有技术栈决策

### 项目类型

全栈AI应用 - 基于 Next.js 15 构建的AI驱动搜索引擎

### 核心技术栈

**语言与运行时：**
- TypeScript 5.9.3 - 提供类型安全和更好的开发体验
- Node.js（通过Next.js运行时）

**前端框架：**
- Next.js 15.2.2 (App Router) - 提供SSR、API路由和全栈能力
- React 18 - 现代化UI库

**样式解决方案：**
- Tailwind CSS 3.3 - 实用优先的CSS框架，快速UI开发
- Tailwind Merge - 条件样式合并
- clsx - 动态类名管理
- Framer Motion 12 - 高级动画和过渡效果

**AI/ML集成：**
- LangChain - 统一的AI应用开发框架
- 多LLM提供商架构：
  - Anthropic (Claude)
  - OpenAI (GPT)
  - Google GenAI (Gemini)
  - Groq
  - Ollama (本地模型)
- Hugging Face Transformers - 本地embedding模型支持

**数据层：**
- Better SQLite3 - 轻量级、零配置的SQL数据库
- Drizzle ORM - TypeScript优先的ORM，提供类型安全的数据库操作

**搜索与相似度：**
- compute-cosine-similarity - 高效的向量相似度计算
- LangChain Text Splitters - 文档分块处理

**文档处理能力：**
- PDF: pdf-parse, jsPDF
- Word: mammoth
- HTML: html-to-text
- Markdown: markdown-to-jsx

**UI组件库：**
- Headless UI - 无样式、可访问的UI组件基础
- Lucide React - SVG图标库
- yet-another-react-lightbox - 图片/视频查看器
- react-textarea-autosize - 自适应文本区域

**开发工具链：**
- ESLint + eslint-config-next - 代码质量检查
- Prettier - 代码格式化
- Drizzle Kit - 数据库模式管理和迁移

**部署与容器化：**
- Docker支持（Dockerfile + docker-compose.yaml）
- 生产级构建优化（Next.js内置）

### 架构模式已建立

**项目结构：**
- `/src/app` - Next.js App Router页面和路由
- `/src/components` - React组件
- `/src/lib` - 共享库和工具函数
- `/data` - SQLite数据库文件
- `/docs` - 项目文档

**代码组织约定：**
- TypeScript严格模式
- 模块化组件设计
- API路由与服务器组件分离

**状态管理：**
- React Server Components优先
- 客户端状态按需使用

**开发体验功能：**
- Next.js Fast Refresh - 热重载
- TypeScript类型检查
- ESLint实时代码分析
- Prettier自动格式化

### 架构决策理由

**为什么选择Next.js：**
- 统一前端和后端在一个项目中
- 优秀的React Server Components支持
- 内置API路由，简化后端开发
- 出色的SEO和性能优化

**为什么选择SQLite + Drizzle：**
- 零配置，简化部署
- 对于单机搜索引擎足够高效
- Drizzle提供类型安全的数据库操作
- 易于备份和迁移

**为什么选择LangChain多提供商架构：**
- 避免单一LLM供应商锁定
- 灵活切换不同模型以优化成本和性能
- 统一的API抽象层
- 支持本地模型（Ollama）降低成本

**为什么选择Tailwind CSS：**
- 快速原型开发
- 一致的设计系统
- 优秀的性能（生产环境自动清除未使用样式）
- 与现代React完美配合
