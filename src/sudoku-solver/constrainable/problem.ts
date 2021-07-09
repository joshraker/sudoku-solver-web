import { ProblemState } from './problem-state';
import { Variable } from './variable';

export class Problem<T> {
  private _stateStack: ProblemState[] = [];

  get stateStack(): ProblemState[] {
    return this._stateStack;
  }

  get variables(): Variable<T>[] {
    return this._variables;
  }

  get unsolvedVariables(): Variable<T>[] {
    return this._variables.filter((variable) => variable.value === null);
  }

  get currentState(): ProblemState | undefined {
    return this._stateStack[this._stateStack.length - 1];
  }

  get variableValues(): (T | null)[] {
    return this._variables.map((variable) => variable.value);
  }

  private get variableDomains(): Set<T>[] {
    return this._variables.map((variable) => new Set<T>(variable.domain));
  }

  constructor(protected _variables: Variable<T>[]) {}

  saveState(/*testVariable: Variable<T>, orderedTestValues: T[]*/): void {
    this.stateStack.push(
      new ProblemState(/*testVariable, orderedTestValues,*/ this.variableValues, this.variableDomains)
    );
  }

  restoreState(): void {
    const state: ProblemState | undefined = this.currentState;

    if (!state) {
      // we can't restore if there's no saved state
      return;
    }

    this._variables.forEach((variable, index) => {
      variable.setValue(state.values[index]);
      variable.setDomain(new Set<T>(state.domains[index]));
    });
  }
}
