# Agent Note: Copy serialized records from chat and trajectory

Status: implemented

[English](2026-08-28-copy-serialized-tool-call.md) | 中文

## Problem

调试一次失败或异常的 tool call 过去只能手工转录各个片段：聊天行展示美化后的 IN/OUT 文本,trajectory 详情面板展示 Payload/Result/Schema/Timing 标签页,但两个界面都没有把整个调用作为可复制的单元提供。要在 bug 报告或提示词里复现一次失败,只能对着截图重新敲参数和错误文本。

## Decision

两个界面各自把调用序列化为稳定的 JSON 文本,并通过共享的 `writeClipboard` 宿主辅助函数复制,反馈沿用消息复制动作的勾选图标窗口。

聊天侧:ui-tool 的 `tool-call-model.ts` 中的 `serializeToolCall(toolName, block)` 把一个 `ToolCallBlock`(运行中或已完结)投影为 `{ tool, callId, status, arguments, startedAt, settledAt, result }`;原始参数是 JSON 时 `arguments` 取解析结果,否则保留原文;`result` 仅在调用完结后出现。`GenericToolCard` 把该文本作为 `copyText` 传给 `ToolRow`;行内在 Inspect 旁渲染一个悬停显现的 Copy  pill,实现为内部 `CopyPill` 组件,使 pending/反馈/epoch 逻辑的每个分支都能从界面触达。

Trajectory 侧:`trajectory-record.ts` 中的 `serializeTrajectoryRecord(cell)` 把任意 kind 的记录投影为 `{ kind, summary, startedAt, durationSeconds, source, input, output, thinking, prompt }`,并为 tool 与 subtool 记录追加 `callId`、`isError` 和 `schema`;`source` 承载 user 与 context 记录的产生者,`prompt` 承载 system 记录的快照。`TrajectoryTable` 对每条选中的记录都在详情头部——关闭按钮之前,复用其外观——渲染一个复制图标按钮;反馈勾选以 `trajectoryRecordId` 为键,因此窗口期内切换选择不会让未复制的记录显示勾选。request 头部选择不含记录负载,不提供复制。

两种形状都是调试投影,不是 wire contract;字段在各函数的 JSDoc 中命名,并由单元测试钉住。

## Alternatives considered

**在 client-runtime 里写一个面向 session 事件对的共享序列化器。** 否决:两个界面持有的材料不同——聊天侧是折叠后的 `ToolCallBlock`(带 content block 和结构化 error 对),trajectory cell 是已压平的详情字符串外加调用时的 schema——共享函数只能接受两方输入的联合,却不符合任何一方的词汇。

**直接复制原始 session 事件。** 否决:事件对带着 seq/窗口簿记,并把调用头与结果拆开;调试的问题是"调了什么、返回了什么",投影直接回答了这个问题。

**在 trajectory 面板里做按标签页的复制按钮。** 否决,属于冗余:Payload 和 Result 面板本身已是带复制能力的 JsonTree/文本界面;头部按钮的意义在于一次交出整条记录。

## Testing

单元测试逐字段钉住两个序列化器,包括运行中(无 result)、中断(stopped 状态)、非 JSON 参数与窗口截断结果的各条分支。渲染测试钉住 pill 的折叠隐藏/展开可见、按原文写入剪贴板、宿主拒绝写入时的无操作、卸载后结算的守卫,以及 trajectory 头部按钮在 tool 与 assistant 记录上的出现和写入剪贴板的确切文本。

## Consequences

一次失败的调用——或任意 user、context、system、assistant 记录——现在都可以一次粘贴进 bug 报告或后续提示词。代价是两个小投影必须随着 `ToolCallBlock` 与 `TrajectoryCellProps` 的演化保持诚实;二者都与所序列化的模型同处一地,单元测试点名了它们输出的每个字段。
