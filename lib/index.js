/**
 * dsh-9router — Full 9Router inside DSH Desktop (Host half)
 * - Single "9router" provider route that exposes every combo + provider/model
 * - Own gateway API (OpenAI-compatible) via connection.fetch routes
 * - JSON-backed persistence under $DSH_HOME/dsh-9router (no native deps)
 * - Real streaming proxy with combo fallback / capacity adapter
 */
import z from "@deepseek-ai/schemastery";
import { LlmAdapter, LlmError, attributionHeaders } from "@deepseek-ai/dsh-llm";
import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Paths & storage
function getDshHome() {
  return process.env.DSH_HOME || process.env.DSH_DESKTOP_HOME || join(homedir(), ".dsh");
}
function routerHome() {
  const dir = join(getDshHome(), "dsh-9router");
  try { mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
}
function routerDataFile(name) { return join(routerHome(), name); }
function readJson(file, fallback) {
  try { if (!existsSync(file)) return fallback; return JSON.parse(readFileSync(file, "utf8")); } catch { return fallback; }
}
function writeJson(file, data) {
  try { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(data, null, 2), "utf8"); } catch (e) { console.warn("[9router] writeJson failed", e?.message); }
}

// ---------------------------------------------------------------------------
// Registry (subset of 9router registry, co-located for self-containment)
// Each entry ships display + transport + model catalog. Transport defaults to OpenAI
// compatible chat/completions. Providers with alias are reachable via alias.
const REGISTRY = [
  {
    "id": "alicode-intl",
    "display": {
      "name": "Alibaba Coding",
      "color": "#FF6A00"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://coding-intl.dashscope.aliyuncs.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "qwen3.5-plus"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "glm-5"
      },
      {
        "id": "MiniMax-M2.5"
      },
      {
        "id": "qwen3-coder-next"
      },
      {
        "id": "qwen3-coder-plus"
      },
      {
        "id": "glm-4.7"
      }
    ],
    "alias": "alicode-intl"
  },
  {
    "id": "alicode",
    "display": {
      "name": "Alibaba",
      "color": "#FF6A00"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://coding.dashscope.aliyuncs.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "qwen3.5-plus"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "glm-5"
      },
      {
        "id": "MiniMax-M2.5"
      },
      {
        "id": "qwen3-max-2026-01-23"
      },
      {
        "id": "qwen3-coder-next"
      },
      {
        "id": "qwen3-coder-plus"
      },
      {
        "id": "glm-4.7"
      }
    ],
    "alias": "alicode"
  },
  {
    "id": "alims-intl",
    "display": {
      "name": "Alibaba Studio",
      "color": "#FF6A00"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions"
    },
    "models": [
      {
        "id": "qwen3.5-plus"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "glm-5"
      },
      {
        "id": "MiniMax-M2.5"
      },
      {
        "id": "qwen3-coder-next"
      },
      {
        "id": "qwen3-coder-plus"
      },
      {
        "id": "glm-4.7"
      }
    ],
    "alias": "alims-intl"
  },
  {
    "id": "alitp-intl",
    "display": {
      "name": "Alibaba Token Plan",
      "color": "#FF6A00"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions"
    },
    "models": [
      {
        "id": "qwen3.8-max-preview"
      },
      {
        "id": "qwen3.7-max"
      },
      {
        "id": "qwen3.7-plus"
      },
      {
        "id": "qwen3.6-flash"
      },
      {
        "id": "glm-5.2"
      },
      {
        "id": "deepseek-v4-pro"
      }
    ],
    "alias": "alitp-intl"
  },
  {
    "id": "anthropic",
    "display": {
      "name": "Anthropic",
      "color": "#D97757"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.anthropic.com/v1/messages"
    },
    "models": [
      {
        "id": "claude-sonnet-4-20250514"
      },
      {
        "id": "claude-opus-4-20250514"
      },
      {
        "id": "claude-3-5-sonnet-20241022"
      }
    ],
    "alias": "anthropic"
  },
  {
    "id": "antigravity",
    "display": {
      "name": "Antigravity",
      "color": "#F59E0B"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://daily-cloudcode-pa.googleapis.com/v1internal:generateContent"
    },
    "models": [
      {
        "id": "gemini-3.8-flash-high"
      },
      {
        "id": "gemini-3.8-flash-medium"
      },
      {
        "id": "gemini-3.8-flash-low"
      },
      {
        "id": "gemini-3.8-flash"
      },
      {
        "id": "gemini-3.7-flash-high"
      },
      {
        "id": "gemini-3.7-flash-medium"
      },
      {
        "id": "gemini-3.7-flash-low"
      },
      {
        "id": "gemini-3.6-flash-high"
      },
      {
        "id": "gemini-3.6-flash-medium"
      },
      {
        "id": "gemini-3.6-flash-low"
      },
      {
        "id": "gemini-3.5-flash-high"
      },
      {
        "id": "gemini-3-flash-agent"
      },
      {
        "id": "gemini-3.5-flash-low"
      },
      {
        "id": "gemini-3.5-flash-extra-low"
      },
      {
        "id": "gemini-pro-agent"
      },
      {
        "id": "gemini-3.1-pro-low"
      },
      {
        "id": "claude-sonnet-4-6"
      },
      {
        "id": "claude-opus-4-6-thinking"
      },
      {
        "id": "gpt-oss-120b-medium"
      },
      {
        "id": "gemini-3-flash"
      },
      {
        "id": "gemini-3.1-flash-image"
      }
    ],
    "alias": "ag"
  },
  {
    "id": "api-airforce",
    "display": {
      "name": "API.airforce",
      "color": "#0EA5E9"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://api.airforce/v1/chat/completions"
    },
    "models": [
      {
        "id": "gpt-oss-120b"
      },
      {
        "id": "gpt-oss-20b"
      },
      {
        "id": "kimi-k2.7-code"
      }
    ],
    "alias": "af",
    "aliases": [
      "airforce"
    ]
  },
  {
    "id": "assemblyai",
    "display": {
      "name": "AssemblyAI",
      "color": "#0062FF"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.assemblyai.com/v1/audio/transcriptions"
    },
    "models": [
      {
        "id": "universal-3-pro"
      }
    ],
    "alias": "assemblyai",
    "aliases": [
      "aai"
    ]
  },
  {
    "id": "aws-polly",
    "display": {
      "name": "AWS Polly",
      "color": "#FF9900"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://polly.{region}.amazonaws.com/v1/speech"
    },
    "models": [
      {
        "id": "standard"
      },
      {
        "id": "neural"
      },
      {
        "id": "long-form"
      },
      {
        "id": "generative"
      }
    ],
    "alias": "polly"
  },
  {
    "id": "azure",
    "display": {
      "name": "Azure OpenAI",
      "color": "#0078D4"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://{endpoint}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview"
    },
    "models": [],
    "alias": "azure"
  },
  {
    "id": "baidu",
    "display": {
      "name": "Baidu Qianfan",
      "color": "#2932E1"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://qianfan.baidubce.com/v2/chat/completions"
    },
    "models": [
      {
        "id": "deepseek-v4-pro"
      },
      {
        "id": "deepseek-v4-flash"
      },
      {
        "id": "glm-5.2"
      },
      {
        "id": "glm-5.1"
      },
      {
        "id": "kimi-k2.6"
      },
      {
        "id": "qwen3.5-397b-a17b"
      },
      {
        "id": "qwen3.5-27b"
      }
    ],
    "alias": "qianfan",
    "aliases": [
      "qianfan",
      "ernie",
      "baidu-qianfan"
    ]
  },
  {
    "id": "bazaarlink",
    "display": {
      "name": "Bazaarlink",
      "color": "#DC2626"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://bazaarlink.ai/api/v1/chat/completions"
    },
    "models": [
      {
        "id": "auto:free"
      },
      {
        "id": "claude-opus-4.7"
      },
      {
        "id": "claude-sonnet-4.6"
      },
      {
        "id": "claude-haiku-4.5"
      },
      {
        "id": "gpt-5.5"
      },
      {
        "id": "gpt-5.4"
      },
      {
        "id": "gpt-5.4-mini"
      },
      {
        "id": "gpt-5.4-nano"
      },
      {
        "id": "grok-4.3"
      },
      {
        "id": "grok-4.20"
      },
      {
        "id": "gemini-3.1-pro-preview"
      },
      {
        "id": "gemini-3-flash-preview"
      },
      {
        "id": "gemini-3.1-flash-lite-preview"
      },
      {
        "id": "kimi-k2.6"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "glm-5.1"
      },
      {
        "id": "glm-5"
      },
      {
        "id": "mimo-v2.5-pro"
      },
      {
        "id": "mimo-v2.5"
      },
      {
        "id": "minimax-m3"
      },
      {
        "id": "minimax-m2.7"
      },
      {
        "id": "minimax-m2.5"
      },
      {
        "id": "qwen3.6-plus"
      },
      {
        "id": "nemotron-3-super-120b-a12b"
      }
    ],
    "alias": "bzl",
    "aliases": [
      "bazaar-link"
    ]
  },
  {
    "id": "black-forest-labs",
    "display": {
      "name": "Black Forest Labs",
      "color": "#111827"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.bfl.ai/v1"
    },
    "models": [
      {
        "id": "flux-pro-1.1"
      }
    ],
    "alias": "black-forest-labs",
    "aliases": [
      "bfl"
    ]
  },
  {
    "id": "blackbox",
    "display": {
      "name": "Blackbox AI",
      "color": "#5B5FEF"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.blackbox.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "claude-fable-5"
      },
      {
        "id": "claude-opus-4.8"
      },
      {
        "id": "claude-sonnet-4.6"
      },
      {
        "id": "gpt-5.5"
      },
      {
        "id": "gpt-5.4-pro"
      },
      {
        "id": "gpt-5.4"
      },
      {
        "id": "gpt-5.3-codex"
      },
      {
        "id": "gpt-5.4-nano"
      },
      {
        "id": "deepseek-v4-flash"
      },
      {
        "id": "grok-4.3"
      }
    ],
    "alias": "blackbox",
    "aliases": [
      "bb"
    ]
  },
  {
    "id": "bluesminds",
    "display": {
      "name": "BluesMinds",
      "color": "#2563EB"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.bluesminds.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "gpt-4.1"
      },
      {
        "id": "gpt-4.1-mini"
      },
      {
        "id": "gpt-4.1-nano"
      },
      {
        "id": "claude-sonnet-4-5"
      },
      {
        "id": "claude-haiku-4-5"
      },
      {
        "id": "gemini-2.0-flash"
      },
      {
        "id": "gemini-2.0-flash-exp"
      },
      {
        "id": "qwen-turbo"
      },
      {
        "id": "kimi-k2"
      },
      {
        "id": "kimi-k2-thinking"
      },
      {
        "id": "glm-4.7"
      },
      {
        "id": "minimax-m2.5"
      },
      {
        "id": "claude-opus-4-5"
      },
      {
        "id": "gemini-2.5-pro"
      }
    ],
    "alias": "bm",
    "aliases": [
      "blue-sminds"
    ]
  },
  {
    "id": "brave-search",
    "display": {
      "name": "Brave Search",
      "color": "#FB542B"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.search.brave.com/res/v1"
    },
    "models": [],
    "alias": "brave"
  },
  {
    "id": "byteplus",
    "display": {
      "name": "BytePlus ModelArk",
      "color": "#2563EB"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://ark.ap-southeast.bytepluses.com/api/coding/v3/chat/completions"
    },
    "models": [
      {
        "id": "seed-2-0-pro-260328"
      },
      {
        "id": "seed-2-0-code-preview-260328"
      },
      {
        "id": "seed-2-0-mini-260215"
      },
      {
        "id": "seed-2-0-lite-260228"
      },
      {
        "id": "kimi-k2-thinking-251104"
      },
      {
        "id": "glm-4-7-251222"
      },
      {
        "id": "gpt-oss-120b-250805"
      }
    ],
    "alias": "byteplus",
    "aliases": [
      "bpm"
    ]
  },
  {
    "id": "cartesia",
    "display": {
      "name": "Cartesia",
      "color": "#FF4F8B"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.cartesia.ai/tts/bytes"
    },
    "models": [
      {
        "id": "sonic-2"
      },
      {
        "id": "sonic-3"
      }
    ],
    "alias": "cartesia"
  },
  {
    "id": "cerebras",
    "display": {
      "name": "Cerebras",
      "color": "#FF4F00"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.cerebras.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "gpt-oss-120b"
      },
      {
        "id": "zai-glm-4.7"
      },
      {
        "id": "llama-3.3-70b"
      },
      {
        "id": "llama-4-scout-17b-16e-instruct"
      },
      {
        "id": "qwen-3-235b-a22b-instruct-2507"
      },
      {
        "id": "qwen-3-32b"
      }
    ],
    "alias": "cerebras"
  },
  {
    "id": "chutes",
    "display": {
      "name": "Chutes AI",
      "color": "#ffffffff"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://llm.chutes.ai/v1/chat/completions"
    },
    "models": [],
    "alias": "chutes",
    "aliases": [
      "ch"
    ]
  },
  {
    "id": "claude",
    "display": {
      "name": "Claude Code",
      "color": "#D97757"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.anthropic.com/v1/messages"
    },
    "models": [
      {
        "id": "claude-opus-5"
      },
      {
        "id": "claude-fable-5-1"
      },
      {
        "id": "claude-fable-5"
      },
      {
        "id": "claude-sonnet-5"
      },
      {
        "id": "claude-haiku-4-5-20251001"
      }
    ],
    "alias": "cc"
  },
  {
    "id": "cline",
    "display": {
      "name": "Cline",
      "color": "#5B9BD5"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.cline.bot/api/v1/chat/completions"
    },
    "models": [
      {
        "id": "anthropic/claude-opus-4.7"
      },
      {
        "id": "anthropic/claude-sonnet-4.6"
      },
      {
        "id": "anthropic/claude-opus-4.6"
      },
      {
        "id": "openai/gpt-5.3-codex"
      },
      {
        "id": "openai/gpt-5.4"
      },
      {
        "id": "google/gemini-3.1-pro-preview"
      },
      {
        "id": "google/gemini-3.1-flash-lite-preview"
      },
      {
        "id": "kwaipilot/kat-coder-pro"
      }
    ],
    "alias": "cl"
  },
  {
    "id": "clinepass",
    "display": {
      "name": "ClinePass",
      "color": "#5B9BD5"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.cline.bot/api/v1/chat/completions"
    },
    "models": [
      {
        "id": "cline-pass/glm-5.2"
      },
      {
        "id": "cline-pass/kimi-k2.7-code"
      },
      {
        "id": "cline-pass/kimi-k2.6"
      },
      {
        "id": "cline-pass/deepseek-v4-pro"
      },
      {
        "id": "cline-pass/deepseek-v4-flash"
      },
      {
        "id": "cline-pass/mimo-v2.5"
      },
      {
        "id": "cline-pass/mimo-v2.5-pro"
      },
      {
        "id": "cline-pass/minimax-m3"
      },
      {
        "id": "cline-pass/qwen3.7-max"
      },
      {
        "id": "cline-pass/qwen3.7-plus"
      }
    ],
    "alias": "clinepass"
  },
  {
    "id": "cloudflare-ai",
    "display": {
      "name": "Cloudflare",
      "color": "#F38020"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "@cf/meta/llama-3.2-1b-instruct"
      },
      {
        "id": "@cf/meta/llama-3.2-3b-instruct"
      },
      {
        "id": "@cf/meta/llama-3.1-8b-instruct-fp8-fast"
      },
      {
        "id": "@cf/meta/llama-3.1-8b-instruct-awq"
      },
      {
        "id": "@cf/mistralai/mistral-small-3.1-24b-instruct"
      },
      {
        "id": "@cf/meta/llama-3.1-70b-instruct-fp8-fast"
      },
      {
        "id": "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
      },
      {
        "id": "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"
      },
      {
        "id": "@cf/moonshotai/kimi-k2.5"
      },
      {
        "id": "@cf/moonshotai/kimi-k2.6"
      },
      {
        "id": "@cf/zai-org/glm-4.7-flash"
      },
      {
        "id": "@cf/qwen/qwq-32b"
      },
      {
        "id": "@cf/qwen/qwen2.5-coder-32b-instruct"
      },
      {
        "id": "@cf/black-forest-labs/flux-2-klein-9b"
      }
    ],
    "alias": "cloudflare-ai",
    "aliases": [
      "cf"
    ]
  },
  {
    "id": "codebuddy-cn",
    "display": {
      "name": "CodeBuddy CN",
      "color": "#006EFF"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://copilot.tencent.com/v2/chat/completions"
    },
    "models": [
      {
        "id": "glm-5.2"
      },
      {
        "id": "glm-5.1"
      },
      {
        "id": "glm-5v-turbo"
      },
      {
        "id": "minimax-m3"
      },
      {
        "id": "kimi-k2.7"
      },
      {
        "id": "kimi-k2.6"
      },
      {
        "id": "hy3"
      },
      {
        "id": "hy4-preview"
      },
      {
        "id": "glm-5.3"
      },
      {
        "id": "glm-5.3-flash"
      },
      {
        "id": "kimi-k3-1"
      },
      {
        "id": "deepseek-v4-pro"
      },
      {
        "id": "deepseek-v4.1-flash"
      }
    ],
    "alias": "cbcn"
  },
  {
    "id": "codebuddy-intl",
    "display": {
      "name": "CodeBuddy",
      "color": "#006EFF"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://www.codebuddy.ai/v2/chat/completions"
    },
    "models": [
      {
        "id": "glm-5.2"
      },
      {
        "id": "glm-5.1"
      },
      {
        "id": "glm-5.0"
      },
      {
        "id": "glm-5.0-turbo"
      },
      {
        "id": "glm-5v-turbo"
      },
      {
        "id": "glm-4.7"
      },
      {
        "id": "minimax-m3"
      },
      {
        "id": "minimax-m2.7"
      },
      {
        "id": "kimi-k2.7"
      },
      {
        "id": "kimi-k2.6"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "hy3-preview"
      },
      {
        "id": "deepseek-v4-pro"
      },
      {
        "id": "deepseek-v4-flash"
      },
      {
        "id": "deepseek-v3-2-volc"
      }
    ],
    "alias": "cbai"
  },
  {
    "id": "codex",
    "display": {
      "name": "OpenAI Codex",
      "color": "#3B82F6"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://chatgpt.com/backend-api/codex/responses"
    },
    "models": [
      {
        "id": "gpt-6-astra"
      },
      {
        "id": "gpt-5.6-sol"
      },
      {
        "id": "gpt-5.6-sol-review"
      },
      {
        "id": "gpt-5.6-terra"
      },
      {
        "id": "gpt-5.6-terra-review"
      },
      {
        "id": "gpt-5.6-luna"
      },
      {
        "id": "gpt-5.6-luna-review"
      },
      {
        "id": "gpt-5.5"
      },
      {
        "id": "gpt-5.5-review"
      },
      {
        "id": "gpt-5.4"
      },
      {
        "id": "gpt-5.4-review"
      },
      {
        "id": "gpt-5.4-mini"
      },
      {
        "id": "gpt-5.4-mini-review"
      },
      {
        "id": "gpt-5.3-codex-spark"
      },
      {
        "id": "gpt-5.3-codex-spark-review"
      },
      {
        "id": "gpt-image-2.5"
      }
    ],
    "alias": "cx"
  },
  {
    "id": "cohere",
    "display": {
      "name": "Cohere",
      "color": "#39594D"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.cohere.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "command-r-plus-08-2024"
      },
      {
        "id": "command-r-08-2024"
      },
      {
        "id": "command-a-03-2025"
      }
    ],
    "alias": "cohere"
  },
  {
    "id": "comfyui",
    "display": {
      "name": "ComfyUI",
      "color": "#4CAF50"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "http://localhost:8188"
    },
    "models": [
      {
        "id": "flux-dev"
      }
    ],
    "alias": "comfyui"
  },
  {
    "id": "commandcode",
    "display": {
      "name": "Command Code",
      "color": "#000000"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.commandcode.ai/alpha/generate"
    },
    "models": [
      {
        "id": "deepseek/deepseek-v4-pro"
      },
      {
        "id": "deepseek/deepseek-v4-flash"
      },
      {
        "id": "moonshotai/Kimi-K2.6"
      },
      {
        "id": "moonshotai/Kimi-K2.5"
      },
      {
        "id": "zai-org/GLM-5.1"
      },
      {
        "id": "zai-org/GLM-5"
      },
      {
        "id": "MiniMaxAI/MiniMax-M2.7"
      },
      {
        "id": "MiniMaxAI/MiniMax-M2.5"
      },
      {
        "id": "Qwen/Qwen3.6-Max-Preview"
      },
      {
        "id": "Qwen/Qwen3.6-Plus"
      },
      {
        "id": "stepfun/Step-3.5-Flash"
      }
    ],
    "alias": "commandcode",
    "aliases": [
      "cmc"
    ]
  },
  {
    "id": "coqui",
    "display": {
      "name": "Coqui TTS",
      "color": "#10B981"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "http://localhost:5002/api/tts"
    },
    "models": [
      {
        "id": "tts_models/en/ljspeech/tacotron2-DDC"
      }
    ],
    "alias": "coqui"
  },
  {
    "id": "cursor",
    "display": {
      "name": "Cursor IDE",
      "color": "#00D4AA"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api2.cursor.sh"
    },
    "models": [
      {
        "id": "default"
      },
      {
        "id": "claude-4.5-opus-high-thinking"
      },
      {
        "id": "claude-4.5-opus-high"
      },
      {
        "id": "claude-4.5-sonnet-thinking"
      },
      {
        "id": "claude-4.5-sonnet"
      },
      {
        "id": "claude-4.5-haiku"
      },
      {
        "id": "claude-4.5-opus"
      },
      {
        "id": "gpt-5.2-codex"
      },
      {
        "id": "claude-4.6-opus-max"
      },
      {
        "id": "claude-4.6-sonnet-medium-thinking"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "gemini-3-flash-preview"
      },
      {
        "id": "gpt-5.2"
      },
      {
        "id": "gpt-5.3-codex"
      }
    ],
    "alias": "cu"
  },
  {
    "id": "deepgram",
    "display": {
      "name": "Deepgram",
      "color": "#13EF93"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.deepgram.com/v1/listen"
    },
    "models": [
      {
        "id": "nova-3"
      }
    ],
    "alias": "deepgram",
    "aliases": [
      "dg"
    ]
  },
  {
    "id": "deepseek",
    "display": {
      "name": "DeepSeek",
      "color": "#4D6BFE"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.deepseek.com/chat/completions"
    },
    "models": [
      {
        "id": "deepseek-v4-pro"
      },
      {
        "id": "deepseek-v4-pro-max"
      },
      {
        "id": "deepseek-v4-pro-none"
      },
      {
        "id": "deepseek-v4-flash"
      },
      {
        "id": "deepseek-v4-flash-vision-exp"
      },
      {
        "id": "deepseek-chat"
      },
      {
        "id": "deepseek-reasoner"
      }
    ],
    "alias": "deepseek",
    "aliases": [
      "ds"
    ]
  },
  {
    "id": "devin-cli",
    "display": {
      "name": "Devin CLI",
      "color": "#6366F1"
    },
    "category": "free",
    "transport": {
      "baseUrl": "devin://acp/stdio"
    },
    "models": [
      {
        "id": "swe-1.6-fast"
      },
      {
        "id": "swe-1.6"
      },
      {
        "id": "swe-1.5-fast"
      },
      {
        "id": "swe-1.5"
      },
      {
        "id": "claude-opus-4.7-max"
      },
      {
        "id": "claude-opus-4.7-high"
      },
      {
        "id": "claude-opus-4.7-medium"
      },
      {
        "id": "claude-opus-4.7-low"
      },
      {
        "id": "claude-sonnet-4.6-thinking-1m"
      },
      {
        "id": "claude-sonnet-4.6-thinking"
      },
      {
        "id": "claude-sonnet-4.6"
      },
      {
        "id": "claude-opus-4.6-thinking"
      },
      {
        "id": "claude-opus-4.6"
      },
      {
        "id": "claude-sonnet-4.5"
      },
      {
        "id": "claude-haiku-4.5"
      },
      {
        "id": "gpt-5.5-xhigh"
      },
      {
        "id": "gpt-5.5-high"
      },
      {
        "id": "gpt-5.5-medium"
      },
      {
        "id": "gpt-5.5-low"
      },
      {
        "id": "gpt-5.4-high"
      },
      {
        "id": "gpt-5.4-medium"
      },
      {
        "id": "gpt-5.4-low"
      },
      {
        "id": "gpt-5.3-codex-high"
      },
      {
        "id": "gpt-5.3-codex-medium"
      },
      {
        "id": "gpt-5.3-codex-low"
      },
      {
        "id": "gpt-5.2-high"
      },
      {
        "id": "gpt-5.2-medium"
      },
      {
        "id": "gpt-5.2-low"
      },
      {
        "id": "gemini-3.1-pro-high"
      },
      {
        "id": "gemini-3.1-pro-low"
      }
    ],
    "alias": "dv",
    "aliases": [
      "devin"
    ]
  },
  {
    "id": "edge-tts",
    "display": {
      "name": "Edge TTS",
      "color": "#0078D4"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "edge-tts"
    },
    "models": [],
    "alias": "edge-tts"
  },
  {
    "id": "elevenlabs",
    "display": {
      "name": "ElevenLabs",
      "color": "#6C47FF"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.elevenlabs.io/v1/text-to-speech"
    },
    "models": [
      {
        "id": "eleven_multilingual_v2"
      },
      {
        "id": "eleven_turbo_v2_5"
      }
    ],
    "alias": "el"
  },
  {
    "id": "exa",
    "display": {
      "name": "Exa",
      "color": "#2563EB"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.exa.ai/search"
    },
    "models": [],
    "alias": "exa"
  },
  {
    "id": "fal-ai",
    "display": {
      "name": "Fal.ai",
      "color": "#2563EB"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://queue.fal.run"
    },
    "models": [
      {
        "id": "fal-ai/flux/schnell"
      }
    ],
    "alias": "fal-ai",
    "aliases": [
      "fal"
    ]
  },
  {
    "id": "featherless",
    "display": {
      "name": "Featherless",
      "color": "#111827"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.featherless.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "deepseek-ai/DeepSeek-V4-Pro"
      },
      {
        "id": "deepseek-ai/DeepSeek-V4-Flash"
      },
      {
        "id": "zai-org/GLM-5.2"
      },
      {
        "id": "zai-org/GLM-5.1"
      },
      {
        "id": "moonshotai/Kimi-K2.7-Code"
      },
      {
        "id": "moonshotai/Kimi-K2.6"
      },
      {
        "id": "moonshotai/Kimi-K2.5"
      }
    ],
    "alias": "featherless",
    "aliases": [
      "fl"
    ]
  },
  {
    "id": "firecrawl",
    "display": {
      "name": "Firecrawl",
      "color": "#F59E0B"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.firecrawl.dev/v1/scrape"
    },
    "models": [],
    "alias": "firecrawl"
  },
  {
    "id": "fireworks",
    "display": {
      "name": "Fireworks AI",
      "color": "#7B2EF2"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.fireworks.ai/inference/v1/chat/completions"
    },
    "models": [
      {
        "id": "accounts/fireworks/models/deepseek-v3p1"
      },
      {
        "id": "accounts/fireworks/models/llama-v3p3-70b-instruct"
      },
      {
        "id": "accounts/fireworks/models/qwen3-235b-a22b"
      },
      {
        "id": "nomic-ai/nomic-embed-text-v1.5"
      }
    ],
    "alias": "fireworks"
  },
  {
    "id": "fish-audio",
    "display": {
      "name": "Fish Audio",
      "color": "#1E9BF0"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.fish.audio/v1/tts"
    },
    "models": [
      {
        "id": "s2.1-pro-free"
      },
      {
        "id": "s2.1-pro"
      },
      {
        "id": "s2-pro"
      },
      {
        "id": "s1"
      }
    ],
    "alias": "fish"
  },
  {
    "id": "gemini-cli",
    "display": {
      "name": "Gemini CLI",
      "color": "#4285F4"
    },
    "category": "free",
    "transport": {
      "baseUrl": "https://cloudcode-pa.googleapis.com/v1internal"
    },
    "models": [
      {
        "id": "gemini-3.1-pro-preview"
      },
      {
        "id": "gemini-3-pro-preview"
      },
      {
        "id": "gemini-3-flash-preview"
      },
      {
        "id": "gemini-3.1-flash-lite-preview"
      },
      {
        "id": "gemini-2.5-pro"
      },
      {
        "id": "gemini-2.5-flash"
      },
      {
        "id": "gemini-2.5-flash-lite"
      }
    ],
    "alias": "gc"
  },
  {
    "id": "gemini",
    "display": {
      "name": "Gemini",
      "color": "#4285F4"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://generativelanguage.googleapis.com/v1beta/models"
    },
    "models": [
      {
        "id": "gemini-3.8-flash"
      },
      {
        "id": "gemini-3.7-flash"
      },
      {
        "id": "gemini-3.6-flash"
      },
      {
        "id": "gemini-3.5-flash-lite"
      },
      {
        "id": "gemini-3.1-pro-preview"
      },
      {
        "id": "gemini-3.1-flash-lite-preview"
      },
      {
        "id": "gemini-3-flash-preview"
      },
      {
        "id": "gemini-2.5-pro"
      },
      {
        "id": "gemini-2.5-flash"
      },
      {
        "id": "gemini-2.5-flash-lite"
      },
      {
        "id": "gemma-4-31b-it"
      },
      {
        "id": "gemini-embedding-2-preview"
      },
      {
        "id": "gemini-embedding-001"
      },
      {
        "id": "text-embedding-005"
      },
      {
        "id": "text-embedding-004"
      },
      {
        "id": "gemini-3.1-flash-image-preview"
      }
    ],
    "alias": "gemini"
  },
  {
    "id": "github",
    "display": {
      "name": "GitHub Copilot",
      "color": "#333333"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.githubcopilot.com/chat/completions"
    },
    "models": [
      {
        "id": "gpt-5.2"
      },
      {
        "id": "gpt-5.2-codex"
      },
      {
        "id": "gpt-5.3-codex"
      },
      {
        "id": "gpt-5.4"
      },
      {
        "id": "gpt-5.4-mini"
      },
      {
        "id": "claude-haiku-4.5"
      },
      {
        "id": "claude-opus-4.5"
      },
      {
        "id": "claude-sonnet-4.5"
      },
      {
        "id": "claude-sonnet-4.6"
      },
      {
        "id": "claude-opus-4.6"
      },
      {
        "id": "claude-opus-4.7"
      },
      {
        "id": "gemini-2.5-pro"
      },
      {
        "id": "gemini-3-flash-preview"
      },
      {
        "id": "gemini-3.1-pro-preview"
      },
      {
        "id": "grok-code-fast-1"
      },
      {
        "id": "oswe-vscode-prime"
      },
      {
        "id": "goldeneye-free-auto"
      },
      {
        "id": "text-embedding-3-small"
      },
      {
        "id": "text-embedding-3-large"
      }
    ],
    "alias": "gh"
  },
  {
    "id": "gitlab",
    "display": {
      "name": "GitLab Duo",
      "color": "#FC6D26"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://gitlab.com/api/v4/chat/completions"
    },
    "models": []
  },
  {
    "id": "glm-cn",
    "display": {
      "name": "GLM (China)",
      "color": "#DC2626"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions"
    },
    "models": [
      {
        "id": "glm-5.3"
      },
      {
        "id": "glm-5.3-flash"
      },
      {
        "id": "glm-5.2"
      },
      {
        "id": "glm-5.1"
      },
      {
        "id": "glm-5-turbo"
      },
      {
        "id": "glm-5"
      },
      {
        "id": "glm-4.7"
      },
      {
        "id": "glm-4.6v"
      },
      {
        "id": "glm-4.6"
      },
      {
        "id": "glm-4.5-air"
      }
    ],
    "alias": "glm-cn"
  },
  {
    "id": "glm",
    "display": {
      "name": "GLM Coding",
      "color": "#2563EB"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.z.ai/api/anthropic/v1/messages"
    },
    "models": [
      {
        "id": "glm-5.3"
      },
      {
        "id": "glm-5.3-flash"
      },
      {
        "id": "glm-5.2"
      },
      {
        "id": "glm-5.1"
      },
      {
        "id": "glm-5-turbo"
      },
      {
        "id": "glm-5"
      },
      {
        "id": "glm-4.7"
      },
      {
        "id": "glm-4.6v"
      }
    ],
    "alias": "glm"
  },
  {
    "id": "google-pse",
    "display": {
      "name": "Google PSE",
      "color": "#4285F4"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://www.googleapis.com/customsearch/v1"
    },
    "models": [],
    "alias": "gpse"
  },
  {
    "id": "google-tts",
    "display": {
      "name": "Google TTS",
      "color": "#4285F4"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "google-tts"
    },
    "models": [],
    "alias": "google-tts"
  },
  {
    "id": "grok-cli",
    "display": {
      "name": "Grok CLI (Grok Build)",
      "color": "#1DA1F2"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://cli-chat-proxy.grok.com/v1/responses"
    },
    "models": [
      {
        "id": "grok-4.5"
      },
      {
        "id": "grok-4.5-high"
      },
      {
        "id": "grok-4.5-medium"
      },
      {
        "id": "grok-4.5-low"
      }
    ],
    "alias": "gcli",
    "aliases": [
      "grok-build",
      "gb"
    ]
  },
  {
    "id": "grok-web",
    "display": {
      "name": "Grok Web (Subscription)",
      "color": "#1DA1F2"
    },
    "category": "webCookie",
    "transport": {
      "baseUrl": "https://grok.com/rest/app-chat/conversations/new"
    },
    "models": [
      {
        "id": "grok-3"
      },
      {
        "id": "grok-3-mini"
      },
      {
        "id": "grok-3-thinking"
      },
      {
        "id": "grok-4"
      },
      {
        "id": "grok-4-mini"
      },
      {
        "id": "grok-4-thinking"
      },
      {
        "id": "grok-4-heavy"
      },
      {
        "id": "grok-4.1-mini"
      },
      {
        "id": "grok-4.1-fast"
      },
      {
        "id": "grok-4.1-expert"
      },
      {
        "id": "grok-4.1-thinking"
      },
      {
        "id": "grok-4.2"
      }
    ],
    "alias": "grok-web",
    "aliases": [
      "gw"
    ]
  },
  {
    "id": "groq",
    "display": {
      "name": "Groq",
      "color": "#F55036"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.groq.com/openai/v1/chat/completions"
    },
    "models": [
      {
        "id": "llama-3.3-70b-versatile"
      },
      {
        "id": "meta-llama/llama-4-maverick-17b-128e-instruct"
      },
      {
        "id": "qwen/qwen3-32b"
      },
      {
        "id": "openai/gpt-oss-120b"
      },
      {
        "id": "whisper-large-v3"
      }
    ],
    "alias": "groq"
  },
  {
    "id": "huggingface",
    "display": {
      "name": "HuggingFace",
      "color": "#FFD21E"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api-inference.huggingface.co/models"
    },
    "models": [
      {
        "id": "black-forest-labs/FLUX.1-schnell"
      }
    ],
    "alias": "huggingface",
    "aliases": [
      "hf"
    ]
  },
  {
    "id": "hyperbolic",
    "display": {
      "name": "Hyperbolic",
      "color": "#00D4FF"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.hyperbolic.xyz/v1/chat/completions"
    },
    "models": [
      {
        "id": "Qwen/QwQ-32B"
      },
      {
        "id": "deepseek-ai/DeepSeek-R1"
      },
      {
        "id": "deepseek-ai/DeepSeek-V3"
      },
      {
        "id": "meta-llama/Llama-3.3-70B-Instruct"
      },
      {
        "id": "meta-llama/Llama-3.2-3B-Instruct"
      },
      {
        "id": "Qwen/Qwen2.5-72B-Instruct"
      },
      {
        "id": "Qwen/Qwen2.5-Coder-32B-Instruct"
      },
      {
        "id": "NousResearch/Hermes-3-Llama-3.1-70B"
      }
    ],
    "alias": "hyperbolic",
    "aliases": [
      "hyp"
    ]
  },
  {
    "id": "iflow",
    "display": {
      "name": "iFlow AI",
      "color": "#6366F1"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://apis.iflow.cn/v1/chat/completions"
    },
    "models": [
      {
        "id": "qwen3-coder-plus"
      },
      {
        "id": "qwen3-max"
      },
      {
        "id": "qwen3-vl-plus"
      },
      {
        "id": "qwen3-max-preview"
      },
      {
        "id": "qwen3-235b"
      },
      {
        "id": "qwen3-235b-a22b-instruct"
      },
      {
        "id": "qwen3-235b-a22b-thinking-2507"
      },
      {
        "id": "qwen3-32b"
      },
      {
        "id": "kimi-k2"
      },
      {
        "id": "deepseek-v3.2"
      },
      {
        "id": "deepseek-v3.1"
      },
      {
        "id": "deepseek-v3"
      },
      {
        "id": "deepseek-r1"
      },
      {
        "id": "glm-4.7"
      },
      {
        "id": "iflow-rome-30ba3b"
      }
    ],
    "alias": "if"
  },
  {
    "id": "inworld",
    "display": {
      "name": "Inworld TTS",
      "color": "#FF6B6B"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.inworld.ai/tts/v1/voice"
    },
    "models": [
      {
        "id": "inworld-tts-1.5-mini"
      },
      {
        "id": "inworld-tts-1.5-max"
      }
    ],
    "alias": "inworld"
  },
  {
    "id": "jina-ai",
    "display": {
      "name": "Jina AI",
      "color": "#2563EB"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.jina.ai/v1/embeddings"
    },
    "models": [
      {
        "id": "jina-embeddings-v3"
      },
      {
        "id": "jina-embeddings-v2-base-en"
      },
      {
        "id": "jina-embeddings-v2-base-code"
      }
    ],
    "alias": "jina"
  },
  {
    "id": "jina-reader",
    "display": {
      "name": "Jina Reader",
      "color": "#000000"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://r.jina.ai"
    },
    "models": [],
    "alias": "jina-reader"
  },
  {
    "id": "kilo-gateway",
    "display": {
      "name": "Kilo Gateway",
      "color": "#8B5CF6"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://api.kilo.ai/api/gateway/chat/completions"
    },
    "models": [
      {
        "id": "kilo-auto/free"
      },
      {
        "id": "nvidia/nemotron-3-super-120b-a12b:free"
      },
      {
        "id": "nvidia/nemotron-3-ultra-550b-a55b:free"
      },
      {
        "id": "kwaipilot/kat-coder-pro-v2.5:free"
      },
      {
        "id": "kilo-auto/frontier"
      },
      {
        "id": "kilo-auto/balanced"
      }
    ],
    "alias": "kgw",
    "aliases": [
      "kilo-gateway",
      "kilogateway"
    ]
  },
  {
    "id": "kilocode",
    "display": {
      "name": "Kilo Code",
      "color": "#FF6B35"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.kilo.ai/api/openrouter/chat/completions"
    },
    "models": [
      {
        "id": "anthropic/claude-sonnet-4-20250514"
      },
      {
        "id": "anthropic/claude-opus-4-20250514"
      },
      {
        "id": "google/gemini-2.5-pro"
      },
      {
        "id": "google/gemini-2.5-flash"
      },
      {
        "id": "openai/gpt-4.1"
      },
      {
        "id": "openai/o3"
      },
      {
        "id": "deepseek/deepseek-chat"
      },
      {
        "id": "deepseek/deepseek-reasoner"
      }
    ],
    "alias": "kc"
  },
  {
    "id": "kimchi",
    "display": {
      "name": "Kimchi",
      "color": "#FF521D"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://llm.kimchi.dev/openai/v1/chat/completions"
    },
    "models": [
      {
        "id": "minimax-m3"
      },
      {
        "id": "kimi-k2.7"
      },
      {
        "id": "kimi-k2.6"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "nemotron-3-ultra-fp4"
      },
      {
        "id": "minimax-m2.7"
      },
      {
        "id": "claude-opus-4-6"
      },
      {
        "id": "claude-sonnet-4-6"
      }
    ],
    "alias": "kimchi"
  },
  {
    "id": "kimi",
    "display": {
      "name": "Kimi",
      "color": "#1E3A8A"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.kimi.com/coding/v1/messages"
    },
    "models": [
      {
        "id": "kimi-k3"
      },
      {
        "id": "k3"
      },
      {
        "id": "kimi-for-coding"
      },
      {
        "id": "kimi-for-coding-highspeed"
      },
      {
        "id": "kimi-k2.7-code"
      },
      {
        "id": "kimi-k2.7-code-highspeed"
      },
      {
        "id": "kimi-k2.6"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "kimi-k2.5-thinking"
      },
      {
        "id": "kimi-latest"
      }
    ],
    "alias": "kimi",
    "aliases": [
      "kimi-coding",
      "kmc"
    ]
  },
  {
    "id": "kiro",
    "display": {
      "name": "Kiro AI",
      "color": "#FF6B35"
    },
    "category": "free",
    "transport": {
      "baseUrl": "https://runtime.us-east-1.kiro.dev/generateAssistantResponse"
    },
    "models": [
      {
        "id": "claude-opus-5"
      },
      {
        "id": "claude-opus-5-thinking"
      },
      {
        "id": "claude-opus-5-agentic"
      },
      {
        "id": "claude-opus-5-thinking-agentic"
      },
      {
        "id": "claude-opus-4.8"
      },
      {
        "id": "claude-opus-4.8-thinking"
      },
      {
        "id": "claude-opus-4.8-agentic"
      },
      {
        "id": "claude-opus-4.8-thinking-agentic"
      },
      {
        "id": "claude-opus-4.7"
      },
      {
        "id": "claude-opus-4.7-thinking"
      },
      {
        "id": "claude-opus-4.7-agentic"
      },
      {
        "id": "claude-opus-4.7-thinking-agentic"
      },
      {
        "id": "claude-opus-4.5"
      },
      {
        "id": "claude-opus-4.5-thinking"
      },
      {
        "id": "claude-opus-4.5-agentic"
      },
      {
        "id": "claude-opus-4.5-thinking-agentic"
      },
      {
        "id": "claude-sonnet-5"
      },
      {
        "id": "claude-sonnet-4.5"
      },
      {
        "id": "claude-haiku-4.5"
      },
      {
        "id": "deepseek-3.2"
      }
    ],
    "alias": "kr"
  },
  {
    "id": "linkup",
    "display": {
      "name": "Linkup",
      "color": "#0EA5E9"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.linkup.so/v1/search"
    },
    "models": [],
    "alias": "linkup"
  },
  {
    "id": "llm7",
    "display": {
      "name": "LLM7",
      "color": "#7C3AED"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.llm7.io/v1/chat/completions"
    },
    "models": [
      {
        "id": "gpt-5.5"
      },
      {
        "id": "claude-opus-5"
      },
      {
        "id": "deepseek-v4-flash"
      },
      {
        "id": "grok-4.5"
      },
      {
        "id": "kimi-k3"
      }
    ],
    "alias": "llm7",
    "aliases": [
      "llm-7"
    ]
  },
  {
    "id": "local-device",
    "display": {
      "name": "Local Device",
      "color": "#64748B"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "local-device"
    },
    "models": [],
    "alias": "local-device"
  },
  {
    "id": "mimo-free",
    "display": {
      "name": "MiMo Code Free",
      "color": "#FF6900"
    },
    "category": "free",
    "transport": {
      "baseUrl": "https://api.xiaomimimo.com/api/free-ai/openai/chat"
    },
    "models": [
      {
        "id": "mimo-auto"
      }
    ],
    "alias": "mmf"
  },
  {
    "id": "minimax-cn",
    "display": {
      "name": "Minimax (China)",
      "color": "#DC2626"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.minimaxi.com/anthropic/v1/messages"
    },
    "models": [
      {
        "id": "MiniMax-M3"
      },
      {
        "id": "MiniMax-M2.7"
      },
      {
        "id": "MiniMax-M2.5"
      },
      {
        "id": "MiniMax-M2.1"
      },
      {
        "id": "speech-2.8-hd"
      },
      {
        "id": "speech-2.8-turbo"
      },
      {
        "id": "speech-2.6-hd"
      },
      {
        "id": "speech-2.6-turbo"
      },
      {
        "id": "speech-02-hd"
      },
      {
        "id": "speech-02-turbo"
      },
      {
        "id": "speech-01-hd"
      },
      {
        "id": "speech-01-turbo"
      }
    ],
    "alias": "minimax-cn"
  },
  {
    "id": "minimax",
    "display": {
      "name": "Minimax Coding",
      "color": "#7C3AED"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.minimax.io/anthropic/v1/messages"
    },
    "models": [
      {
        "id": "MiniMax-M3"
      },
      {
        "id": "MiniMax-M2.7"
      },
      {
        "id": "MiniMax-M2.5"
      },
      {
        "id": "MiniMax-M2.1"
      },
      {
        "id": "minimax-image-01"
      }
    ],
    "alias": "minimax"
  },
  {
    "id": "mistral",
    "display": {
      "name": "Mistral",
      "color": "#FF7000"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.mistral.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "mistral-large-latest"
      },
      {
        "id": "codestral-latest"
      },
      {
        "id": "mistral-medium-latest"
      },
      {
        "id": "mistral-embed"
      }
    ],
    "alias": "mistral"
  },
  {
    "id": "mmf",
    "display": {
      "name": "MMF",
      "color": "#6366F1"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.xiaomimimo.com/api/free-ai/openai/chat"
    },
    "models": [
      {
        "id": "mimo-auto"
      }
    ]
  },
  {
    "id": "morph",
    "display": {
      "name": "Morph",
      "color": "#14B8A6"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.morphllm.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "morph-v3-large"
      },
      {
        "id": "morph-v3-fast"
      },
      {
        "id": "morph-qwen35-397b"
      },
      {
        "id": "morph-minimax27-230b"
      },
      {
        "id": "morph-qwen36-27b"
      },
      {
        "id": "morph-dsv4flash"
      }
    ],
    "alias": "morph",
    "aliases": [
      "morphllm"
    ]
  },
  {
    "id": "nanobanana",
    "display": {
      "name": "NanoBanana API",
      "color": "#FFD700"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.nanobananaapi.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "nanobanana-flash"
      }
    ],
    "alias": "nanobanana",
    "aliases": [
      "nb"
    ]
  },
  {
    "id": "nebius",
    "display": {
      "name": "Nebius AI",
      "color": "#6C5CE7"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.studio.nebius.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "meta-llama/Llama-3.3-70B-Instruct"
      },
      {
        "id": "Qwen/Qwen3-Embedding-8B"
      }
    ],
    "alias": "nebius"
  },
  {
    "id": "nvidia",
    "display": {
      "name": "NVIDIA NIM",
      "color": "#76B900"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://integrate.api.nvidia.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "minimaxai/minimax-m2.7"
      },
      {
        "id": "minimaxai/minimax-m3"
      },
      {
        "id": "z-ai/glm-5.2"
      },
      {
        "id": "deepseek-ai/deepseek-v4-pro"
      },
      {
        "id": "deepseek-ai/deepseek-v4-flash"
      },
      {
        "id": "moonshotai/kimi-k2.6"
      },
      {
        "id": "nvidia/nemotron-3-ultra-550b-a55b"
      },
      {
        "id": "nvidia/nv-embedqa-e5-v5"
      },
      {
        "id": "nvidia/parakeet-ctc-1.1b-asr"
      }
    ],
    "alias": "nvidia"
  },
  {
    "id": "ollama-local",
    "display": {
      "name": "Ollama Local",
      "color": "#ffffffff"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "http://localhost:11434/api/chat"
    },
    "models": [],
    "alias": "ollama-local"
  },
  {
    "id": "ollama-search",
    "display": {
      "name": "Ollama Search",
      "color": "#ffffff"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://ollama.com/api/web_search"
    },
    "models": [],
    "alias": "ollama-search"
  },
  {
    "id": "ollama",
    "display": {
      "name": "Ollama Cloud",
      "color": "#ffffffff"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://ollama.com/api/chat"
    },
    "models": [
      {
        "id": "gpt-oss:120b"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "glm-5"
      },
      {
        "id": "minimax-m2.5"
      },
      {
        "id": "glm-4.7-flash"
      },
      {
        "id": "qwen3.5"
      },
      {
        "id": "minimax-m3"
      }
    ],
    "alias": "ollama"
  },
  {
    "id": "openai",
    "display": {
      "name": "OpenAI",
      "color": "#10A37F"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.openai.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "gpt-5.4"
      },
      {
        "id": "gpt-5.4-mini"
      },
      {
        "id": "gpt-5.4-nano"
      },
      {
        "id": "gpt-5.2"
      },
      {
        "id": "gpt-5.1"
      },
      {
        "id": "gpt-5"
      },
      {
        "id": "gpt-5-mini"
      },
      {
        "id": "gpt-5-nano"
      },
      {
        "id": "gpt-4o"
      },
      {
        "id": "gpt-4o-mini"
      },
      {
        "id": "gpt-4-turbo"
      },
      {
        "id": "gpt-4.1"
      },
      {
        "id": "gpt-4.1-mini"
      },
      {
        "id": "gpt-4.1-nano"
      },
      {
        "id": "o3"
      },
      {
        "id": "o3-mini"
      },
      {
        "id": "o3-pro"
      },
      {
        "id": "o4-mini"
      },
      {
        "id": "o1"
      },
      {
        "id": "o1-mini"
      },
      {
        "id": "text-embedding-3-large"
      },
      {
        "id": "text-embedding-3-small"
      },
      {
        "id": "text-embedding-ada-002"
      },
      {
        "id": "tts-1"
      },
      {
        "id": "tts-1-hd"
      },
      {
        "id": "gpt-4o-mini-tts"
      },
      {
        "id": "whisper-1"
      }
    ],
    "alias": "openai"
  },
  {
    "id": "opencode-go",
    "display": {
      "name": "OpenCode Go",
      "color": "#E87040"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://opencode.ai/zen/go/v1/chat/completions"
    },
    "models": [
      {
        "id": "deepseek-flash"
      }
    ],
    "alias": "opencode-go",
    "aliases": [
      "ocg"
    ]
  },
  {
    "id": "opencode",
    "display": {
      "name": "OpenCode Free",
      "color": "#E87040"
    },
    "category": "free",
    "transport": {
      "baseUrl": "https://opencode.ai"
    },
    "models": [
      {
        "id": "muse-spark-1.2-contributor-free"
      },
      {
        "id": "muse-spark-1.3-contributor-free"
      }
    ],
    "alias": "oc"
  },
  {
    "id": "openrouter",
    "display": {
      "name": "OpenRouter",
      "color": "#F97316"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://openrouter.ai/api/v1/chat/completions"
    },
    "models": [
      {
        "id": "openai/text-embedding-3-large"
      },
      {
        "id": "openai/text-embedding-3-small"
      },
      {
        "id": "openai/text-embedding-ada-002"
      },
      {
        "id": "qwen/qwen3-embedding-8b"
      },
      {
        "id": "perplexity/pplx-embed-v1-4b"
      },
      {
        "id": "perplexity/pplx-embed-v1-0.6b"
      },
      {
        "id": "nvidia/llama-nemotron-embed-vl-1b-v2:free"
      },
      {
        "id": "openai/gpt-4o-mini-tts"
      },
      {
        "id": "openai/tts-1-hd"
      },
      {
        "id": "openai/tts-1"
      },
      {
        "id": "openai/dall-e-3"
      }
    ],
    "alias": "openrouter"
  },
  {
    "id": "perplexity-agent",
    "display": {
      "name": "Perplexity Agent",
      "color": "#20808D"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.perplexity.ai/v1/responses"
    },
    "models": [
      {
        "id": "perplexity/sonar"
      },
      {
        "id": "openai/gpt-5.5"
      },
      {
        "id": "openai/gpt-5.4"
      },
      {
        "id": "openai/gpt-5.4-mini"
      },
      {
        "id": "anthropic/claude-sonnet-4-6"
      },
      {
        "id": "anthropic/claude-opus-4-8"
      },
      {
        "id": "google/gemini-3.1-pro-preview"
      },
      {
        "id": "xai/grok-4.20-reasoning"
      },
      {
        "id": "perplexity/glm-5.2"
      },
      {
        "id": "perplexity/kimi-k2.7-code"
      },
      {
        "id": "nvidia/nemotron-3-super-120b-a12b"
      }
    ],
    "alias": "perplexity-agent",
    "aliases": [
      "pplx-agent",
      "pplx-responses"
    ]
  },
  {
    "id": "perplexity-web",
    "display": {
      "name": "Perplexity Web (Pro/Max)",
      "color": "#20808D"
    },
    "category": "webCookie",
    "transport": {
      "baseUrl": "https://www.perplexity.ai/rest/sse/perplexity_ask"
    },
    "models": [
      {
        "id": "pplx-auto"
      },
      {
        "id": "pplx-sonar"
      },
      {
        "id": "pplx-gpt"
      },
      {
        "id": "pplx-gemini"
      },
      {
        "id": "pplx-sonnet"
      },
      {
        "id": "pplx-opus"
      },
      {
        "id": "pplx-nemotron"
      }
    ],
    "alias": "perplexity-web",
    "aliases": [
      "pw"
    ]
  },
  {
    "id": "perplexity",
    "display": {
      "name": "Perplexity",
      "color": "#20808D"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.perplexity.ai/chat/completions"
    },
    "models": [
      {
        "id": "sonar-pro"
      },
      {
        "id": "sonar"
      }
    ],
    "alias": "perplexity",
    "aliases": [
      "pplx"
    ]
  },
  {
    "id": "playht",
    "display": {
      "name": "PlayHT",
      "color": "#00B4D8"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.play.ht/api/v2/tts/stream"
    },
    "models": [
      {
        "id": "PlayDialog"
      },
      {
        "id": "Play3.0-mini"
      }
    ],
    "alias": "playht"
  },
  {
    "id": "poolside",
    "display": {
      "name": "Poolside",
      "color": "#0EA5E9"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://inference.poolside.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "poolside/laguna-s-2.1"
      },
      {
        "id": "poolside/laguna-xs-2.1"
      }
    ],
    "alias": "poolside",
    "aliases": [
      "ps"
    ]
  },
  {
    "id": "qoder",
    "display": {
      "name": "Qoder",
      "color": "#EC4899"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api3.qoder.sh/algo/api/v2/service/pro/sse/agent_chat_generation"
    },
    "models": [
      {
        "id": "ultimate"
      },
      {
        "id": "auto"
      },
      {
        "id": "performance"
      },
      {
        "id": "efficient"
      },
      {
        "id": "lite"
      },
      {
        "id": "qmodel_38max"
      },
      {
        "id": "qmodel_latest"
      },
      {
        "id": "qmodel"
      },
      {
        "id": "qfmodel"
      },
      {
        "id": "kmodel_latest"
      },
      {
        "id": "kmodel"
      },
      {
        "id": "gmodel"
      },
      {
        "id": "gfmodel"
      },
      {
        "id": "dmodel"
      },
      {
        "id": "dfmodel"
      },
      {
        "id": "mmodel"
      }
    ],
    "alias": "qd"
  },
  {
    "id": "recraft",
    "display": {
      "name": "Recraft",
      "color": "#EC4899"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://external.api.recraft.ai/v1/images/generations"
    },
    "models": [
      {
        "id": "recraftv3"
      }
    ],
    "alias": "recraft"
  },
  {
    "id": "runwayml",
    "display": {
      "name": "Runway ML",
      "color": "#000000"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.dev.runwayml.com/v1"
    },
    "models": [
      {
        "id": "gen4_image"
      }
    ],
    "alias": "runwayml",
    "aliases": [
      "runway"
    ]
  },
  {
    "id": "sambanova",
    "display": {
      "name": "SambaNova",
      "color": "#F97316"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.sambanova.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "MiniMax-M2.7"
      }
    ],
    "alias": "samba",
    "aliases": [
      "sambanova-ai"
    ]
  },
  {
    "id": "sdwebui",
    "display": {
      "name": "SD WebUI",
      "color": "#FF7043"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "http://localhost:7860/sdapi/v1/txt2img"
    },
    "models": [
      {
        "id": "stable-diffusion-v1-5"
      }
    ],
    "alias": "sdwebui"
  },
  {
    "id": "searchapi",
    "display": {
      "name": "SearchAPI",
      "color": "#0EA5A4"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://www.searchapi.io/api/v1/search"
    },
    "models": [],
    "alias": "searchapi"
  },
  {
    "id": "searxng",
    "display": {
      "name": "SearXNG",
      "color": "#3B82F6"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": ""
    },
    "models": [],
    "alias": "searxng"
  },
  {
    "id": "selfhosted-embedding",
    "display": {
      "name": "Self-hosted Embedding",
      "color": "#ffffffff"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "http://localhost:8080/v1/embeddings"
    },
    "models": [
      {
        "id": "embedding"
      }
    ],
    "alias": "selfhosted-embedding"
  },
  {
    "id": "selfhosted-stt",
    "display": {
      "name": "Self-hosted STT",
      "color": "#ffffffff"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "http://localhost:8080/v1/audio/transcriptions"
    },
    "models": [
      {
        "id": "whisper-1"
      }
    ],
    "alias": "selfhosted-stt"
  },
  {
    "id": "selfhosted-tts",
    "display": {
      "name": "Self-hosted TTS",
      "color": "#ffffffff"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "http://localhost:8880"
    },
    "models": [
      {
        "id": "kokoro"
      }
    ],
    "alias": "selfhosted-tts"
  },
  {
    "id": "serper",
    "display": {
      "name": "Serper",
      "color": "#4F46E5"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://google.serper.dev"
    },
    "models": [],
    "alias": "serper"
  },
  {
    "id": "siliconflow",
    "display": {
      "name": "SiliconFlow",
      "color": "#5B6EF5"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.siliconflow.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "deepseek-ai/DeepSeek-V4-Pro"
      },
      {
        "id": "deepseek-ai/DeepSeek-V4-Flash"
      },
      {
        "id": "deepseek-ai/DeepSeek-V3.2"
      },
      {
        "id": "deepseek-ai/DeepSeek-V3.2-Exp"
      },
      {
        "id": "deepseek-ai/DeepSeek-V3.1"
      },
      {
        "id": "deepseek-ai/DeepSeek-V3.1-Terminus"
      },
      {
        "id": "deepseek-ai/DeepSeek-R1"
      },
      {
        "id": "Qwen/Qwen3.5-397B-A17B"
      },
      {
        "id": "Qwen/Qwen3.5-122B-A10B"
      },
      {
        "id": "zai-org/GLM-5.1"
      },
      {
        "id": "zai-org/GLM-5"
      },
      {
        "id": "moonshotai/Kimi-K2.6"
      },
      {
        "id": "moonshotai/Kimi-K2.5"
      },
      {
        "id": "openai/gpt-oss-120b"
      },
      {
        "id": "MiniMaxAI/MiniMax-M2.5"
      },
      {
        "id": "inclusionAI/Ling-flash-2.0"
      }
    ],
    "alias": "siliconflow"
  },
  {
    "id": "stability-ai",
    "display": {
      "name": "Stability AI",
      "color": "#8B5CF6"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.stability.ai/v2beta/stable-image/generate"
    },
    "models": [
      {
        "id": "stable-image-ultra"
      }
    ],
    "alias": "stability-ai",
    "aliases": [
      "stability"
    ]
  },
  {
    "id": "tavily",
    "display": {
      "name": "Tavily",
      "color": "#5B21B6"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.tavily.com/search"
    },
    "models": [],
    "alias": "tavily"
  },
  {
    "id": "tencent",
    "display": {
      "name": "Tencent Hunyuan",
      "color": "#0052D9"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.hunyuan.cloud.tencent.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "hunyuan-turbos-latest"
      },
      {
        "id": "hunyuan-t1-latest"
      }
    ],
    "alias": "hunyuan",
    "aliases": [
      "hunyuan",
      "tencent-hunyuan"
    ]
  },
  {
    "id": "together",
    "display": {
      "name": "Together AI",
      "color": "#0F6FFF"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.together.xyz/v1/chat/completions"
    },
    "models": [
      {
        "id": "meta-llama/Llama-3.3-70B-Instruct-Turbo"
      },
      {
        "id": "deepseek-ai/DeepSeek-R1"
      },
      {
        "id": "Qwen/Qwen3-235B-A22B"
      },
      {
        "id": "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
      },
      {
        "id": "BAAI/bge-large-en-v1.5"
      },
      {
        "id": "togethercomputer/m2-bert-80M-8k-retrieval"
      }
    ],
    "alias": "together"
  },
  {
    "id": "tokenrouter",
    "display": {
      "name": "TokenRouter",
      "color": "#0EA5E9"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.tokenrouter.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "anthropic/claude-haiku-4.5"
      },
      {
        "id": "anthropic/claude-sonnet-4.6"
      },
      {
        "id": "anthropic/claude-opus-4.8"
      },
      {
        "id": "anthropic/claude-opus-4.8-fast"
      },
      {
        "id": "openai/gpt-5.4"
      },
      {
        "id": "openai/gpt-5.4-mini"
      },
      {
        "id": "openai/gpt-5.4-pro"
      },
      {
        "id": "openai/gpt-5.5"
      },
      {
        "id": "openai/gpt-5.6-sol"
      },
      {
        "id": "google/gemini-3.5-flash"
      },
      {
        "id": "google/gemini-3.6-flash"
      },
      {
        "id": "deepseek/deepseek-v4-flash"
      },
      {
        "id": "deepseek/deepseek-v4-pro"
      },
      {
        "id": "qwen/qwen3-coder-next"
      },
      {
        "id": "qwen/qwen3.7-max"
      },
      {
        "id": "qwen/qwen3.8-max"
      },
      {
        "id": "moonshotai/kimi-k2.7-code"
      },
      {
        "id": "moonshotai/kimi-k3-free"
      },
      {
        "id": "z-ai/glm-5.3-free"
      },
      {
        "id": "z-ai/glm-5.2"
      },
      {
        "id": "z-ai/glm-5-turbo"
      },
      {
        "id": "x-ai/grok-4.5"
      }
    ],
    "alias": "tokenrouter",
    "aliases": [
      "tr"
    ]
  },
  {
    "id": "topaz",
    "display": {
      "name": "Topaz",
      "color": "#059669"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": ""
    },
    "models": [],
    "alias": "topaz"
  },
  {
    "id": "tortoise",
    "display": {
      "name": "Tortoise TTS",
      "color": "#7C3AED"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "http://localhost:5000/api/tts"
    },
    "models": [
      {
        "id": "tortoise-v2"
      }
    ],
    "alias": "tortoise"
  },
  {
    "id": "trae",
    "display": {
      "name": "Trae",
      "color": "#FF6A00"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://core-normal.trae.ai/api/remote/v1"
    },
    "models": [
      {
        "id": "auto"
      },
      {
        "id": "work"
      },
      {
        "id": "gemini-3.1-pro"
      },
      {
        "id": "gemini-3-flash-solo"
      },
      {
        "id": "minimax-m3"
      },
      {
        "id": "minimax-m2.7"
      },
      {
        "id": "kimi-k2.5"
      },
      {
        "id": "gpt-5.4"
      },
      {
        "id": "gpt-5.2"
      }
    ],
    "alias": "tr",
    "aliases": [
      "marscode"
    ]
  },
  {
    "id": "venice",
    "display": {
      "name": "Venice AI",
      "color": "#DC2626"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.venice.ai/api/v1/chat/completions"
    },
    "models": [
      {
        "id": "venice-uncensored-1-2"
      },
      {
        "id": "zai-org-glm-5"
      },
      {
        "id": "qwen3-235b-a22b-instruct-2507"
      },
      {
        "id": "qwen3-coder-480b-a35b-instruct-turbo"
      },
      {
        "id": "qwen3-vl-235b-a22b"
      },
      {
        "id": "deepseek-v4-pro"
      },
      {
        "id": "llama-3.3-70b"
      },
      {
        "id": "hermes-3-llama-3.1-405b"
      },
      {
        "id": "mistral-small-3-2-24b-instruct"
      },
      {
        "id": "text-embedding-3-large"
      },
      {
        "id": "text-embedding-bge-m3"
      },
      {
        "id": "text-embedding-qwen3-8b"
      },
      {
        "id": "venice-sd35"
      }
    ],
    "alias": "venice",
    "aliases": [
      "vn"
    ]
  },
  {
    "id": "vercel-ai-gateway",
    "display": {
      "name": "Vercel AI Gateway",
      "color": "#111827"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://ai-gateway.vercel.sh/v1/chat/completions"
    },
    "models": [],
    "alias": "vercel-ai-gateway",
    "aliases": [
      "vercel"
    ]
  },
  {
    "id": "vertex-partner",
    "display": {
      "name": "Vertex Partner",
      "color": "#34A853"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://aiplatform.googleapis.com"
    },
    "models": [
      {
        "id": "deepseek-ai/deepseek-v3.2-maas"
      },
      {
        "id": "qwen/qwen3-next-80b-a3b-thinking-maas"
      },
      {
        "id": "qwen/qwen3-next-80b-a3b-instruct-maas"
      },
      {
        "id": "zai-org/glm-5-maas"
      }
    ],
    "alias": "vertex-partner",
    "aliases": [
      "vxp"
    ]
  },
  {
    "id": "vertex",
    "display": {
      "name": "Vertex AI",
      "color": "#4285F4"
    },
    "category": "freeTier",
    "transport": {
      "baseUrl": "https://aiplatform.googleapis.com"
    },
    "models": [
      {
        "id": "gemini-3.1-pro-preview"
      },
      {
        "id": "gemini-3.1-flash-lite-preview"
      },
      {
        "id": "gemini-3-flash-preview"
      },
      {
        "id": "gemini-2.5-flash"
      },
      {
        "id": "veo-3.1-generate-preview"
      }
    ],
    "alias": "vertex",
    "aliases": [
      "vx"
    ]
  },
  {
    "id": "volcengine-ark",
    "display": {
      "name": "Volcengine Ark",
      "color": "#1677FF"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions"
    },
    "models": [
      {
        "id": "Doubao-Seed-2.0-Code"
      },
      {
        "id": "Doubao-Seed-2.0-pro"
      },
      {
        "id": "Doubao-Seed-2.0-lite"
      },
      {
        "id": "Doubao-Seed-Code"
      },
      {
        "id": "DeepSeek-V4-Flash"
      },
      {
        "id": "DeepSeek-V4-Pro"
      },
      {
        "id": "GLM-5.1"
      },
      {
        "id": "MiniMax-M2.7"
      },
      {
        "id": "Kimi-K2.6"
      }
    ],
    "alias": "volcengine-ark",
    "aliases": [
      "ark"
    ]
  },
  {
    "id": "voyage-ai",
    "display": {
      "name": "Voyage AI",
      "color": "#0EA5E9"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://api.voyageai.com/v1/embeddings"
    },
    "models": [
      {
        "id": "voyage-3-large"
      },
      {
        "id": "voyage-3.5"
      },
      {
        "id": "voyage-3.5-lite"
      },
      {
        "id": "voyage-code-3"
      },
      {
        "id": "voyage-finance-2"
      },
      {
        "id": "voyage-law-2"
      },
      {
        "id": "voyage-multilingual-2"
      }
    ],
    "alias": "voyage-ai"
  },
  {
    "id": "windsurf",
    "display": {
      "name": "Windsurf",
      "color": "#14B8A6"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://server.codeium.com/exa.language_server_pb.LanguageServerService/GetChatMessage"
    },
    "models": [
      {
        "id": "swe-1.6-fast"
      },
      {
        "id": "swe-1.6"
      },
      {
        "id": "swe-1.5-fast"
      },
      {
        "id": "swe-1.5"
      },
      {
        "id": "claude-opus-4.7-max"
      },
      {
        "id": "claude-opus-4.7-xhigh"
      },
      {
        "id": "claude-opus-4.7-high"
      },
      {
        "id": "claude-opus-4.7-medium"
      },
      {
        "id": "claude-opus-4.7-low"
      },
      {
        "id": "claude-opus-4.7-review"
      },
      {
        "id": "claude-sonnet-4.6-thinking-1m"
      },
      {
        "id": "claude-sonnet-4.6-1m"
      },
      {
        "id": "claude-sonnet-4.6-thinking"
      },
      {
        "id": "claude-sonnet-4.6"
      },
      {
        "id": "claude-opus-4.6-thinking"
      },
      {
        "id": "claude-opus-4.6"
      },
      {
        "id": "claude-opus-4.5-thinking"
      },
      {
        "id": "claude-opus-4.5"
      },
      {
        "id": "claude-sonnet-4.5-thinking"
      },
      {
        "id": "claude-sonnet-4.5"
      },
      {
        "id": "claude-haiku-4.5"
      },
      {
        "id": "gpt-5.5-xhigh-fast"
      },
      {
        "id": "gpt-5.5-xhigh"
      },
      {
        "id": "gpt-5.5-high-fast"
      },
      {
        "id": "gpt-5.5-high"
      },
      {
        "id": "gpt-5.5-medium-fast"
      },
      {
        "id": "gpt-5.5-medium"
      },
      {
        "id": "gpt-5.5-low-fast"
      },
      {
        "id": "gpt-5.5-low"
      },
      {
        "id": "gpt-5.5-none-fast"
      }
    ],
    "alias": "ws"
  },
  {
    "id": "xai",
    "display": {
      "name": "xAI (Grok)",
      "color": "#1DA1F2"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.x.ai/v1/chat/completions"
    },
    "models": [
      {
        "id": "grok-4.6"
      },
      {
        "id": "grok-4.5"
      },
      {
        "id": "grok-4"
      },
      {
        "id": "grok-4-fast-reasoning"
      },
      {
        "id": "grok-code-fast-1"
      },
      {
        "id": "grok-3"
      },
      {
        "id": "grok-2-image-1212"
      }
    ],
    "alias": "xai"
  },
  {
    "id": "xiaomi-mimo",
    "display": {
      "name": "Xiaomi MiMo",
      "color": "#FF6900"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://api.xiaomimimo.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "mimo-x-pro-preview"
      }
    ],
    "alias": "xiaomi-mimo",
    "aliases": [
      "mimo",
      "mimo-desktop",
      "xmd"
    ]
  },
  {
    "id": "xiaomi-tokenplan",
    "display": {
      "name": "Xiaomi MiMo (Token Plan)",
      "color": "#FF6700"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions"
    },
    "models": [
      {
        "id": "mimo-v2.5-pro"
      },
      {
        "id": "mimo-v2.5-pro-claude"
      },
      {
        "id": "mimo-v2.5"
      },
      {
        "id": "mimo-v2-pro"
      },
      {
        "id": "mimo-v2-omni"
      },
      {
        "id": "mimo-v2-tts"
      },
      {
        "id": "mimo-v2.5-tts"
      },
      {
        "id": "mimo-v2.5-tts-voiceclone"
      },
      {
        "id": "mimo-v2.5-tts-voicedesign"
      }
    ],
    "alias": "xiaomi-tokenplan",
    "aliases": [
      "xmtp"
    ]
  },
  {
    "id": "xquik",
    "display": {
      "name": "Xquik",
      "color": "#5C3327"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://xquik.com/api/v1/x/tweets/search"
    },
    "models": [],
    "alias": "xquik"
  },
  {
    "id": "youcom",
    "display": {
      "name": "You.com Search",
      "color": "#7C3AED"
    },
    "category": "apikey",
    "transport": {
      "baseUrl": "https://ydc-index.io/v1/search"
    },
    "models": [],
    "alias": "youcom"
  },
  {
    "id": "zed",
    "display": {
      "name": "Zed",
      "color": "#A855F7"
    },
    "category": "oauth",
    "transport": {
      "baseUrl": "https://cloud.zed.dev/completions"
    },
    "models": [],
    "alias": "zd"
  }
];

