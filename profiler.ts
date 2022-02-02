import { Observable, Subject } from 'rxjs';
import { bufferTime, filter, map } from 'rxjs/operators';

export class Profiler {
  private static _instance: Profiler;
  private readonly records = new Map<string, number>();
  private readonly broadcast$ = new Subject<{ name: string; value: number }>();

  static get instance(): Profiler {
    if (!this._instance) {
      this._instance = new Profiler();
    }
    return this._instance;
  }

  constructor(public bufferTime = 500) {}

  begin(name: string) {
    this.records.set(name, performance.now());
  }

  end(name: string) {
    if (!this.records.has(name)) {
      return;
    }

    this.broadcast$.next({
      name,
      value: performance.now() - this.records.get(name),
    });
  }

  listen(name: string): Observable<number> {
    return this.broadcast$.pipe(
      filter((stream) => stream.name === name),
      map((stream) => stream.value),
      bufferTime(this.bufferTime),
      map((values: number[]) =>
        values.reduce((acc, curr) => acc + curr / values.length, 0.0)
      )
    );
  }
}
