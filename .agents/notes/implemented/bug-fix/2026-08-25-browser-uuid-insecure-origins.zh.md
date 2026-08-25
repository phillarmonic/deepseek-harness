# Agent Note: 在不安全来源中生成浏览器 UUID

Status: implemented

[English](2026-08-25-browser-uuid-insecure-origins.md) | 中文

## Problem

Web profile 支持通过普通 HTTP 访问局域网。Web Crypto 在这些来源中提供 `getRandomValues()`，但浏览器只在安全上下文中提供 `crypto.randomUUID()`。调用该便捷方法的浏览器客户端可以加载应用并打开事件 socket，却会在发送一元 RPC 或创建草稿图片标识符前失败。连接启动还会放大该故障：`host.describe` 无法生成请求 ID 时，已经建立的两个事件 socket 都会被中止。

API carrier、通用 connection RPC、fixture 数据和会话草稿都需要生成 UUID。各包保留独立实现会导致 version 或 variant 位不一致，并违反客户端 bundle 重复检查。

## Decision

`@deepseek-ai/dsh-random-uuid` 统一提供零依赖的 `randomUuid()` 函数。它通过 `globalThis.crypto.getRandomValues()` 填充 16 字节，写入 RFC 4122 version 4 和 variant 位，并返回小写、带连字符的表示。它明确不回退到非密码学熵源。

该包没有单例状态或运行时身份。客户端 bundle 纯度规则将其归类为可安全内联，因此浏览器 bundle 会嵌入该函数，而发布的 Node 模块保留普通 workspace 依赖。凡标识符生成需要在受支持 HTTP 来源中工作，浏览器代码都使用该函数；仅在宿主运行的代码仍可继续使用 `node:crypto`。

## Alternatives considered

**把 helper 保留在 `dsh-client-connection` 中。** 不采用，因为 `host-apiproxy` 和 `ui-conversation` 将需要导入客户端插件的运行时值，从而复制插件运行时代码或违反 bundle 纯度规则。

**在每个浏览器包中复制算法。** 不采用，因为这些副本没有不同的业务语义，重复检查将其视为一个共享原语是正确的。

**在安全上下文之外使用计数器或 `Math.random()`。** 不采用，因为关联 ID 和草稿 ID 需要不可预测且抗碰撞的值，而 `getRandomValues()` 已在受支持 HTTP 来源中提供密码学熵。

**要求局域网访问必须使用 HTTPS。** 不采用，因为 Web profile 明确支持通过 HTTP 访问受信任的局域网 authority；UUID 生成必须遵守该部署约定。

## Verification

工具包测试固定了确定性字节、小写格式、version 位、variant 位，以及没有 `crypto.randomUUID` 时的运行。Fetch carrier 覆盖在只提供 `getRandomValues()` 时调用 `host.describe`。会话覆盖在相同约束下创建草稿图片。客户端 bundle 纯度覆盖允许共享包，真实 Web 组合继续负责浏览器层的连接启动行为。

## Consequences

一元 API 启动和草稿图片创建可在受信任 HTTP 局域网来源以及安全来源中工作。浏览器 bundle 增加一个没有共享状态的小型内联 helper。没有 Web Crypto 的环境会在创建标识符时失败，而不会静默降低熵强度；这些旧环境仍不受支持。