const ALIAS_TO_ID = {};
for (const e of REGISTRY) {
  ALIAS_TO_ID[e.id] = e.id;
  if (e.alias) ALIAS_TO_ID[e.alias] = e.id;
  for (const a of (e.aliases||[])) ALIAS_TO_ID[a]=e.id;
}
function resolveAlias(v){ return ALIAS_TO_ID[v] || v; }
const DEFAULT_COMBO_LIST = [
  { id:"auto", name:"Auto", kind:"llm", models:["openai/gpt-4o","anthropic/claude-sonnet-4-20250514","gemini/gemini-2.5-flash"] },
  { id:"reasoning", name:"Reasoning", kind:"llm", models:["openai/o3","claude/claude-sonnet-5","xai/grok-4"] },
  { id:"speed", name:"Speed", kind:"llm", models:["openai/gpt-4o-mini","gemini/gemini-2.5-flash","groq/llama-3.3-70b-versatile"] },
  { id:"code", name:"Code", kind:"llm", models:["anthropic/claude-sonnet-4-20250514","openai/gpt-5","deepseek/deepseek-reasoner"] },
];

// ---------------------------------------------------------------------------
// Simple persistent stores
function loadStore() {
  const connections = readJson(routerDataFile("connections.json"), []);
  const combos = readJson(routerDataFile("combos.json"), null);
  const apiKeys = readJson(routerDataFile("apiKeys.json"), []);
  const settings = readJson(routerDataFile("settings.json"), {});
  const aliasMap = readJson(routerDataFile("aliases.json"), {});
  const disabledModels = readJson(routerDataFile("disabled.json"), {});
  return {
    connections: Array.isArray(connections) ? connections : [],
    combos: combos === null ? [...DEFAULT_COMBO_LIST] : combos,
    apiKeys: Array.isArray(apiKeys) ? apiKeys : [],
    settings: (settings && typeof settings==="object")?settings:{},
    aliases: aliasMap||{},
    disabled: disabledModels||{},
  };
}
let STORE_CACHE = null;
function getStore(){ if(!STORE_CACHE) STORE_CACHE = loadStore(); return STORE_CACHE; }
function saveCombos(list){ STORE_CACHE.combos = list; writeJson(routerDataFile("combos.json"), list); queueAdapterRefresh(); queueDirectoryRefresh(); }
function saveConnections(list){ STORE_CACHE.connections = list; writeJson(routerDataFile("connections.json"), list); queueAdapterRefresh(); queueDirectoryRefresh(); }
function saveKeys(list){ STORE_CACHE.apiKeys=list; writeJson(routerDataFile("apiKeys.json"), list); }
function saveSettings(patch){ STORE_CACHE.settings = { ...STORE_CACHE.settings, ...patch }; writeJson(routerDataFile("settings.json"), STORE_CACHE.settings); }

