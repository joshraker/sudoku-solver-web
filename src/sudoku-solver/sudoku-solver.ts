import { ProblemSolver, Variable, VariableTest } from './constrainable';
import { Logger } from './logger';
import { nullLogger } from './null-logger';
import { Sudoku } from './sudoku';

export class SudokuSolver extends ProblemSolver<number> {
  get logger(): Logger {
    return this.debug ? console : nullLogger;
  }

  constructor(public problem: Sudoku, public debug = false) {
    super(problem);
  }

  beforeTest(): boolean {
    // Find any hidden singles
    for (const constraint of this.problem.allDifferentConstraints) {
      const hiddenSingle = constraint.findHiddenSubset(1);

      if (hiddenSingle != null) {
        const variable = hiddenSingle.variables.values().next().value;
        const value = hiddenSingle.values.values().next().value;

        this.logger.log(`Found hidden single in ${constraint.toString()} ${variable.toString()}, ${value}`);

        variable.update(value);

        return true;
      }
    }

    // Look for visible (naked) and hidden subsets
    for (let subsetSize = 2; subsetSize < Sudoku.GROUP_SIZE; subsetSize++) {
      for (const constraint of this.problem.allDifferentConstraints) {
        const visibleSubset = constraint.findVisibleSubset(subsetSize);

        if (visibleSubset != null) {
          this.logger.log(
            `Found visible subset in ${constraint.toString()} [ ${Array.from(visibleSubset.variables)
              .map((v) => v.toString())
              .join(', ')} ] : { ${Array.from(visibleSubset.values).join(', ')} }`
          );

          for (const variable of constraint.unsolvedVariables) {
            if (visibleSubset.variables.has(variable)) {
              continue;
            }

            // this.logger.log(`Updating domain of ${variable.toString()}`);

            variable.deleteDomainValues(...visibleSubset.values);
          }

          return true;
        }

        const hiddenSubset = constraint.findHiddenSubset(subsetSize);

        if (hiddenSubset != null) {
          this.logger.log(
            `Found hidden subset in ${constraint.toString()} [ ${Array.from(hiddenSubset.variables)
              .map((v) => v.toString())
              .join(', ')} ] : { ${Array.from(hiddenSubset.values).join(', ')} }`
          );

          for (const variable of hiddenSubset.variables) {
            // this.logger.log(`Updating domain of ${variable.toString()}`);
            variable.keepDomainValues(hiddenSubset.values);
          }

          return true;
        }
      }
    }

    return false;
  }

  fillSolvedVariable(variable: Variable<number>): void {
    super.fillSolvedVariable(variable);
    this.logger.log(`Solved ${variable.toString()}`);
  }

  testVariable(): void {
    this.logger.log(`Trying value ${this.currentTest?.testValues[0]} on ${this.currentTest?.testVariable.toString()}`);
    super.testVariable();
  }

  rollbackTest(): void {
    this.logger.log(`Rolling back ${this.currentTest?.testVariable.toString()}`);
    super.rollbackTest();
  }

  popState(): void {
    super.popState();
    this.logger.log(`Rolling back ${this.currentTest?.testVariable.toString()}`);
  }

  chooseTestVariableAndValues(): VariableTest<number> {
    return ProblemSolver.chooseFirstVariable(this.problem);
  }
}
