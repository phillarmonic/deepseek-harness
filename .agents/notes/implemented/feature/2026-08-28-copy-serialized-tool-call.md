# Agent Note: Copy serialized records from chat and trajectory

Status: implemented

English | [中文](2026-08-28-copy-serialized-tool-call.zh.md)

## Problem

Debugging a failed or surprising tool call meant transcribing its pieces by hand: the chat row shows the pretty-printed IN/OUT text, and the trajectory details panel shows Payload/Result/Schema/Timing tabs, but neither surface offered the call as one copyable unit. Reproducing a failure in a bug report or a prompt meant re-typing arguments and error text from screenshots.

## Decision

Each surface serializes the call to a stable JSON text and copies it through the shared `writeClipboard` host helper, with the same check-glyph feedback window the message copy action uses.

Chat: `serializeToolCall(toolName, block)` in ui-tool's `tool-call-model.ts` projects a `ToolCallBlock` (running or settled) into `{ tool, callId, status, arguments, startedAt, settledAt, result }`, with `arguments` parsed when the raw args are JSON and kept raw otherwise, and `result` present only once the call settles. `GenericToolCard` passes the text to `ToolRow` as `copyText`; the row renders a hover-revealed Copy pill beside Inspect, implemented as an internal `CopyPill` component so every branch of the pending/feedback/epoch logic is reachable from the UI.

Trajectory: `serializeTrajectoryRecord(cell)` in `trajectory-record.ts` projects any record kind into `{ kind, summary, startedAt, durationSeconds, source, input, output, thinking, prompt }`, adding `callId`, `isError`, and `schema` for tool and subtool records; `source` carries the producer of user and context records, and `prompt` the snapshot of system records. `TrajectoryTable` renders a copy icon button in the details header — before the close button, reusing its chrome — for every selected record; the feedback check is keyed by `trajectoryRecordId` so a selection change mid-window never shows a check on a record that was not copied. Request-header selections hold no record payload and offer no copy.

Both shapes are debugging projections, not wire contracts; the fields are named in each function's JSDoc and pinned by unit tests.

## Alternatives considered

**One shared serializer in client-runtime over the session-event pair.** Rejected: the two surfaces hold different material — chat has the folded `ToolCallBlock` with content blocks and the structured error pair, the trajectory cell holds already-flattened detail strings plus the call-time schema — so a shared function would take a union of both inputs and answer to neither caller's vocabulary.

**Copying the raw session events.** Rejected: the event pair carries seq/window bookkeeping and splits the call head from the result; the debugging question is "what was called and what came back", which the projections answer directly.

**A per-tab copy button in the trajectory panel.** Rejected as redundant: the Payload and Result panes are already JsonTree/text surfaces with their own copy affordances; the header button exists to hand over the whole record at once.

## Testing

Unit tests pin both serializers field-by-field, including the running (no result), interrupted (stopped status), non-JSON-args, and windowless-result arms. Render tests pin the pill's absent-collapsed/present-expanded visibility, the clipboard write with the exact text, the refused-write no-op, the post-unmount settle guard, and the trajectory header button's presence and exact clipboard text on both tool and assistant records.

## Consequences

A failing call — or any user, context, system, or assistant record — now travels to a bug report or a follow-up prompt as one paste. The cost is two small projections that must stay honest as `ToolCallBlock` and `TrajectoryCellProps` evolve; both sit beside the models they serialize, and the unit tests name every field they emit.