// ---------------------------------------------------------------------------
// Adapter refresh wiring (re-emit for picker + harnessed streaming)
let adapterRegistration = null;
let directoryRegistration = null;
let pendingAdapterRefresh = null;
let pendingDirectoryRefresh = null;
function queueAdapterRefresh(){
  if(!adapterRegistration) return;
  // provider stays single "9router", but re-emit to refresh listModels
  try { ctxGlobal?.llm?.emitAdaptersUpdated?.(); } catch {}
}
function queueDirectoryRefresh(){
  if(!directoryRegistration) return;
  try {
    const entries = buildDirectoryEntries();
    directoryRegistration.replace(entries);
  } catch(e){ console.warn("[9router] directory refresh failed", e?.message); }
}
function buildDirectoryEntries(){
  const combos = getStore().combos;
  const entries = [{ provider:"9router", displayName:"9Router", settingsNs:"dsh-9router", settingsPath:[], declared:false }];
  // also declare each provider id as configurable so settings UI can show them (optional)
  for (const p of REGISTRY) entries.push({ provider:`9router-${p.id}`, displayName:`${p.display.name} (via 9Router)`, settingsNs:"dsh-9router", settingsPath:["providers", p.id], declared:true });
  return entries;
}

let ctxGlobal = null;

// ---------------------------------------------------------------------------
// Model helpers
function listAllModels() {
  const s = getStore();
  const out = [];
  // combos as models under 9router
  for (const c of s.combos) {
    if (s.disabled["9router"]?.includes(c.name) || s.disabled["9router"]?.includes(c.id)) continue;
    out.push({
      provider: "9router",
      id: c.name,
      name: c.name,
      description: `${c.kind||"llm"} • ${c.models.join(" → ")}`,
      inputModalities: ["text","image"],
    });
  }
  // provider models as "provider/model" ids under 9router as well
  for (const prov of REGISTRY) {
    const dis = s.disabled[prov.id] || [];
    for (const m of (prov.models||[])) {
      if (dis.includes(m.id)) continue;
      const qualified = `${prov.id}/${m.id}`;
      // avoid dup with combo names
      if (s.combos.some(c=>c.name===qualified)) continue;
      out.push({
        provider:"9router",
        id: qualified,
        name: `${prov.display.name} — ${m.id}`,
        description: prov.display.name,
        inputModalities: m.kind==="image" ? ["text"] : ["text","image"],
      });
    }
  }
  // also expose short ids for alias ergonomics (e.g., "auto" combo already covered)
  return out;
}
function resolveModelInfo(modelId){
  const all = listAllModels();
  const hit = all.find(m=>m.id===modelId);
  if(hit) {
    return {
      ...hit,
      context: { contextWindow: 131072 },
      defaultMaxTokens: 8192,
      reasoning: undefined,
    };
  }
  // fallback: treat any unknown as valid route to preserve harness principle (advisory catalog never rejects routing)
  // but provide metadata
  const slash = modelId.indexOf("/");
  if(slash>0){
    const prov = modelId.slice(0, slash);
    const mid = modelId.slice(slash+1);
    const reg = REGISTRY.find(r=>r.id===prov || r.alias===prov);
    return {
      provider:"9router",
      id: modelId,
      name: reg ? `${reg.display.name} — ${mid}` : modelId,
      description: reg?.display?.name||"",
      context:{ contextWindow: 128000 },
    };
  }
  return { provider:"9router", id:modelId, name:modelId, context:{contextWindow:128000} };
}

