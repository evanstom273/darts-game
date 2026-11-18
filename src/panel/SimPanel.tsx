import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ATTR_LABEL, ATTRS } from '../engine/players';
import { daySpread, type Match, type MatchSetup, type Side } from '../engine/match';
import { randomSeed } from '../engine/rng';
import type { InRule, OutRule, Play, Stage } from '../engine/rules';
import { parseMatchRow } from '../sim/csv';
import {
  LEGS_BEST_OF_OPTIONS,
  SET_LEGS_OPTIONS,
  SETS_BEST_OF_OPTIONS,
  START_OPTIONS,
  type Choice,
  type PlayerSetup,
  type Setup,
} from '../sim/setup';
import type { WorkerMessage, WorkerRequest } from '../sim/worker';

const STAGE_LABEL: Record<Stage, string> = { floor: 'Floor', tv: 'TV', final: 'Major final' };
const IN_LABEL: Record<InRule, string> = { straight: 'Straight in', double: 'Double in' };
const OUT_LABEL: Record<OutRule, string> = { double: 'Double out', master: 'Master out', straight: 'Straight out' };

type Batch =
  | { state: 'idle' }
  | { state: 'running'; done: number; total: number }
  | { state: 'done'; matchesCsv: string; legsCsv: string | null; matches: number; ms: number; seed: number; cancelled: boolean };

type SaveResult = 'saved' | 'shared' | 'downloaded' | 'cancelled' | 'failed';

type SavePicker = (opts: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }> }>;

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError';

/**
 * Save a CSV. Opens the system file picker where the browser has one (Chrome, including on Android),
 * so you choose where it goes; otherwise the share sheet; otherwise a plain download.
 */
