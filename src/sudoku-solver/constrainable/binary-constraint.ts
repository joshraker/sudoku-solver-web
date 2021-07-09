import { Variable } from './variable';

export abstract class BinaryConstraint<T> {
  get independent(): Variable<T> {
    return this._independent;
  }

  get dependent(): Variable<T> {
    return this._dependent;
  }

  protected constructor(private _independent: Variable<T>, private _dependent: Variable<T>) {
    this.independent.independentConstraints.push(this);
    this.dependent.dependentConstraints.push(this);

    this.update();
  }

  abstract update(): void;
  abstract createBidirectionalConstraint(): BinaryConstraint<T>;
}