// ---------------------------------------------------------------------------
// Stream helpers — produce Harness StreamChunk from provider SSE
async function* sseToChunks(response, modelId){
  const reader = response.body?.getReader();
  if(!reader) { yield { type:"finish", reason:{kind:"error", failure:{message:"Empty response body", code:"EMPTY_RESPONSE"}}}; return; }
  const decoder = new TextDecoder();
  let buf = "";
  let hasContent = false;
  let blockIndex = 0;
  let pendingText = "";
  let sentBlockStart = false;
  function ensureStart(){
    if(!sentBlockStart){ sentBlockStart = true; return {type:"block-start", index:blockIndex, blockType:"text"}; }
    return null;
  }
  // usage holder
  let usage = null;
  try {
    while(true){
      const { done, value } = await reader.read();
      if(done) break;
      buf += decoder.decode(value, {stream:true});
      let lines = buf.split("\n");
      buf = lines.pop()||"";
      for(const raw of lines){
        const line = raw.trim();
        if(!line) continue;
        if(line.startsWith("data:")){
          const data = line.slice(5).trim();
          if(data==="[DONE]"){ continue; }
          let evt;
          try { evt = JSON.parse(data); } catch { continue; }
          // OpenAI chat completions
          if(evt.choices){
            for(const ch of evt.choices){
              const delta = ch.delta||{};
              if(delta.content){
                hasContent = true;
                const st = ensureStart();
                if(st) yield st;
                yield { type:"text-delta", index:blockIndex, text: delta.content };
                pendingText += delta.content;
              }
              if(delta.reasoning_content || delta.reasoning){
                const rc = delta.reasoning_content || delta.reasoning;
                const st2 = ensureStart();
                if(st2 && !sentBlockStart) {} // dedup
                // map reasoning as reasoning-delta if harness expects it; fallback to text
                yield { type:"reasoning-delta", index:blockIndex, text: String(rc) };
              }
              if(delta.tool_calls){
                for(const tc of delta.tool_calls){
                  yield { type:"tool-call-delta", index:blockIndex, id: tc.id||`call_${blockIndex}`, name: tc.function?.name, argumentsDelta: tc.function?.arguments||"" };
                }
              }
              if(ch.finish_reason){
                usage = evt.usage || usage;
              }
            }
          } else if(evt.usage){
            usage = evt.usage;
          } else if(evt.type==="content_block_delta" && evt.delta?.text){
            // Anthropic messages
            hasContent = true;
            const st = ensureStart(); if(st) yield st;
            yield { type:"text-delta", index:blockIndex, text: evt.delta.text };
            pendingText += evt.delta.text;
          } else if(evt.candidates){ // Gemini
            const part = evt.candidates?.[0]?.content?.parts?.[0]?.text;
            if(part){ hasContent=true; const st=ensureStart(); if(st) yield st; yield {type:"text-delta", index:blockIndex, text:part}; pendingText+=part; }
          }
        }
      }
    }
  } finally {
    try{ reader.releaseLock(); }catch{}
  }
  if(pendingText){
    yield { type:"block-end", index:blockIndex, block:{ type:"text", text: pendingText } };
  }
  if(!hasContent){
    yield { type:"finish", reason:{kind:"error", failure:{message:"Provider returned no content", code:"EMPTY_RESPONSE"}} };
    return;
  }
  if(usage){
    const u = {
      inputTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
      totalTokens: usage.total_tokens ?? undefined,
    };
    yield { type:"usage", usage: u };
  }
  yield { type:"finish", reason:{kind:"stop"} };
}

