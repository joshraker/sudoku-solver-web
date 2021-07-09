import { ProblemSolver, VariableTest } from './problem-solver';

export class SimpleSolver<T> extends ProblemSolver<T> {
  chooseTestVariableAndValues(): VariableTest<T> {
    const variable = this.problem.variables.find((variable) => variable.value == null);

    if (!variable) {
      throw Error('All variables have been solved for');
    }

    return { testVariable: variable, testValues: Array.from(variable.domain) };
  }
}
