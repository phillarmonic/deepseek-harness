// @vitest-environment jsdom
/**
 * TrajectoryCell presentation: kind tags, ellipsis-hosting text, Message
 * metric columns, own-duration formatting, and selected ring.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import {
  formatElapsedSeconds as formatElapsedSecondsWithLocale,
  TrajectoryCell as LocalizedTrajectoryCell,
  type TrajectoryCellKind,
} from '../src/client/TrajectoryCell.tsx'
import {
  formatDurationMillis as formatDurationMillisWithLocale, serializeTrajectoryRecord,
} from '../src/client/trajectory-record.ts'
import { t } from './locale.client.ts'

const formatDurationMillis = (value: number | null) => formatDurationMillisWithLocale(value, t)
const formatElapsedSeconds = (value: number | null) => formatElapsedSecondsWithLocale(value, t)

function TrajectoryCell(props: Omit<ComponentProps<typeof LocalizedTrajectoryCell>, 't'>) {
  return <LocalizedTrajectoryCell {...props} t={t} />
}

afterEach(cleanup)

describe('serializeTrajectoryRecord', () => {
  it('serializes a tool record with every detail it carries', () => {
    expect(JSON.parse(serializeTrajectoryRecord({
      index: 2,
      kind: 'tool',
      text: 'bash · {"command":"pwd"}',
      callId: 'call-1',
      isError: true,
      startedAt: 1_000,
      timeSeconds: 0.2,
      inputDetail: '{"command":"pwd"}',
      outputDetail: 'ToolError: non_zero_exit',
      schemaDetail: '{"name":"bash"}',
    }))).toEqual({
      kind: 'tool',
      summary: 'bash · {"command":"pwd"}',
      startedAt: 1_000,
      durationSeconds: 0.2,
      source: null,
      input: '{"command":"pwd"}',
      output: 'ToolError: non_zero_exit',
      thinking: null,
      prompt: null,
      callId: 'call-1',
      isError: true,
      schema: '{"name":"bash"}',
    })
  })

  it('fills absent optional details with null and defaults isError to false', () => {
    expect(JSON.parse(serializeTrajectoryRecord({
      index: 3, kind: 'subtool', text: 'read · src/a.ts', timeSeconds: null,
    }))).toEqual({
      kind: 'subtool',
      summary: 'read · src/a.ts',
      startedAt: null,
      durationSeconds: null,
      source: null,
      input: null,
      output: null,
      thinking: null,
      prompt: null,
      callId: null,
      isError: false,
      schema: null,
    })
  })

  it('serializes a user record with its producer source and no tool-only fields', () => {
    expect(JSON.parse(serializeTrajectoryRecord({
      index: 1,
      kind: 'user',
      text: 'Refactor the lint findings.',
      timeSeconds: null,
      inputDetail: 'Refactor the lint findings.\nUse batch edits.',
      messageSource: { role: 'user', name: 'andy' },
    }))).toEqual({
      kind: 'user',
      summary: 'Refactor the lint findings.',
      startedAt: null,
      durationSeconds: null,
      source: { role: 'user', name: 'andy' },
      input: 'Refactor the lint findings.\nUse batch edits.',
      output: null,
      thinking: null,
      prompt: null,
    })
  })

  it('serializes an assistant record with its output and thinking details', () => {
    expect(JSON.parse(serializeTrajectoryRecord({
      index: 4,
      kind: 'message',
      text: 'Done.',
      timeSeconds: 1.5,
      startedAt: 2_000,
      outputDetail: 'Done. Applied 12 fixes.',
      thinkingDetail: 'Plan the batch order.',
    }))).toEqual({
      kind: 'message',
      summary: 'Done.',
      startedAt: 2_000,
      durationSeconds: 1.5,
      source: null,
      input: null,
      output: 'Done. Applied 12 fixes.',
      thinking: 'Plan the batch order.',
      prompt: null,
    })
  })

  it('serializes a system record with its prompt snapshot', () => {
    expect(JSON.parse(serializeTrajectoryRecord({
      index: 0,
      kind: 'system',
      text: 'Initial System Prompt',
      timeSeconds: null,
      promptDetail: {
        config: { provider: 'deepseek', model: 'deepseek-chat' },
        system: 'You are an agent.',
        tools: [],
      },
    }))).toEqual({
      kind: 'system',
      summary: 'Initial System Prompt',
      startedAt: null,
      durationSeconds: null,
      source: null,
      input: null,
      output: null,
      thinking: null,
      prompt: {
        config: { provider: 'deepseek', model: 'deepseek-chat' },
        system: 'You are an agent.',
        tools: [],
      },
    })
  })
})

describe('formatDurationMillis', () => {
  it('formats exact millisecond labels with thousands separators', () => {
    expect(formatDurationMillis(0)).toBe('0 ms')
    expect(formatDurationMillis(29)).toBe('29 ms')
    expect(formatDurationMillis(500)).toBe('500 ms')
    expect(formatDurationMillis(1_500)).toBe('1,500 ms')
    expect(formatDurationMillis(235_200)).toBe('235,200 ms')
    expect(formatDurationMillis(null)).toBe('—')
    expect(formatDurationMillis(Number.NaN)).toBe('—')
  })
})

describe('formatElapsedSeconds', () => {
  it('formats known durations and uses an em dash when absent', () => {
    expect(formatElapsedSeconds(null)).toBe('—')
    expect(formatElapsedSeconds(235)).toBe('235,000 ms')
    expect(formatElapsedSeconds(235.0)).toBe('235,000 ms')
    expect(formatElapsedSeconds(235.2)).toBe('235,200 ms')
    expect(formatElapsedSeconds(235.25)).toBe('235,250 ms')
    expect(formatElapsedSeconds(0)).toBe('0 ms')
    expect(formatElapsedSeconds(0.029)).toBe('29 ms')
    expect(formatElapsedSeconds(0.5)).toBe('500 ms')
    expect(formatElapsedSeconds(1.5)).toBe('1,500 ms')
    expect(formatElapsedSeconds(Number.NaN)).toBe('—')
  })
})

describe('TrajectoryCell', () => {
  it('renders index, kind tag, text, and time for a Tool row', () => {
    render(
      <TrajectoryCell
        index={6}
        kind="tool"
        text="bash · Read src/index.ts"
        timeSeconds={5}
      />,
    )
    expect(screen.getByText('#6')).toBeTruthy()
    expect(screen.getByText('TOOL')).toBeTruthy()
    expect(screen.getByText('bash · Read src/index.ts')).toBeTruthy()
    expect(screen.getByText('5,000 ms')).toBeTruthy()
  })

  it('Message rows expose Input / Output / Think metric columns before time', () => {
    const { container } = render(
      <TrajectoryCell
        index={3}
        kind="message"
        text="Let me now read the actual source files to understa..."
        timeSeconds={235.2}
        input={136}
        output={381}
        think={155}
      />,
    )
    expect(screen.getByText('Message')).toBeTruthy()
    expect(screen.getByText('136')).toBeTruthy()
    expect(screen.getByText('381')).toBeTruthy()
    expect(screen.getByText('155')).toBeTruthy()
    expect(screen.getByText('235,200 ms')).toBeTruthy()
    const texts = [...container.querySelectorAll('span')].map(el => el.textContent)
    expect(texts.indexOf('136')).toBeLessThan(texts.indexOf('381'))
    expect(texts.indexOf('381')).toBeLessThan(texts.indexOf('155'))
    expect(texts.indexOf('155')).toBeLessThan(texts.indexOf('235,200 ms'))
  })

  it('selected marks the row for the brand-primary inset ring', () => {
    const { container } = render(
      <TrajectoryCell index={15} kind="message" text="pictur..." timeSeconds={123.6} selected />,
    )
    expect(container.firstElementChild?.getAttribute('data-selected')).toBe('true')
  })

  it.each([
    ['user', 'USER'],
    ['tool', 'TOOL'],
  ] as const)('kind %s shows the %s tag and no metric columns', (kind: TrajectoryCellKind, label: string) => {
    const { container } = render(
      <TrajectoryCell index={1} kind={kind} text="summary" timeSeconds={kind === 'user' ? 0 : null} input={1} output={2} think={3} />,
    )
    expect(screen.getByText(label)).toBeTruthy()
    expect(container.querySelector('[data-kind]')?.getAttribute('data-kind')).toBe(kind)
    expect(screen.queryByText('1')).toBeNull()
    expect(screen.queryByText('2')).toBeNull()
    expect(screen.queryByText('3')).toBeNull()
  })
})