function toOpenAIBody(options, targetModel){
  const msgs = [];
  if(options.system) msgs.push({role:"system", content: options.system});
  for(const m of options.messages){
    // content blocks
    const texts = m.content.filter(b=>b.type==="text").map(b=>b.text).join("");
    const toolCalls = m.content.filter(b=>b.type==="tool-call").map(b=>({ id:b.id, type:"function", function:{ name:b.name, arguments:b.arguments}}));
    const toolResults = m.content.filter(b=>b.type==="tool-result");
    const reasoning = m.content.filter(b=>b.type==="reasoning").map(b=>b.text).join("");
    if(m.role==="assistant"){
      const base={ role:"assistant", content: texts };
      if(reasoning) base.reasoning_content = reasoning;
      if(toolCalls.length) base.tool_calls = toolCalls;
      msgs.push(base);
    } else if(m.role==="user"){
      if(toolResults.length){
        if(texts) msgs.push({role:"user", content:texts});
        for(const tr of toolResults){
          const t = tr.content.filter(b=>b.type==="text").map(b=>b.text).join("")||"(no output)";
          msgs.push({ role:"tool", tool_call_id: tr.toolCallId, content: t });
        }
      } else {
        // handle image blocks: DSH attachment image blocks need special handling; for now inline placeholder
        const hasImage = m.content.some(b=>b.type==="image");
        if(hasImage){
          const parts=[];
          for(const b of m.content){
            if(b.type==="text" && b.text) parts.push({type:"text", text:b.text});
            else if(b.type==="image") parts.push({type:"text", text:`[image:${b.attachment?.attachmentId||"image"}]`});
            else if(b.type==="tool-result") parts.push({type:"text", text: b.content.filter(x=>x.type==="text").map(x=>x.text).join("")});
          }
          msgs.push({ role:"user", content: parts });
        } else {
          msgs.push({ role:"user", content: texts || "" });
        }
      }
    } else if(m.role==="system"){
      msgs.push({ role:"system", content: texts });
    }
  }
  const body = {
    model: targetModel,
    messages: msgs,
    stream: true,
    stream_options:{ include_usage:true },
  };
  if(options.tools && options.tools.length) body.tools = options.tools.map(t=>({ type:"function", function:{ name:t.name, description:t.description, parameters:t.parameters }}));
  if(options.temperature!==undefined) body.temperature = options.temperature;
  if(options.maxTokens!==undefined) body.max_tokens = options.maxTokens;
  if(options.stop) body.stop = options.stop;
  if(options.reasoningEffort && options.reasoningEffort!=="off") body.reasoning_effort = options.reasoningEffort;
  return body;
}