async function saveCsv(name: string, text: string): Promise<SaveResult> {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (typeof picker === 'function') {
    try {
      const handle = await picker({ suggestedName: name, types: [{ description: 'CSV file', accept: { 'text/csv': ['.csv'] } }] });
      const out = await handle.createWritable();
      await out.write(text);
      await out.close();
      return 'saved';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      // Fall through to the other ways.
    }
  }
  const file = new File([text], name, { type: 'text/csv' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
    }
  }
  try {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

const SAVE_MESSAGE: Record<SaveResult, string> = {
  saved: 'Saved.',
  shared: 'Shared.',
  downloaded: 'Downloaded.',
  cancelled: 'Not saved.',
  failed: "Couldn't save the file.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-num text-[15px] font-bold uppercase tracking-[.08em] text-ink">{title}</h2>
      {children}
    </section>
  );
}

function RandomToggle({ on, onChange, id }: { on: boolean; onChange: (on: boolean) => void; id: string }) {
  return (
    <label htmlFor={id} className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted select-none">
      <input id={id} type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-gold" />
      Random
    </label>
  );
}

function Seg<T extends string | number>({
  value,
  options,
  label,
  disabled,
  onChange,
}: {
  value: T;
  options: readonly T[];
  label: (v: T) => string;
  disabled?: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div className={`flex flex-wrap ${disabled ? 'opacity-40' : ''}`} role="group">
      {options.map((o, i) => (
        <button
          key={String(o)}
          type="button"
          disabled={disabled}
          aria-pressed={o === value}
          onClick={() => onChange(o)}
          className={`-ml-px h-9 border border-line px-3 text-sm font-semibold first:ml-0 ${i === 0 ? 'rounded-l-md' : ''} ${
            i === options.length - 1 ? 'rounded-r-md' : ''
          } ${o === value ? 'relative border-gold bg-gold text-gold-ink' : 'bg-surface-2 text-ink'}`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children, random }: { label: string; children: ReactNode; random?: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-3">
      <span className="w-24 shrink-0 text-[13px] font-semibold text-muted">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      {random}
    </div>
  );
}

function ChoiceRow<T extends string | number>({
  id,
  label,
  choice,
  options,
  show,
  onChange,
}: {
  id: string;
  label: string;
  choice: Choice<T>;
  options: readonly T[];
  show: (v: T) => string;
  onChange: (c: Choice<T>) => void;
}) {
  return (
    <Row
      label={label}
      random={<RandomToggle id={id} on={choice.random} onChange={(random) => onChange({ ...choice, random })} />}
    >
      <Seg value={choice.value} options={options} label={show} disabled={choice.random} onChange={(value) => onChange({ ...choice, value })} />
    </Row>
  );
}

function SelectRow({
  id,
  label,
  choice,
  options,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  choice: Choice<number>;
  options: readonly number[];
  suffix: string;
  onChange: (c: Choice<number>) => void;
}) {
  return (
    <Row label={label} random={<RandomToggle id={`${id}-r`} on={choice.random} onChange={(random) => onChange({ ...choice, random })} />}>
      <span className="text-sm text-muted">Best of</span>
      <select
        id={id}
        value={choice.value}
        disabled={choice.random}
        onChange={(e) => onChange({ ...choice, value: Number(e.target.value) })}
        className="h-9 rounded-md border border-line bg-surface-2 px-2 font-num text-[15px] font-semibold disabled:opacity-40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted">{suffix}</span>
    </Row>
  );
}

function Slider({
  id,
  label,
  choice,
  min,
  max,
  onChange,
  show = (v: number) => String(v),
}: {
  id: string;
  label: string;
  choice: Choice<number>;
  min: number;
  max: number;
  onChange: (c: Choice<number>) => void;
  show?: (v: number) => string;
}) {
  return (
    <Row label={label} random={<RandomToggle id={`${id}-r`} on={choice.random} onChange={(random) => onChange({ ...choice, random })} />}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={choice.value}
        disabled={choice.random}
        onChange={(e) => onChange({ ...choice, value: Number(e.target.value) })}
        className="min-w-0 flex-1 accent-gold disabled:opacity-40"
        aria-label={label}
      />
      <span className={`w-8 text-right font-num text-[17px] font-semibold tabular-nums ${choice.random ? 'text-muted' : ''}`}>
        {choice.random ? '?' : show(choice.value)}
      </span>
    </Row>
  );
}

function PlayerCard({ p, ps, onChange }: { p: Side; ps: PlayerSetup; onChange: (ps: PlayerSetup) => void }) {
  const allRandom = ATTRS.every((k) => ps.attrs[k].random) && ps.form.random;
  const setAll = (random: boolean) =>
    onChange({
      ...ps,
      attrs: Object.fromEntries(ATTRS.map((k) => [k, { ...ps.attrs[k], random }])) as PlayerSetup['attrs'],
      form: { ...ps.form, random },
    });
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-line bg-surface p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className={`h-5 w-1 rounded-sm ${p === 0 ? 'bg-p0' : 'bg-p1'}`} />
        <input
          id={`name-${p}`}
          value={ps.name}
          onChange={(e) => onChange({ ...ps, name: e.target.value })}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 font-num text-[17px] font-bold uppercase tracking-wide hover:border-line focus:border-line"
          aria-label={`Player ${p + 1} name`}
        />
        <button
          type="button"
          onClick={() => setAll(!allRandom)}
          className="h-8 shrink-0 rounded-md border border-line bg-surface-2 px-2 text-xs font-semibold"
        >
          {allRandom ? 'Set by hand' : 'All random'}
        </button>
      </div>
      {ATTRS.map((k) => (
        <Slider
          key={k}
          id={`p${p}-${k}`}
          label={ATTR_LABEL[k]}
          choice={ps.attrs[k]}
          min={1}
          max={20}
          onChange={(c) => onChange({ ...ps, attrs: { ...ps.attrs, [k]: c } })}
        />
      ))}
      <Slider
        id={`p${p}-form`}
        label="Form"
        choice={ps.form}
        min={-5}
        max={5}
        show={(v) => (v > 0 ? `+${v}` : String(v))}
        onChange={(form) => onChange({ ...ps, form })}
      />
    </div>
  );
}

export function describeSetup(s: MatchSetup): string {
  const f = s.format;
  const length = f.play === 'sets' ? `Best of ${f.bestOfSets} sets (legs best of ${f.bestOfLegs})` : `Best of ${f.bestOfLegs} legs`;
  return `${length} · ${f.startScore} · ${IN_LABEL[f.inRule].toLowerCase()}, ${OUT_LABEL[f.outRule].toLowerCase()} · ${STAGE_LABEL[s.stage]}`;
}

interface Props {
  open: boolean;
  setup: Setup;
  match: Match;
  onChange: (s: Setup) => void;
  onWatch: (s: MatchSetup) => void;
  onWatchNew: () => void;
  onClose: () => void;
}

export function SimPanel({ open, setup, match, onChange, onWatch, onWatchNew, onClose }: Props) {
  const [count, setCount] = useState(1000);
  const [perLeg, setPerLeg] = useState(false);
  const [seedText, setSeedText] = useState('');
  const [batch, setBatch] = useState<Batch>({ state: 'idle' });
  const [replayText, setReplayText] = useState('');
  const [replayError, setReplayError] = useState('');
  const [saveNote, setSaveNote] = useState('');
  const save = (name: string, text: string) => {
    setSaveNote('');
    void saveCsv(name, text).then((r) => setSaveNote(SAVE_MESSAGE[r]));
  };
  const worker = useRef<Worker | null>(null);
  const runSeed = useRef(0);
  const f = setup.format;
  const set = (patch: Partial<Setup['format']>) => onChange({ ...setup, format: { ...f, ...patch } });

  useEffect(() => () => worker.current?.terminate(), []);

  const run = () => {
    worker.current?.terminate();
    const total = Math.max(1, Math.min(100_000, Math.floor(count) || 1));
    const typed = seedText.trim() === '' ? NaN : Number(seedText.trim());
    const batchSeed = Number.isFinite(typed) ? typed >>> 0 : randomSeed();
    runSeed.current = batchSeed;
    const w = new Worker(new URL('../sim/worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    setBatch({ state: 'running', done: 0, total });
    w.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'progress') setBatch({ state: 'running', done: msg.done, total });
      else {
        setBatch({ state: 'done', ...msg, seed: batchSeed, cancelled: false });
        w.terminate();
        worker.current = null;
      }
    };
    const req: WorkerRequest = { setup, opts: { count: total, batchSeed, perLeg } };
    w.postMessage(req);
  };

  const cancel = () => {
    worker.current?.terminate();
    worker.current = null;
    setBatch({ state: 'idle' });
  };

  const replay = () => {
    const s = parseMatchRow(replayText, [setup.players[0].name, setup.players[1].name]);
    if (!s) {
      setReplayError("That isn't a row from a matches CSV made by this version. Paste one whole data row (not the header).");
      return;
    }
    setReplayError('');
    onWatch(s);
    onClose();
  };

  const playersNow = match.players;

  return (
    <div
      hidden={!open}
      className="fixed inset-0 z-50 overflow-y-auto bg-stage"
      role="dialog"
      aria-modal="true"
      aria-label="Simulate"
      data-testid="sim-panel"
    >
      <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-[max(16px,env(safe-area-inset-left,0px))] pt-[max(12px,env(safe-area-inset-top,0px))] pb-16">
        <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-stage/95 px-4 py-2 backdrop-blur">
          <h1 className="font-num text-[19px] font-bold uppercase tracking-[.06em]">Simulate</h1>
          <span className="flex-1" />
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-line bg-surface-2 px-3 text-sm font-semibold">
            Back to the match
          </button>
        </div>

        <p className="max-w-[68ch] text-[13px] leading-relaxed text-muted">
          These settings are used for the watched match and for batches. Anything set to Random is rolled fresh for every match.
        </p>

        <Section title="Players">
          <div className="grid gap-3 min-[700px]:grid-cols-2">
            {([0, 1] as Side[]).map((p) => (
              <PlayerCard
                key={p}
                p={p}
                ps={setup.players[p]}
                onChange={(ps) => {
                  const players = [...setup.players] as Setup['players'];
                  players[p] = ps;
                  onChange({ ...setup, players });
                }}
              />
            ))}
          </div>
        </Section>

        <Section title="Match">
          <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-3">
            <ChoiceRow<Play>
              id="play"
              label="Play"
              choice={f.play}
              options={['legs', 'sets']}
              show={(v) => (v === 'legs' ? 'Legs' : 'Sets')}
              onChange={(play) => set({ play })}
            />
            {(f.play.random || f.play.value === 'legs') && (
              <SelectRow id="legs" label="Legs match" choice={f.legsBestOf} options={LEGS_BEST_OF_OPTIONS} suffix="legs" onChange={(legsBestOf) => set({ legsBestOf })} />
            )}
            {(f.play.random || f.play.value === 'sets') && (
              <>
                <SelectRow id="sets" label="Sets match" choice={f.setsBestOf} options={SETS_BEST_OF_OPTIONS} suffix="sets" onChange={(setsBestOf) => set({ setsBestOf })} />
                <SelectRow
                  id="setlegs"
                  label="Each set"
                  choice={f.setLegsBestOf}
                  options={SET_LEGS_OPTIONS}
                  suffix="legs"
                  onChange={(setLegsBestOf) => set({ setLegsBestOf })}
                />
              </>
            )}
            <ChoiceRow<number> id="start" label="Start" choice={f.startScore} options={START_OPTIONS} show={String} onChange={(startScore) => set({ startScore })} />
            <ChoiceRow<InRule>
              id="in"
              label="In"
              choice={f.inRule}
              options={['straight', 'double']}
              show={(v) => (v === 'straight' ? 'Straight' : 'Double')}
              onChange={(inRule) => set({ inRule })}
            />
            <ChoiceRow<OutRule>
              id="out"
              label="Out"
              choice={f.outRule}
              options={['double', 'master', 'straight']}
              show={(v) => OUT_LABEL[v].split(' ')[0]}
              onChange={(outRule) => set({ outRule })}
            />
            <ChoiceRow<Stage>
              id="stage"
              label="Stage"
              choice={setup.stage}
              options={['floor', 'tv', 'final']}
              show={(v) => STAGE_LABEL[v]}
              onChange={(stage) => onChange({ ...setup, stage })}
            />
          </div>
        </Section>

        <Section title="Watch">
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3">
            <div className="text-[13px] leading-relaxed">
              <div className="font-semibold">The match on screen</div>
              <div className="text-muted">{describeSetup(match)}</div>
              {([0, 1] as Side[]).map((p) => (
                <div key={p} className="font-num text-[15px] tabular-nums">
                  <span className={p === 0 ? 'text-p0' : 'text-p1'}>■</span> {playersNow[p].name}:{' '}
                  {ATTRS.map((k) => `${ATTR_LABEL[k]} ${playersNow[p].attrs[k]}`).join(' · ')} · Form{' '}
                  {playersNow[p].form > 0 ? `+${playersNow[p].form}` : playersNow[p].form} · On the day ×{daySpread(match, p).toFixed(2)} spread
                </div>
              ))}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  onWatchNew();
                  onClose();
                }}
                className="h-9 rounded-md border border-gold bg-gold px-3 text-sm font-semibold text-gold-ink"
              >
                Watch a new match with these settings
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="replay" className="text-[13px] font-semibold">
                Replay a match from a CSV
              </label>
              <textarea
                id="replay"
                rows={2}
                value={replayText}
                onChange={(e) => setReplayText(e.target.value)}
                placeholder="Paste one row from a matches CSV to watch that exact match"
                className="w-full rounded-md border border-line bg-surface-2 p-2 font-mono text-xs"
              />
              {replayError && <p className="text-[13px] text-[#ff8a75]">{replayError}</p>}
              <div>
                <button
                  type="button"
                  onClick={replay}
                  disabled={!replayText.trim()}
                  className="h-9 rounded-md border border-line bg-surface-2 px-3 text-sm font-semibold disabled:opacity-40"
                >
                  Watch this match
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Batch">
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3">
            <Row label="Matches">
              <input
                id="count"
                type="number"
                inputMode="numeric"
                min={1}
                max={100000}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="h-9 w-28 rounded-md border border-line bg-surface-2 px-2 font-num text-[16px] font-semibold tabular-nums"
              />
              <div className="flex flex-wrap gap-1">
                {[1000, 3000, 10000].map((n) => (
                  <button key={n} type="button" onClick={() => setCount(n)} className="h-8 rounded-md border border-line bg-surface-2 px-2 text-xs font-semibold">
                    {n.toLocaleString('en-GB')}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Batch seed">
              <input
                id="seed"
                value={seedText}
                onChange={(e) => setSeedText(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Blank for a new one"
                inputMode="numeric"
                className="h-9 w-40 rounded-md border border-line bg-surface-2 px-2 font-num text-[16px] tabular-nums"
              />
            </Row>
            <label htmlFor="perleg" className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold select-none">
              <input id="perleg" type="checkbox" checked={perLeg} onChange={(e) => setPerLeg(e.target.checked)} className="size-4 accent-gold" />
              Also save a legs CSV (one row per leg)
            </label>
            {batch.state === 'running' ? (
              <div className="flex flex-col gap-2" data-testid="batch-progress">
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-gold transition-[width]" style={{ width: `${(batch.done / batch.total) * 100}%` }} />
                </div>
                <div className="flex items-center gap-3 text-[13px] tabular-nums">
                  <span>
                    {batch.done.toLocaleString('en-GB')} of {batch.total.toLocaleString('en-GB')} matches
                  </span>
                  <span className="flex-1" />
                  <button type="button" onClick={cancel} className="h-8 rounded-md border border-line bg-surface-2 px-3 text-xs font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button type="button" onClick={run} className="h-10 rounded-md border border-gold bg-gold px-4 text-sm font-semibold text-gold-ink">
                  Run {Math.max(1, Math.floor(count) || 1).toLocaleString('en-GB')} matches
                </button>
              </div>
            )}
            {batch.state === 'done' && (
              <div className="flex flex-col gap-2 border-t border-line pt-3" data-testid="batch-done">
                <p className="text-[13px] tabular-nums">
                  {batch.matches.toLocaleString('en-GB')} matches in {(batch.ms / 1000).toFixed(1)} s · batch seed {batch.seed}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => save(`darts-matches-${batch.matches}-${batch.seed}.csv`, batch.matchesCsv)}
                    className="h-9 rounded-md border border-gold bg-gold px-3 text-sm font-semibold text-gold-ink"
                  >
                    Save matches CSV
                  </button>
                  {batch.legsCsv && (
                    <button
                      type="button"
                      onClick={() => save(`darts-legs-${batch.matches}-${batch.seed}.csv`, batch.legsCsv!)}
                      className="h-9 rounded-md border border-line bg-surface-2 px-3 text-sm font-semibold"
                    >
                      Save legs CSV
                    </button>
                  )}
                </div>
                {saveNote && (
                  <p className="text-[13px] text-muted" role="status" data-testid="save-note">
                    {saveNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
