import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullConfig, FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Playwright reporter that shows where the E2E time goes:
 * - slowest tests, time per spec file and how busy each worker was, printed to the console;
 * - the same as Markdown in the GitHub job summary (when `GITHUB_STEP_SUMMARY` is set);
 * - every test's duration as JSON (`test-results/e2e-timings.json`) to compare runs.
 * Durations include retries; a retried test is marked, so a flaky test can't hide as "slow".
 */

interface Attempt {
  duration: number;
  status: TestResult['status'];
  worker: number;
  start: number;
}

interface Row {
  project: string;
  file: string;
  title: string;
  duration: number;
  attempts: number;
  status: string;
}

const TOP = 15;
const JSON_FILE = 'test-results/e2e-timings.json';

export default class TimingReporter implements Reporter {
  private readonly attempts = new Map<TestCase, Attempt[]>();
  private rootDir = '';
  private startedAt = 0;
  private workers = 1;

  onBegin(config: FullConfig): void {
    this.rootDir = config.rootDir;
    this.workers = config.workers;
    this.startedAt = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const list = this.attempts.get(test) ?? [];
    list.push({
      duration: result.duration,
      status: result.status,
      worker: result.parallelIndex,
      start: result.startTime.getTime(),
    });
    this.attempts.set(test, list);
  }

  onEnd(result: FullResult): void {
    const wall = Date.now() - this.startedAt;
    const rows = this.rows().sort((a, b) => b.duration - a.duration);
    const ran = rows.filter((r) => r.status !== 'skipped');
    const files = this.files(ran);
    const workers = this.workerLoad(wall);

    console.log(this.text(ran, files, workers, wall));
    writeJson({ status: result.status, wallMs: wall, workers, files, tests: rows });

    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (summary) appendFileSync(summary, this.markdown(ran, files, workers, wall));
  }

  printsToStdio(): boolean {
    return true;
  }

  private rows(): Row[] {
    return [...this.attempts].map(([test, list]) => {
      const [, projectName = '', ...rest] = test.titlePath();
      const last = list[list.length - 1]!;
      return {
        project: test.parent.project()?.name ?? projectName,
        file: relative(test.location.file, this.rootDir),
        title: rest.slice(1).join(' › '),
        duration: list.reduce((sum, a) => sum + a.duration, 0),
        attempts: list.length,
        status: list.length > 1 && last.status === 'passed' ? 'flaky' : last.status,
      };
    });
  }

  private files(rows: Row[]): { file: string; tests: number; ms: number }[] {
    const byFile = new Map<string, { file: string; tests: number; ms: number }>();
    for (const r of rows) {
      const key = `[${r.project}] ${r.file}`;
      const entry = byFile.get(key) ?? { file: key, tests: 0, ms: 0 };
      entry.tests += 1;
      entry.ms += r.duration;
      byFile.set(key, entry);
    }
    return [...byFile.values()].sort((a, b) => b.ms - a.ms);
  }

  /** Busy time per worker slot: a large gap between workers means one file holds the run up. */
  private workerLoad(wall: number): { worker: number; tests: number; busyMs: number; busyShare: number }[] {
    const load = new Map<number, { worker: number; tests: number; busyMs: number; busyShare: number }>();
    for (const list of this.attempts.values()) {
      for (const a of list) {
        if (a.status === 'skipped') continue;
        const entry = load.get(a.worker) ?? { worker: a.worker, tests: 0, busyMs: 0, busyShare: 0 };
        entry.tests += 1;
        entry.busyMs += a.duration;
        load.set(a.worker, entry);
      }
    }
    for (const entry of load.values()) entry.busyShare = wall ? entry.busyMs / wall : 0;
    return [...load.values()].sort((a, b) => a.worker - b.worker);
  }

  private text(rows: Row[], files: ReturnType<TimingReporter['files']>, workers: ReturnType<TimingReporter['workerLoad']>, wall: number): string {
    const lines = [``, `E2E timings — ${rows.length} tests ran in ${fmt(wall)} on ${this.workers} worker(s)`];
    lines.push(``, `Slowest tests:`);
    for (const r of rows.slice(0, TOP)) lines.push(`  ${fmt(r.duration).padStart(7)}  [${r.project}] ${r.file} › ${r.title}${mark(r)}`);
    lines.push(``, `Time per spec file (sum of its tests):`);
    for (const f of files) lines.push(`  ${fmt(f.ms).padStart(7)}  ${f.file} (${f.tests})`);
    lines.push(``, `Workers:`);
    for (const w of workers) lines.push(`  #${w.worker}: busy ${fmt(w.busyMs)} (${pct(w.busyShare)} of the run), ${w.tests} tests`);
    return lines.join('\n');
  }

  private markdown(rows: Row[], files: ReturnType<TimingReporter['files']>, workers: ReturnType<TimingReporter['workerLoad']>, wall: number): string {
    const md = [`## E2E timings`, ``, `${rows.length} tests ran in **${fmt(wall)}** on ${this.workers} worker(s).`, ``];
    md.push(`| Worker | Busy | Share of the run | Tests |`, `|---|---|---|---|`);
    for (const w of workers) md.push(`| #${w.worker} | ${fmt(w.busyMs)} | ${pct(w.busyShare)} | ${w.tests} |`);
    md.push(``, `### Slowest ${Math.min(TOP, rows.length)} tests`, ``, `| Time | Project | Test |`, `|---|---|---|`);
    for (const r of rows.slice(0, TOP)) md.push(`| ${fmt(r.duration)} | ${r.project} | \`${r.file}\` › ${esc(r.title)}${mark(r)} |`);
    md.push(``, `### Time per spec file`, ``, `| Time | File | Tests |`, `|---|---|---|`);
    for (const f of files) md.push(`| ${fmt(f.ms)} | \`${f.file}\` | ${f.tests} |`);
    md.push(``, `<details><summary>All ${rows.length} tests</summary>`, ``, `| Time | Project | Test |`, `|---|---|---|`);
    for (const r of rows) md.push(`| ${fmt(r.duration)} | ${r.project} | \`${r.file}\` › ${esc(r.title)}${mark(r)} |`);
    md.push(``, `</details>`, ``);
    return md.join('\n');
  }
}

function writeJson(data: unknown): void {
  try {
    mkdirSync(dirname(JSON_FILE), { recursive: true });
    writeFileSync(JSON_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn(`Could not write ${JSON_FILE}:`, err);
  }
}

function relative(file: string, root: string): string {
  return file.startsWith(root) ? file.slice(root.length).replace(/^[/\\]/, '') : file;
}

function mark(r: Row): string {
  if (r.status === 'flaky') return ` (flaky, ${r.attempts} attempts)`;
  if (r.status !== 'passed') return ` (${r.status}${r.attempts > 1 ? `, ${r.attempts} attempts` : ''})`;
  return '';
}

function fmt(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  return `${m}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function esc(s: string): string {
  return s.replace(/\|/g, '\\|');
}
