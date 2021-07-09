import { Variable } from './variable';

export class GlobalConstraint<T> {
  get variables(): Variable<T>[] {
    return this._variables;
  }

  constructor(private _variables: Variable<T>[], public description = 'GlobalConstraint') {
    for (const variable of this.variables) {
      variable.globalConstraints.push(this);
    }
  }

  toString(): string {
    return this.description;
  }
}
