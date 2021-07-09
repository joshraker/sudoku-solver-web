import { BinaryConstraint } from './binary-constraint';
import { ConstraintViolationException } from './constraint-violation-exception';
import { GlobalConstraint } from './global-constraint';

export interface VariableParams<T> {
  value?: T | null;
  domain?: Set<T>;
  description?: string;
}

export class Variable<T> {
  private _value: T | null;
  get value(): T | null {
    return this._value;
  }

  private _domain: Set<T>;
  get domain(): Set<T> {
    return this._domain;
  }

  description: string;

  get independentConstraints(): BinaryConstraint<T>[] {
    return this._independentConstraints;
  }

  get dependentConstraints(): BinaryConstraint<T>[] {
    return this._dependentConstraints;
  }

  get globalConstraints(): GlobalConstraint<T>[] {
    return this._globalConstraints;
  }

  private _independentConstraints: BinaryConstraint<T>[] = [];
  private _dependentConstraints: BinaryConstraint<T>[] = [];
  private _globalConstraints: GlobalConstraint<T>[] = [];

  constructor({ value = null, domain = new Set<T>(), description = 'Variable' }: VariableParams<T> = {}) {
    this._value = value;
    this._domain = domain;
    this.description = description;

    if (this.value) {
      this.update(this.value);
    }
  }

  setValue(value: T | null): void {
    // Sets the variable's value without updating constraints
    this._value = value;
  }

  setDomain(domain: Set<T>): void {
    // Sets the variable's domain
    this._domain = domain;
  }

  deleteDomainValue(value: T): boolean {
    const deleted = this.domain.delete(value);

    if (deleted && this.domain.size === 0) {
      // If we run out of possible values for the variable we have a problem.
      throw new ConstraintViolationException('No possible values for variable');
    }

    return deleted;
  }

  deleteDomainValues(...values: T[]): boolean {
    return values.reduce<boolean>((updated, value) => this.deleteDomainValue(value) || updated, false);
  }

  keepDomainValues(valuesToKeep: Set<T>): boolean {
    const newDomain = new Set<T>();

    for (const value of valuesToKeep) {
      if (this.domain.has(value)) {
        newDomain.add(value);
      }
    }

    const updated = this.domain.size !== newDomain.size;

    this.setDomain(newDomain);

    return updated;
  }

  update(value: T): void {
    this.setValue(value);

    this.domain.clear();

    for (const constraint of this.independentConstraints) {
      constraint.update();
    }
  }

  toString(): string {
    return `${this.description}: ${this.value == null ? `{ ${Array.from(this.domain).join(', ')} }` : this.value}`;
  }
}
