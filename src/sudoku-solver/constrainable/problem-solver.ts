import { Problem } from './problem';
import { Variable } from './variable';

export interface VariableTest<T> {
  testVariable: Variable<T>;
  testValues: T[];
}

export class ProblemSolver<T> {
  static chooseFirstVariable<T>(problem: Problem<T>): VariableTest<T> {
    // Return the first unsolved variable
    const variable = problem.unsolvedVariables[0];

    if (!variable) {
      throw Error('All variables have been solved for');
    }

    return { testVariable: variable, testValues: Array.from(variable.domain) };
  }

  static chooseSmallestDomainVariable<T>(problem: Problem<T>): VariableTest<T> {
    const variable = problem.unsolvedVariables.reduce((prevVariable, currentVariable) =>
      currentVariable.domain.size < prevVariable.domain.size ? currentVariable : prevVariable
    );

    if (!variable) {
      throw Error('All variables have been solved for');
    }

    return { testVariable: variable, testValues: Array.from(variable.domain) };
  }

  private _testStack: VariableTest<T>[] = [];

  get testStack(): VariableTest<T>[] {
    return this._testStack;
  }

  get currentTest(): VariableTest<T> | undefined {
    return this.testStack[this.testStack.length - 1];
  }

  get solved(): boolean {
    return this.problem.unsolvedVariables.length === 0;
  }

  constructor(public problem: Problem<T>) {}

  saveState(): void {
    this.problem.saveState();
    this.testStack.push(this.chooseTestVariableAndValues());
  }

  popState(): void {
    this.problem.stateStack.pop();
    this.testStack.pop();
  }

  fillSolvedVariables(): boolean {
    let updated = false;

    for (const variable of this.problem.unsolvedVariables) {
      if (variable.domain.size === 1) {
        this.fillSolvedVariable(variable);
        updated = true;
      }
    }

    return updated;
  }

  fillSolvedVariable(variable: Variable<T>): void {
    variable.update(variable.domain.values().next().value);
  }

  beforeTest(): boolean {
    // this method should return true if it updates any variable values or domains
    return false;
  }

  rollbackTest(): void {
    // Pop back to the last test that still has values to test and restore the problem state
    while (this.currentTest?.testValues.length === 0) {
      this.popState();
    }

    if (!this.currentTest) {
      // If we exhaust all of the test values on the first variable
      throw new Error('The problem could not be solved, no more values to test');
    }

    this.problem.restoreState();
  }

  testVariable(): void {
    // Test the next value on the current test variable
    const { testVariable, testValues } = this.currentTest as VariableTest<T>;

    if (testValues.length === 0) {
      throw new Error('Variable has no more values to test');
    }

    testVariable.update(testValues.shift() as T);
  }

  solve(): void {
    while (!this.solved) {
      try {
        if (this.fillSolvedVariables()) {
          // Continue filling solved variables until there are none left
          continue;
        }

        if (this.beforeTest()) {
          // If beforeTest updated variables then we should continue to filling solved variables before testing values
          continue;
        }

        this.saveState();
        this.testVariable();
      } catch (e) {
        console.log(e);
        this.rollbackTest();
        this.testVariable();
      }
    }
  }

  chooseTestVariableAndValues(): VariableTest<T> {
    return ProblemSolver.chooseSmallestDomainVariable(this.problem);
  }
}
