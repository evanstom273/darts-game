/// <reference lib="webworker" />
import { runBatch, type BatchOptions } from './batch';
import type { Setup } from './setup';

export type WorkerRequest = { setup: Setup; opts: BatchOptions };
export type WorkerMessage =
  | { type: 'progress'; done: number }
  | { type: 'done'; matchesCsv: string; legsCsv: string | null; matches: number; ms: number };

const ctx = self as unknown as {
  postMessage(m: WorkerMessage): void;
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
};

ctx.onmessage = (e) => {
  const { setup, opts } = e.data;
  const result = runBatch(setup, opts, (done) => ctx.postMessage({ type: 'progress', done }));
  ctx.postMessage({ type: 'done', ...result });
};
