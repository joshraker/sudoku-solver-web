import { BinaryConstraint } from './binary-constraint';
import { GlobalConstraint } from './global-constraint';
import { NotEqualConstraint } from './not-equal-constraint';
import { Variable } from './variable';

// [the value, all the variables that have the value in their domain]
type ValueSubset<T> = [T, Variable<T>[]];
// Map<the number of variables, the subsets with that number of variables]
type ValueSubsetMap<T> = Map<number, ValueSubset<T>[]>;
type SubsetResult<T> = { variables: Set<Variable<T>>; values: Set<T> };

export class AllDifferentConstraint<T> extends GlobalConstraint<T> {
  static generateCombinations<T>(size: number, array: T[]): T[][] {
    const combine = (currentCombo: T[], array: T[], depth = 2): T[][] => {
      if (depth > size) {
        return [currentCombo];
      }

      return array
        .slice(0, array.length - (size - depth))
        .flatMap((element, index) => combine(currentCombo.concat([element]), array.slice(index + 1), depth + 1));
    };

    return array
      .slice(0, array.length - size + 1)
      .flatMap((element, index) => combine([element], array.slice(index + 1)));
  }

  private _notEqualConstraints: BinaryConstraint<T>[] | undefined;

  get notEqualConstraints(): BinaryConstraint<T>[] | undefined {
    return this._notEqualConstraints;
  }

  get unsolvedVariables(): Variable<T>[] {
    return this.variables.filter((variable) => variable.value === null);
  }

  get valueSubsetMap(): ValueSubsetMap<T> {
    const valueMap = new Map<T, Variable<T>[]>();

    for (const variable of this.variables) {
      for (const value of variable.domain) {
        const variables = valueMap.get(value) || [];

        variables.push(variable);
        valueMap.set(value, variables);
      }
    }

    const map = new Map<number, ValueSubset<T>[]>();

    for (const [value, variables] of valueMap) {
      const subsetSize = variables.length;
      const subsets = map.get(subsetSize) || [];

      subsets.push([value, variables]);
      map.set(subsetSize, subsets);
    }

    return map;
  }

  get valueSubsets(): ValueSubset<T>[] {
    const valueSubsets = new Map<T, Variable<T>[]>();

    for (const variable of this.unsolvedVariables) {
      for (const value of variable.domain) {
        const variables = valueSubsets.get(value) || [];

        variables.push(variable);
        valueSubsets.set(value, variables);
      }
    }

    return Array.from(valueSubsets);
  }

  constructor(
    variables: Variable<T>[],
    { generateBinaryConstraints = true, description = 'AllDifferentConstraint' } = {}
  ) {
    super(variables, description);

    if (generateBinaryConstraints) {
      // There may be times when the not equal constraints already exist on the variables
      // In this case we want to skip generating the constraints here
      this.generateNotEqualConstraints();
    }
  }

  private generateNotEqualConstraints(): void {
    // generate the not equal binary constraints that compose the all different constraint
    this._notEqualConstraints = [];

    for (let i = 0; i < this.variables.length - 1; i++) {
      for (let j = i + 1; j < this.variables.length; j++) {
        // Create constraints in both directions
        this._notEqualConstraints.push(...NotEqualConstraint.create(this.variables[i], this.variables[j]));
      }
    }
  }

  findVisibleSubset(subsetSize: number): SubsetResult<T> | null {
    const validVariables = this.unsolvedVariables.filter((variable) => variable.domain.size <= subsetSize);

    for (const variableCombo of AllDifferentConstraint.generateCombinations(subsetSize, validVariables)) {
      const values: Set<T> = new Set();
      const variables: Set<Variable<T>> = new Set();

      for (const variable of variableCombo) {
        variables.add(variable);

        for (const value of variable.domain) {
          values.add(value);
        }
      }

      if (values.size === subsetSize) {
        // if the number of values is the same as the specified size of the subset we've found a visible subset

        // check if there are other variables that contain the values
        if (
          this.variables.some(
            (variable) => !variables.has(variable) && Array.from(values).some((value) => variable.domain.has(value))
          )
        ) {
          // if any variable not in the subset contains a value in the subset then the value can be removed
          // otherwise nothing has changed and we should continue looking for a visiblesubset

          // return the set of variables and values the make up the visible subset
          return { variables, values };
        }
      }
    }

    return null;
  }

  findHiddenSubset(subsetSize: number): SubsetResult<T> | null {
    const validSubsets = this.valueSubsets.filter(([value, variables]) => variables.length <= subsetSize);

    for (const subsetCombo of AllDifferentConstraint.generateCombinations(subsetSize, validSubsets)) {
      const values: Set<T> = new Set();
      const variables: Set<Variable<T>> = new Set();

      for (const [value, vars] of subsetCombo) {
        values.add(value);

        for (const variable of vars) {
          variables.add(variable);
        }
      }

      if (variables.size === subsetSize) {
        // if the number of variables is the same as the specified subset size we've found a hidden subset

        // check that the variables contain other values
        if (Array.from(variables).some((variable) => Array.from(variable.domain).some((value) => !values.has(value)))) {
          // if any of the variables contains a value that isn't in the subset then the value can be removed
          // otherwise nothing has changed and we need to keep looking for a hidden subset

          // return the variables and values that make up the hidden subset
          return { variables, values };
        }
      }
    }

    return null;
  }
}
