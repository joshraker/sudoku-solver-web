import { BinaryConstraint } from './binary-constraint';
import { ConstraintViolationException } from './constraint-violation-exception';
import { Variable } from './variable';

export class NotEqualConstraint<T> extends BinaryConstraint<T> {
  static create<T>(var1: Variable<T>, var2: Variable<T>): [NotEqualConstraint<T>, NotEqualConstraint<T>] {
    const constraint = new NotEqualConstraint<T>(var1, var2);
    return [constraint, constraint.createBidirectionalConstraint()];
  }

  update(): void {
    const value = this.independent.value;

    if (value != null) {
      if (this.dependent.value === value) {
        throw new ConstraintViolationException('NotEqualConstraint violated');
      }

      this.dependent.deleteDomainValue(value);
    }
  }

  createBidirectionalConstraint(): NotEqualConstraint<T> {
    return new NotEqualConstraint(this.dependent, this.independent);
  }
}