function findConnectionForProvider(providerId){
  const s = getStore();
  // exact
  let candidates = s.connections.filter(c=>c.provider===providerId && c.isActive!==false);
  if(candidates.length===0){
    // alias resolve
    const resolved = resolveAlias(providerId);
    candidates = s.connections.filter(c=>c.provider===resolved && c.isActive!==false);
  }
  if(candidates.length===0) return null;
  candidates.sort((a,b)=>(a.priority||999)-(b.priority||999));
  // filter out rate-limited temp
  const now = Date.now();
  const avail = candidates.filter(c=>{
    if(c.rateLimitedUntil && new Date(c.rateLimitedUntil).getTime() > now) return false;
    return true;
  });
  return (avail[0] || candidates[0]);
}
function connectionToHeaders(conn, providerId){
  // Determine endpoint & auth
  const prov = REGISTRY.find(p=>p.id===providerId || p.alias===providerId);
  const data = conn;
  // providerSpecificData may hold apiKey, accessToken, baseUrl etc.
  const psd = data.providerSpecificData||{};
  const headers={};
  // API key in various fields
  const key = data.apiKey || data.accessToken || psd.apiKey || psd.accessToken || "";
  if(key){
    if(prov && prov.id==="anthropic"){
      headers["x-api-key"]=key;
      headers["anthropic-version"]="2023-06-01";
    } else if(prov && prov.id==="gemini"){
      // gemini uses ?key= query, not header
    } else {
      headers["Authorization"]=`Bearer ${key}`;
    }
  }
  // custom baseUrl/endpoint
  let baseUrl = data.baseUrl || psd.baseUrl || psd.endpoint || prov?.transport?.baseUrl;
  // interpolate azure placeholders
  if(baseUrl && baseUrl.includes("{endpoint}")){
    const ep = psd.endpoint || psd.baseUrl || "";
    try { baseUrl = baseUrl.replace("{endpoint}", new URL(ep).hostname.split(".")[0]); } catch {}
  }
  if(baseUrl && baseUrl.includes("{deployment}")){
    const dep = psd.deployment || psd.model || "gpt-4o";
    baseUrl = baseUrl.replace("{deployment}", dep);
  }
  return { headers, baseUrl, prov };
}
async function fetchWithFallback(models, makeBody, options, signal){
  let lastError = null;
  let lastStatus = 502;
  for(const qualified of models){
    const slash = qualified.indexOf("/");
    let provId, modelId;
    if(slash>0){ provId = qualified.slice(0, slash); modelId = qualified.slice(slash+1); }
    else { // bare model name -> infer provider from catalog
      provId = null; modelId = qualified;
      // find first provider that has this model
      for(const p of REGISTRY){ if(p.models?.some(m=>m.id===modelId)){ provId=p.id; break; } }
      provId = provId || "openai";
    }
    provId = resolveAlias(provId);
    const conn = findConnectionForProvider(provId);
    if(!conn){
      lastError = `No active credential for provider "${provId}" (add one in 9Router Providers)`;
      lastStatus = 401;
      continue;
    }
    const { headers, baseUrl, prov } = connectionToHeaders(conn, provId);
    let url = baseUrl;
    if(!url){
      lastError = `No endpoint for provider "${provId}"`;
      continue;
    }
    // gemini key in query
    if(provId==="gemini"){
      const key = conn.apiKey || conn.accessToken || (conn.providerSpecificData||{}).apiKey || "";
      if(key) url += (url.includes("?")?"&":"?") + `key=${encodeURIComponent(key)}`;
    }
    // Anthropic vs OpenAI request shape: anthropic needs /v1/messages with different body
    let bodyJs = makeBody(modelId);
    // For anthropic provider, translate messages minimal: keep system separate
    if(provId==="anthropic"){
      // body currently OpenAI shape; anthropic expects system + messages + max_tokens
      const sys = bodyJs.messages.find(m=>m.role==="system");
      const other = bodyJs.messages.filter(m=>m.role!=="system");
      bodyJs = { model: modelId, max_tokens: bodyJs.max_tokens||4096, system: sys?.content||undefined, messages: other, stream: true, tools: bodyJs.tools };
    }
    // attribution
    let attr={};
    try { attr = attributionHeaders(); } catch {}
    const hdrs = { "Content-Type":"application/json", ...headers, ...attr };
    if(conn.providerSpecificData?.headers) Object.assign(hdrs, conn.providerSpecificData.headers);
    try{
      const resp = await fetch(url, { method:"POST", headers: hdrs, body: JSON.stringify(bodyJs), signal });
      if(!resp.ok){
        const text = await resp.text().catch(()=>"");
        let parsed; try{ parsed=JSON.parse(text);}catch{}
        const msg = parsed?.error?.message || parsed?.message || text.slice(0,800) || `HTTP ${resp.status}`;
        // check retryable codes: 429/529 etc => try next
        const isRetryable = resp.status===429 || resp.status===502 || resp.status===503 || resp.status===529 || /rate|quota|overloaded|unavailable/i.test(msg);
        lastError = `[${provId}/${modelId}] ${msg}`;
        lastStatus = resp.status;
        if(provId==="antigravity" || provId==="gemini-cli"){
          // mark? not persisting for now
        }
        if(isRetryable) {
          // mark account unavailable briefly
          try {
            const s=getStore();
            const idx=s.connections.findIndex(x=>x.id===conn.id);
            if(idx>=0){
              s.connections[idx].rateLimitedUntil = new Date(Date.now()+ 60_000).toISOString();
              saveConnections(s.connections);
            }
          } catch{}
          continue; // fallback
        }
        // non-retryable but if combo, still fallback? Treat 4xx as fallbackable except auth? For now fallback on any error when multiple candidates
        if(models.length>1) continue;
        throw new LlmError(msg, `PROVIDER_${resp.status}`, { status: resp.status });
      }
      // success streaming
      return { response: resp, providerId: provId, modelId, connectionId: conn.id };
    } catch(e){
      if(e instanceof LlmError) throw e;
      if(e?.name==="AbortError") throw new LlmError("Request aborted", "ABORTED");
      lastError = e?.message||String(e);
      if(models.length>1) continue;
      throw new LlmError(lastError, "TRANSPORT");
    }
  }
  throw new LlmError(lastError||"All providers failed", "ALL_PROVIDERS_FAILED", { status: lastStatus });
}

