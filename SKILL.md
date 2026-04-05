---
name: knowledge-explorer
version: 0.2.0
description: "飞书知识探索器：扫描飞书知识库，AI语义聚类自动发现文档间隐藏关系，生成碰撞洞察和行动建议。当用户需要分析知识库结构、发现文档关联、检查知识健康度（孤岛/过期/重复）、或想从已有文档中碰撞出新想法时使用。If user mentions 知识图谱、文档关系、知识库分析、explore my docs, use this skill."
metadata:
  requires:
    bins: ["lark-cli", "node"]
---

# Knowledge Explorer — 飞书知识探索器

> **前置条件：** 需要 lark-cli 已登录（`lark-cli auth login`）、Node.js >= 18、OpenAI 兼容 API key。

## 安装

```bash
cd ~/Desktop/knowledge-explorer   # 或 skill 安装目录
npm install && npm run build
```

## 核心命令

```bash
# 全量扫描：遍历所有 wiki 空间，AI 语义聚类，生成洞察报告
OPENAI_API_KEY=sk-xxx npx knowledge-explorer

# 关键词搜索模式（更快，范围更窄）
npx knowledge-explorer --query "产品规划"

# 仅分析我的文档
npx knowledge-explorer --owner me

# 分析他人文档
npx knowledge-explorer --owner others

# 按名字过滤
npx knowledge-explorer --owner "张三"

# 指定空间
npx knowledge-explorer --space <space_id>

# 列出所有可访问的知识空间
npx knowledge-explorer --list-spaces
```

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `OPENAI_API_KEY` | 是 | OpenAI 兼容 API key（支持通义千问、DeepSeek 等） |
| `OPENAI_BASE_URL` | 否 | 自定义 API 端点 |
| `AI_MODEL` | 否 | 模型名称（默认 gpt-4o-mini） |

## 工作流程

1. **收集** — 遍历 wiki 空间 + 全局搜索，抓取文档内容
2. **建图** — AI 生成摘要 → 语义批量聚类 → 簇内自动建边
3. **洞察** — L1 结构（枢纽/孤岛/桥梁） → L2 语义（主题/矛盾/重复） → L3 碰撞（跨簇创意激发）
4. **输出** — 终端彩色报告 + 自动创建飞书文档沉淀

## 输出内容

- **知识健康度**：枢纽文档、孤岛文档、可能过期文档
- **主题聚类**：AI 自动分组 + 主题标签
- **碰撞洞察**：跨簇无直连文档的创意组合建议
- **飞书文档**：完整报告自动创建到飞书云文档

## 使用场景

| 场景 | 命令 |
|------|------|
| 想看知识库全貌 | `npx knowledge-explorer` |
| 某个主题有哪些相关文档 | `npx knowledge-explorer --query "用户增长"` |
| 清理自己的文档 | `npx knowledge-explorer --owner me` |
| 发现团队重复造轮子 | `npx knowledge-explorer`（看聚类中的重复主题） |
| 头脑风暴/找灵感 | 看碰撞洞察部分 |

## 注意事项

- 首次运行会生成 `.knowledge-cache/` 缓存目录，后续运行增量更新
- AI 摘要和聚类会消耗 API token，100 篇文档约 113 次调用
- 无 API key 时会跳过语义分析，仅输出结构洞察
- 缓存可安全删除：`rm -rf .knowledge-cache/`

## 权限

| 操作 | 所需 scope |
|------|-----------|
| 搜索文档 | `search:docs_wiki:readonly` |
| 读取 wiki 节点 | `wiki:node:read` |
| 读取文档内容 | `docx:document:readonly` |
| 创建报告文档 | `docx:document` |
