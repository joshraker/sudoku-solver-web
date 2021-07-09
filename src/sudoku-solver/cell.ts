import { Variable } from './constrainable';

export interface CellParams {
  value?: number | null;
  row: number;
  column: number;
}

export class Cell extends Variable<number> {
  static DOMAIN_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  row: number;
  column: number;

  constructor({ value = null, row, column }: CellParams) {
    super({
      value: value,
      domain: new Set(Cell.DOMAIN_VALUES),
      description: `Cell (${row}, ${column})`
    });

    this.row = row;
    this.column = column;
  }
}