// ---------------------------------------------------------------------------
// NineRouter adapter
class NineRouterAdapter extends LlmAdapter {
  providerInfo(provider){
    if(provider==="9router") return { id:"9router", name:"9Router" };
    if(provider.startsWith("9router-")){
      const raw = provider.slice("9router-".length);
      const reg = REGISTRY.find(r=>r.id===raw);
      return { id:provider, name: reg? `${reg.display.name} (9R)` : provider };
    }
    return { id: provider, name: provider };
  }
  providerRetryPolicy(_provider){ return undefined; }
  async listModels(provider){
    if(provider==="9router") return listAllModels();
    if(provider.startsWith("9router-")){
      const raw=provider.slice("9router-".length);
      const reg=REGISTRY.find(r=>r.id===raw || r.alias===raw);
      const dis = getStore().disabled[raw]||[];
      return (reg?.models||[]).filter(m=>!dis.includes(m.id)).map(m=>({
        provider, id:m.id, name:m.id, description: reg.display.name, inputModalities:["text","image"]
      }));
    }
    return [];
  }
  async resolveModel(provider, model, _signal){
    if(provider==="9router" || provider.startsWith("9router-")){
      const info = resolveModelInfo(model);
      // if provider is 9router-* then force that prefix
      if(provider.startsWith("9router-")){
        return { provider, id: model, name: info.name, description: info.description, context: info.context };
      }
      return { provider:"9router", id: info.id, name: info.name, description: info.description, context: info.context, defaultMaxTokens: info.defaultMaxTokens };
    }
    return { provider, id:model, name:model };
  }
  async *stream(options){
    const provider = options.provider;
    const model = options.model;
    if(provider!=="9router" && !provider.startsWith("9router-")){
      throw new LlmError(`NineRouter adapter cannot serve provider "${provider}"`, "NO_ADAPTER");
    }
    // Determine candidate list
    const store = getStore();
    // Check if model is a combo name
    const combo = store.combos.find(c=>c.name===model || c.id===model);
    let candidates;
    if(combo){
      candidates = combo.models || [];
      // capacity adapter: if request has image but combo's first model lacks vision, prepend vision models
      // naive check
      const hasImage = options.messages.some(m=>m.content.some(b=>b.type==="image"));
      if(hasImage){
        const cap = store.settings.capacityAdapter?.vision;
        if(cap?.enabled && cap.models?.length){
          // prepend vision models if combo lacks vision capability (simplified: just prepend)
          const visionCandidates = cap.models.filter(m=>!candidates.includes(m));
          if(visionCandidates.length) candidates = [...visionCandidates, ...candidates];
        }
      }
    } else if(model.includes("/")){
      candidates = [model];
    } else {
      // bare model id -> treat as single
      candidates = [model];
    }
    if(provider.startsWith("9router-")){
      const raw = provider.slice("9router-".length);
      candidates = candidates.map(m=> m.includes("/") ? m : `${raw}/${m}`);
    }
    // Build body maker per candidate modelId
    const makeBody = (targetModel) => toOpenAIBody(options, targetModel);
    let started = false;
    let lastErr = null;
    for(let attempt=0; attempt<candidates.length; attempt++){
      const slice = candidates.slice(attempt);
      try{
        const { response, providerId, modelId, connectionId } = await fetchWithFallback(slice.length===candidates.length? slice : [slice[0]], makeBody, options, options.signal);
        if(options.signal?.aborted) throw new LlmError("aborted", "ABORTED");
        // log usage to JSON log for dashboard
        const start = Date.now();
        let ttft = null;
        let usageHolder = null;
        const chunks = sseToChunks(response, modelId);
        for await (const ch of chunks){
          if(ttft===null && (ch.type==="text-delta" || ch.type==="reasoning-delta")) ttft = Date.now()-start;
          if(ch.type==="usage") usageHolder = ch.usage;
          // persist observability if enabled
          if(options.signal?.aborted) break;
          yield ch;
          started = true;
          if(ch.type==="finish") break;
        }
        // save usage history async (non-blocking)
        try{
          const histFile = routerDataFile("usageHistory.json");
          const hist = readJson(histFile, []);
          hist.push({
            timestamp: new Date().toISOString(),
            provider: providerId,
            model: modelId,
            connectionId,
            apiModel: model,
            tokens: usageHolder||{},
            latency: { total: Date.now()-start, ttft },
            status: "ok",
          });
          if(hist.length>5000) hist.splice(0, hist.length-5000);
          writeJson(histFile, hist);
        }catch{}
        return;
      } catch(e){
        lastErr = e;
        const retryable = e?.code==="ALL_PROVIDERS_FAILED" || e?.code==="TRANSPORT" || /429|502|503|529|rate/i.test(e?.message||"");
        const isLast = attempt===candidates.length-1;
        if(!retryable || isLast) {
          // yield finish error
          const code = e?.code||"PROVIDER_ERROR";
          const msg = e?.message||String(e);
          yield { type:"finish", reason:{kind:"error", failure:{message: msg, code}} };
          return;
        }
        // otherwise continue to next candidate (fallback)
        continue;
      }
    }
    if(!started){
      const msg = lastErr?.message||"All providers failed";
      yield { type:"finish", reason:{kind:"error", failure:{message: msg, code: lastErr?.code||"ALL_PROVIDERS_FAILED"}} };
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP API (connection.fetch) wiring
function jsonResponse(data, status=200){
  return new Response(JSON.stringify(data), { status, headers:{ "content-type":"application/json; charset=utf-8", "cache-control":"no-store", "access-control-allow-origin":"*"}});
}
function errorJson(msg, status=400){ return jsonResponse({ ok:false, error:String(msg)}, status); }

function requireTrusted(req){
  // DSH 0.1.2 authenticates loopback via cookie; here we just allow same-origin fetches (fetch with same-origin credentials)
  // No strict check needed; open to loopback.
  return true;
}

async function parseJsonBody(req){
  try { return await req.json(); } catch { return null; }
}

function handleStatus(){
  const s=getStore();
  const home = routerHome();
  return jsonResponse({
    ok:true,
    gateway: `${home}`,
    version:"0.5.75",
    registryProviders: REGISTRY.length,
    connections: s.connections.length,
    combos: s.combos.length,
    apiKeys: s.apiKeys.length,
    settings: s.settings,
  });
}
function handleProviders(){
  const s=getStore();
  const out = REGISTRY.map(r=>{
    const conns = s.connections.filter(c=>c.provider===r.id);
    return {
      id:r.id, alias:r.alias, display:r.display, category:r.category, transport:r.transport,
      models: r.models || [],
      connections: conns.map(c=>({ id:c.id, name:c.name||c.email||c.id.slice(0,8), provider:c.provider, authType:c.authType, isActive:c.isActive!==false, priority:c.priority, testStatus:c.testStatus||"unknown", email:c.email||null, providerSpecificData: c.providerSpecificData||{} })),
      disabledModels: s.disabled[r.id]||[],
      hasConnection: conns.length>0,
    };
  });
  return jsonResponse({ ok:true, providers: out });
}
function handleModels(){
  return jsonResponse({ ok:true, models: listAllModels(), directory: buildDirectoryEntries() });
}
function handleCombos(){ return jsonResponse({ ok:true, combos: getStore().combos }); }
function handleKeys(){ return jsonResponse({ ok:true, keys: getStore().apiKeys }); }
function handleSettings(){ return jsonResponse({ ok:true, settings: getStore().settings }); }
function handleUsage(){
  const hist = readJson(routerDataFile("usageHistory.json"), []);
  const limited = hist.slice(-200).reverse();
  return jsonResponse({ ok:true, history: limited, total: hist.length });
}
function handleLogs(){
  const hist = readJson(routerDataFile("usageHistory.json"), []);
  const logs = hist.slice(-50).reverse().map(h=>`[${h.timestamp}] ${h.provider}/${h.model} ${h.status} ${h.tokens?.inputTokens||0}→${h.tokens?.outputTokens||0}`);
  return jsonResponse({ ok:true, logs });
}

async function handleCreateCombo(req){
  const body = await parseJsonBody(req);
  if(!body?.name) return errorJson("name required");
  const s=getStore();
  if(s.combos.some(c=>c.name===body.name)) return errorJson("combo name already exists", 409);
  const combo = { id: randomUUID(), name: body.name, kind: body.kind||"llm", models: Array.isArray(body.models)? body.models : [] , createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
  saveCombos([...s.combos, combo]);
  return jsonResponse({ ok:true, combo }, 201);
}
async function handleUpdateCombo(req, id){
  const body = await parseJsonBody(req);
  const s=getStore();
  const idx=s.combos.findIndex(c=>c.id===id || c.name===id);
  if(idx<0) return errorJson("combo not found", 404);
  const next={ ...s.combos[idx], ...body, updatedAt:new Date().toISOString() };
  if(body.models) next.models = body.models;
  const copy=[...s.combos]; copy[idx]=next;
  saveCombos(copy);
  return jsonResponse({ ok:true, combo: next });
}
async function handleDeleteCombo(req, id){
  const s=getStore();
  const filtered=s.combos.filter(c=>c.id!==id && c.name!==id);
  if(filtered.length===s.combos.length) return errorJson("not found",404);
  saveCombos(filtered);
  return jsonResponse({ ok:true });
}
async function handleCreateConnection(req){
  const body=await parseJsonBody(req);
  if(!body?.provider) return errorJson("provider required");
  const prov = resolveAlias(body.provider);
  if(!REGISTRY.some(r=>r.id===prov)) return errorJson(`unknown provider ${body.provider}`);
  const s=getStore();
  const now=new Date().toISOString();
  const conn={
    id: randomUUID(),
    provider: prov,
    authType: body.authType||"apikey",
    name: body.name||null,
    email: body.email||null,
    priority: body.priority|| (s.connections.filter(c=>c.provider===prov).length+1),
    isActive: body.isActive!==false,
    apiKey: body.apiKey||null,
    accessToken: body.accessToken||null,
    refreshToken: body.refreshToken||null,
    providerSpecificData: body.providerSpecificData||{},
    baseUrl: body.baseUrl||null,
    testStatus:"unknown",
    createdAt: now, updatedAt: now,
  };
  if(body.baseUrl) conn.providerSpecificData.baseUrl = body.baseUrl;
  if(body.headers) conn.providerSpecificData.headers = body.headers;
  saveConnections([...s.connections, conn]);
  return jsonResponse({ ok:true, connection: conn },201);
}
async function handleUpdateConnection(req, id){
  const body=await parseJsonBody(req);
  const s=getStore();
  const idx=s.connections.findIndex(c=>c.id===id);
  if(idx<0) return errorJson("not found",404);
  const cur=s.connections[idx];
  const merged={ ...cur, ...body, updatedAt:new Date().toISOString(), provider: body.provider? resolveAlias(body.provider):cur.provider };
  if(body.providerSpecificData) merged.providerSpecificData = { ...(cur.providerSpecificData||{}), ...body.providerSpecificData };
  const copy=[...s.connections]; copy[idx]=merged;
  saveConnections(copy);
  return jsonResponse({ ok:true, connection: merged });
}
async function handleDeleteConnection(req, id){
  const s=getStore();
  const filtered=s.connections.filter(c=>c.id!==id);
  if(filtered.length===s.connections.length) return errorJson("not found",404);
  saveConnections(filtered);
  return jsonResponse({ ok:true });
}
async function handleCreateKey(req){
  const body=await parseJsonBody(req);
  if(!body?.key) return errorJson("key required");
  const s=getStore();
  if(s.apiKeys.some(k=>k.key===body.key)) return errorJson("key exists",409);
  const rec={ id: randomUUID(), key: body.key, name: body.name||null, isActive: body.isActive!==false, createdAt: new Date().toISOString() };
  saveKeys([...s.apiKeys, rec]);
  return jsonResponse({ ok:true, key: rec },201);
}
async function handleDeleteKey(req, id){
  const s=getStore();
  const filtered=s.apiKeys.filter(k=>k.id!==id);
  if(filtered.length===s.apiKeys.length) return errorJson("not found",404);
  saveKeys(filtered);
  return jsonResponse({ ok:true });
}
async function handleUpdateSettings(req){
  const body=await parseJsonBody(req);
  if(!body || typeof body!=="object") return errorJson("invalid body");
  saveSettings(body);
  return jsonResponse({ ok:true, settings: getStore().settings });
}
async function handleValidateKey(req){
  const url=new URL(req.url, "http://x");
  const key=url.searchParams.get("key")|| (await parseJsonBody(req))?.key;
  if(!key) return errorJson("key required");
  const s=getStore();
  const hit=s.apiKeys.find(k=>k.key===key && k.isActive!==false);
  if(hit) return jsonResponse({ ok:true, valid:true });
  // if no keys configured, allow any (open gateway) - matches 9router requireApiKey default true but we default to open when empty
  if(s.apiKeys.length===0) return jsonResponse({ ok:true, valid:true, openGateway:true });
  return jsonResponse({ ok:false, valid:false },401);
}
async function handleChatCompletions(req){
  // OpenAI compatible proxy (for CLI tools / external)
  // Auth: if gateway has apiKeys, validate Bearer
  const s=getStore();
  const auth = req.headers.get("authorization")||"";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if(s.apiKeys.length>0){
    const hit = s.apiKeys.find(k=>k.key===token && k.isActive!==false);
    if(!hit) return errorJson("Invalid API key",401);
  }
  let body;
  try{ body=await req.json(); }catch{ return errorJson("Invalid JSON",400); }
  const modelStr = body.model;
  if(!modelStr) return errorJson("Missing model",400);
  // Reuse adapter logic via direct fetchWithFallback path: construct GenerateOptions-like? Use makeBody wrapper
  // For proxy we directly treat body as upstream shape, but we need to route via combo/fallback similarly.
  // Simplify: Treat body.messages as source and delegate to fetchWithFallback using a wrapper that returns body itself (passthrough)
  // However we need to handle system etc included.
  const combo = s.combos.find(c=>c.name===modelStr);
  const candidates = combo ? combo.models : [modelStr];
  const makeBody = (targetModel) => ({ ...body, model: targetModel });
  try{
    const { response } = await fetchWithFallback(candidates, makeBody, { messages:[], system:undefined, tools: body.tools }, null);
    // Stream or JSON: if client asked stream
    if(body.stream){
      // pass through stream as-is but add attribution? keep raw
      return new Response(response.body, { status: response.status, headers:{ "content-type": response.headers.get("content-type")||"text/event-stream", "cache-control":"no-cache", "access-control-allow-origin":"*"}});
    } else {
      const text = await response.text();
      return new Response(text, { status: response.status, headers:{ "content-type": response.headers.get("content-type")||"application/json", "access-control-allow-origin":"*"}});
    }
  } catch(e){
    const code = e?.code==="ALL_PROVIDERS_FAILED" ? 502 : (e?.status||502);
    return errorJson(e?.message||String(e), code);
  }
}
async function handleModelsProxy(){
  // list models OpenAI style
  const models = listAllModels().map(m=>({ id:m.id, object:"model", created: Math.floor(Date.now()/1000), owned_by:"9router"}));
  return jsonResponse({ object:"list", data: models });
}
async function handleTestingProvider(req){
  const body=await parseJsonBody(req);
  const provId = body?.provider || new URL(req.url, "http://x").searchParams.get("provider");
  if(!provId) return errorJson("provider required");
  const conn = findConnectionForProvider(provId);
  if(!conn) return errorJson("no active connection",404);
  // attempt a cheap models request or ping with test model
  const reg = REGISTRY.find(r=>r.id===provId);
  const testModel = reg?.models?.[0]?.id || "gpt-4o-mini";
  const { headers, baseUrl } = connectionToHeaders(conn, provId);
  let url = baseUrl;
  if(!url) return errorJson("no endpoint");
  // For OpenAI providers, try a minimal chat completions with max_tokens=1
  // For anthropic, try messages.
  let hdrs = { "Content-Type":"application/json", ...headers };
  try{ Object.assign(hdrs, attributionHeaders()); }catch{}
  try{
    let resp;
    if(provId==="anthropic"){
      resp = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers: {...hdrs, "x-api-key": headers["x-api-key"]||conn.apiKey||"", "anthropic-version":"2023-06-01"}, body: JSON.stringify({ model:testModel, max_tokens: 5, messages:[{role:"user", content:"hi"}]}), signal: AbortSignal.timeout(8000)});
    } else {
      const b = { model:testModel, messages:[{role:"user", content:"hi"}], max_tokens:5, stream:false };
      resp = await fetch(url, { method:"POST", headers: hdrs, body: JSON.stringify(b), signal: AbortSignal.timeout(8000)});
    }
    const text = await resp.text();
    if(resp.ok) return jsonResponse({ ok:true, status: resp.status, preview: text.slice(0,500)});
    return jsonResponse({ ok:false, status: resp.status, error: text.slice(0,800)}, 502);
  } catch(e){
    return errorJson(e.message||String(e), 502);
  }
}

// unified router for connection.fetch
async function routerFetch(request){
  const url = new URL(request.url, "http://x");
  const path = url.pathname;
  const method = (request.method||"GET").toUpperCase();

  // CORS preflight
  if(method==="OPTIONS") return new Response(null, { status:204, headers:{ "access-control-allow-origin":"*", "access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS", "access-control-allow-headers":"content-type,authorization"}});

  // 9Router API namespace (also mirrored at /api/9router/* for compatibility)
  const apiPrefix = path.startsWith("/api/9router") ? "/api/9router" : (path.startsWith("/dsh-9router") ? "/dsh-9router" : (path.startsWith("/9router")? "/9router" : null));
  let sub = null;
  if(apiPrefix) sub = path.slice(apiPrefix.length) || "/";
  else if(path.startsWith("/v1/") || path.startsWith("/api/v1/")) sub = null; // handled as proxy
  else if(path==="/v1/models" || path==="/api/v1/models") sub=null;

  // OpenAI compat under same namespace: /api/9router/v1/*
  const isOpenAIProxy = path.includes("/v1/chat/completions") || path.includes("/chat/completions") || path.endsWith("/v1/models");
  if(isOpenAIProxy){
    if(path.endsWith("/models") && method==="GET") return handleModelsProxy();
    if(path.includes("chat/completions")) return handleChatCompletions(request);
  }

  if(sub!==null){
    if(sub==="/" || sub==="/status") {
      if(method==="GET") return handleStatus();
    }
    if(sub==="/providers" && method==="GET") return handleProviders();
    if(sub==="/providers/test" && method==="POST") return handleTestingProvider(request);
    if(sub.startsWith("/providers/") && sub.endsWith("/test") && method==="POST"){
      // allow POST /providers/<id>/test via body alt
      return handleTestingProvider(request);
    }
    if(sub==="/models" && method==="GET") return handleModels();
    if(sub==="/combos" && method==="GET") return handleCombos();
    if(sub==="/combos" && method==="POST") return handleCreateCombo(request);
    if(sub.startsWith("/combos/") && method==="PUT") {
      const id = decodeURIComponent(sub.slice("/combos/".length));
      return handleUpdateCombo(request, id);
    }
    if(sub.startsWith("/combos/") && method==="DELETE"){
      const id=decodeURIComponent(sub.slice("/combos/".length));
      return handleDeleteCombo(request, id);
    }
    if(sub==="/keys" && method==="GET") return handleKeys();
    if(sub==="/keys" && method==="POST") return handleCreateKey(request);
    if(sub.startsWith("/keys/") && method==="DELETE"){
      const id=decodeURIComponent(sub.slice("/keys/".length));
      return handleDeleteKey(request, id);
    }
    if(sub==="/connections" && method==="GET"){
      const conns=getStore().connections;
      return jsonResponse({ ok:true, connections: conns });
    }
    if(sub==="/connections" && method==="POST") return handleCreateConnection(request);
    if(sub.startsWith("/connections/") && method==="PUT"){
      const id=decodeURIComponent(sub.slice("/connections/".length));
      return handleUpdateConnection(request, id);
    }
    if(sub.startsWith("/connections/") && method==="DELETE"){
      const id=decodeURIComponent(sub.slice("/connections/".length));
      return handleDeleteConnection(request, id);
    }
    if(sub==="/settings" && method==="GET") return handleSettings();
    if(sub==="/settings" && method==="PUT") return handleUpdateSettings(request);
    if(sub==="/usage" && method==="GET") return handleUsage();
    if(sub==="/logs" && method==="GET") return handleLogs();
    if(sub==="/validate-key" && (method==="GET"||method==="POST")) return handleValidateKey(request);

    // OpenAI compat under /api/9router/v1
    if(sub.startsWith("/v1/")){
      if(sub==="/v1/models" && method==="GET") return handleModelsProxy();
      if(sub==="/v1/chat/completions" && method==="POST") return handleChatCompletions(request);
    }
    return errorJson(`Unknown 9Router route ${method} ${path}`,404);
  }

  // Global OpenAI compat (also handle direct /v1/* so CLI tools that point at harness origin work even without prefix)
  if(path==="/v1/models" || path==="/api/v1/models"){
    if(method==="GET") return handleModelsProxy();
  }
  if(path.endsWith("/v1/chat/completions") || path.endsWith("/chat/completions")){
    if(method==="POST") return handleChatCompletions(request);
  }

  // fallback: not ours
  return null;
}

// ---------------------------------------------------------------------------
// Plugin export
export const name = "dsh-9router";
export const inject = ["llm"];

export const Config = z.object({
  isolatedGateway: z.boolean().default(true),
  gatewayPort: z.number().min(1024).max(65535).optional(),
});

export function apply(ctx, config){
  ctxGlobal = ctx;
  // init store (ensure directory + seed defaults)
  try { mkdirSync(routerHome(), { recursive: true }); } catch {}
  if(!existsSync(routerDataFile("combos.json"))){
    writeJson(routerDataFile("combos.json"), DEFAULT_COMBO_LIST);
  }
  if(!existsSync(routerDataFile("settings.json"))){
    writeJson(routerDataFile("settings.json"), { isolatedGateway: config?.isolatedGateway??true, theme:"auto" });
  }
  // ensure other files exist
  if(!existsSync(routerDataFile("connections.json"))) writeJson(routerDataFile("connections.json"), []);
  if(!existsSync(routerDataFile("apiKeys.json"))) writeJson(routerDataFile("apiKeys.json"), []);
  getStore(); // warm cache

  const adapter = new NineRouterAdapter();

  // register adapter + directory + discovery
  // Delay until llm service is available (inject ensures it is)
  let llmReady = false;
  function tryRegister(){
    if(llmReady) return;
    const llm = ctx.get("llm");
    if(!llm) return;
    llmReady = true;
    try {
      adapterRegistration = llm.registerAdapter(["9router"], adapter);
      directoryRegistration = llm.registerConfigurableProviders(buildDirectoryEntries());
      llm.registerModelDiscovery("dsh-9router", async (req, signal)=>{
        // For endpoint interrogation: try to fetch models via OpenAI /v1/models
        if(!req.baseURL) return [];
        try{
          const headers={};
          if(req.apiKey) headers["Authorization"]=`Bearer ${req.apiKey}`;
          const resp = await fetch(req.baseURL.replace(/\/+$/,"")+ "/models", { headers, signal: signal||AbortSignal.timeout(7000) });
          if(!resp.ok) return [];
          const data = await resp.json();
          const list = data.data|| data.models||[];
          return list.slice(0,60).map(m=>({ id: m.id||m.name||"", name: m.name||m.id, contextWindow: m.context_length||undefined }));
        } catch{ return []; }
      });
      ctx.logger?.info?.("[9router] LLM adapter registered: 9router");
    } catch(e){
      ctx.logger?.warn?.("[9router] adapter registration failed: "+ e?.message);
    }
  }
  tryRegister();
  // also inject settings if available to watch live updates (not strictly needed since JSON store is live)
  ctx.inject(["settings"], (sCtx)=>{
    // register a namespace so settings UI could persist our gateway port if desired; keep empty schema for now
    // we don't strictly need it, but it makes the plugin appear in settings persistence
    try{
      sCtx.settings.register("dsh-9router", z.object({ isolatedGateway: z.boolean().optional(), gatewayPort: z.number().optional() }), {
        // No installSection, just register for type safety; direct JSON store remains source of truth
      });
    }catch{}
    tryRegister();
  });

  // Also attempt periodic registration retry if llm not yet injected (race)
  const timer = setInterval(()=>{ if(!llmReady) tryRegister(); else clearInterval(timer); }, 500);
  setTimeout(()=>clearInterval(timer), 10000);

  // ---- HTTP routes via host webserver / connection.fetch ----
  // Prefer connection.fetch (works with typert auth), fallback to webServer if available
  function installRoutes(register){
    register({ kind:"exact", path:"/api/9router/status", handler: async (req,res)=>{ const r=await routerFetch(new Request(`http://x${req.url}`, { method:req.method, headers: req.headers })); if(r){ res.writeHead(r.status, Object.fromEntries(r.headers.entries())); res.end(await r.text()); } else {res.writeHead(404); res.end();} } });
    // we keep minimal explicit routes for webServer path; the full routerFetch handles everything via fallback below.
  }

  // 1) connection.fetch (preferred, typert-auth)
  try{
    const conn = ctx.get("connection");
    if(conn?.fetch?.register){
      const paths = [
        "/api/9router/status","/api/9router/providers","/api/9router/providers/test","/api/9router/models","/api/9router/combos","/api/9router/keys","/api/9router/connections","/api/9router/settings","/api/9router/usage","/api/9router/logs","/api/9router/validate-key",
        "/dsh-9router/status","/dsh-9router/providers","/dsh-9router/combos","/dsh-9router/keys","/dsh-9router/connections","/dsh-9router/settings",
        "/v1/models","/v1/chat/completions","/api/v1/models","/api/v1/chat/completions",
        "/api/9router/v1/models","/api/9router/v1/chat/completions",
      ];
      for(const p of paths){
        try{
          conn.fetch.register({
            path: p,
            methods: ["GET","POST","PUT","DELETE","OPTIONS","HEAD"],
            fetch: async (request)=>{
              const rt = await routerFetch(request);
              if(rt) return rt;
              // Check prefix routes that include dynamic id
              const u = new URL(request.url, "http://x");
              const full = u.pathname;
              // dynamic combos/:id
              if(full.startsWith("/api/9router/combos/") || full.startsWith("/dsh-9router/combos/")){
                const r2 = await routerFetch(request); if(r2) return r2;
              }
              if(full.startsWith("/api/9router/connections/") || full.startsWith("/dsh-9router/connections/")){
                const r2 = await routerFetch(request); if(r2) return r2;
              }
              if(full.startsWith("/api/9router/keys/")){
                const r2 = await routerFetch(request); if(r2) return r2;
              }
              // fallback 404 for this path
              return errorJson("Not found",404);
            }
          });
        }catch(e){ /* per-path collision ignore */}
      }
      // catch-all prefix for dynamic subpaths (combos/:id, connections/:id, keys/:id)
      // connection.fetch does exact match, so we also register a prefix-like handler via fallback: register many exact combos? Instead rely on routerFetch inside each exact path above that will handle dynamic.
      // For totally dynamic paths, we register a catch-all at /api/9router/combos/* via multiple registers? connection.fetch supports exact only, so we register a prefix route via webServer below as well.
      ctx.logger?.info?.("[9router] routes registered via connection.fetch");
    }
  }catch(e){ ctx.logger?.warn?.("[9router] connection.fetch registration failed: "+ e?.message); }

  // 2) webServer fallback (node:http) for prefix & OpenAI compat
  ctx.inject(["webServer"], (wsCtx)=>{
    const ws = wsCtx.get("webServer");
    if(!ws) return;
    // Use prefix handlers for full coverage
    const mk = (path, kind="prefix") => {
      try{
        return ws.register({
          kind,
          path,
          handler: async (req,res)=>{
            const full = `http://${req.headers.host||"127.0.0.1"}${req.url}`;
            const req2 = new Request(full, { method: req.method, headers: req.headers, body: (req.method==="GET"||req.method==="HEAD")? undefined : await new Promise((resolve)=>{
              let data=""; req.on("data", c=> data+=c); req.on("end", ()=> resolve(data||undefined));
            }) });
            // copy body for JSON if needed
            let r;
            try { r = await routerFetch(req2); } catch(e){ r = errorJson(String(e),500); }
            if(!r){
              res.writeHead(404, {"content-type":"application/json"}); res.end(JSON.stringify({ok:false, error:"Not found"}));
              return;
            }
            const hdrs = {};
            for(const [k,v] of r.headers.entries()) hdrs[k]=v;
            hdrs["access-control-allow-origin"]="*";
            res.writeHead(r.status, hdrs);
            const txt = await r.text();
            res.end(txt);
          }
        });
      } catch{ return ()=>{} }
    };
    const disposers = [];
    disposers.push(mk("/api/9router"));
    disposers.push(mk("/dsh-9router"));
    disposers.push(mk("/9router"));
    disposers.push(mk("/v1"));
    disposers.push(mk("/api/v1"));
    ctx.effect(()=>()=>{ for(const d of disposers) try{ d(); }catch{} }, "9router webServer routes");
    ctx.logger?.info?.("[9router] webServer routes registered");
  });

  // ---- expose a small CLI helper endpoint for ping ----
  ctx.effect(()=>{
    ctx.logger?.info?.(`[9router] data dir: ${routerHome()}`);
    return ()=>{ try{ clearInterval(timer);}catch{} }
  }, "9router boot");

  // Provide a storage backend key for optional inspection (not required)
}
