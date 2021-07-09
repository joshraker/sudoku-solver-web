import { Cell } from './cell';
import { AllDifferentConstraint, NotEqualConstraint, Problem } from './constrainable';

export class Sudoku extends Problem<number> {
  static BOARD_SIZE = 81;
  static GROUP_SIZE = 9;
  static SQUARE_SIZE = 3;

  get variables(): Cell[] {
    return this._variables as Cell[];
  }

  private _allDifferentConstraints: AllDifferentConstraint<number>[];

  get allDifferentConstraints(): AllDifferentConstraint<number>[] {
    return this._allDifferentConstraints;
  }

  constructor(values: (number | null)[]) {
    if (values.length !== Sudoku.BOARD_SIZE) {
      throw new Error(`Wrong number of values for Sudoku. Expected ${Sudoku.BOARD_SIZE} but got ${values.length}.`);
    }

    super(
      values.map(
        (value, index) =>
          new Cell({
            value: value || null,
            row: Math.floor(index / Sudoku.GROUP_SIZE),
            column: index % Sudoku.GROUP_SIZE
          })
      )
    );

    const rows: Cell[][] = new Array(Sudoku.GROUP_SIZE).fill(null).map(() => []);
    const columns: Cell[][] = new Array(Sudoku.GROUP_SIZE).fill(null).map(() => []);
    const squares: Cell[][] = new Array(Sudoku.GROUP_SIZE).fill(null).map(() => []);

    this.variables.forEach((cell) => {
      const square: number =
        Math.floor(cell.row / Sudoku.SQUARE_SIZE) * 3 + Math.floor(cell.column / Sudoku.SQUARE_SIZE);

      rows[cell.row].push(cell);
      columns[cell.column].push(cell);
      squares[square].push(cell);
    });

    // TODO consider creating constraints on squares then manually creating row and column NotEqualConstraints
    this._allDifferentConstraints = rows.map(
      (vars, index) => new AllDifferentConstraint(vars, { description: `Row ${index}` })
    );
    this._allDifferentConstraints.push(
      ...columns.map((vars, index) => new AllDifferentConstraint(vars, { description: `Column ${index}` }))
    );

    // NotEqualConstraints for squares must be created manually to avoid duplicates
    this._allDifferentConstraints.push(
      ...squares.map(
        (vars, index) =>
          new AllDifferentConstraint(vars, { generateBinaryConstraints: false, description: `Square ${index}` })
      )
    );

    for (const square of squares) {
      // We don't need to iterate over the last square row because all of the constrains will have been created for them
      for (let c1 = 0; c1 < Sudoku.GROUP_SIZE - Sudoku.SQUARE_SIZE; c1++) {
        const row1 = Math.floor(c1 / Sudoku.SQUARE_SIZE);
        const col1 = c1 % Sudoku.SQUARE_SIZE;

        // Start looking for potential cells on the following row since all previous rows have been completed
        // and we know that cells in the current square row already have constraints from the full row
        for (let c2 = (row1 + 1) * Sudoku.SQUARE_SIZE; c2 < square.length; c2++) {
          const col2 = c2 % Sudoku.SQUARE_SIZE;

          if (col1 === col2) {
            // Skip cells in the same square column since they already have constraints from the full column
            continue;
          }

          // Create constraints in both directions
          NotEqualConstraint.create(square[c1], square[c2]);
        }
      }
    }
  }

  print(): void {
    const squareRows: string[] = [];
    const rows: string[] = [];
    const rowGroups: string[] = [];
    const values: string[] = this.variables.map((variable) => (variable.value || '?').toString());

    while (values.length > 0) {
      squareRows.push(values.splice(0, Sudoku.SQUARE_SIZE).join(' │ '));
    }

    while (squareRows.length > 0) {
      rows.push(`║ ${squareRows.splice(0, Sudoku.SQUARE_SIZE).join(' ║ ')} ║`);
    }

    const lineRow = rows[0]
      .replace(/[^│║]/g, '─')
      .replace(/│/g, '┼')
      .replace(/║/g, '╫')
      .replace(/^./, '╟')
      .replace(/.$/, '╢');

    const boxLineRow = lineRow
      .replace(/─/g, '═')
      .replace(/[┼]/g, '╪')
      .replace(/[╫]/g, '╬')
      .replace(/╟/, '╠')
      .replace(/╢/, '╣');

    while (rows.length > 0) {
      rowGroups.push(rows.splice(0, Sudoku.SQUARE_SIZE).join(`\n${lineRow}\n`));
    }

    console.log(
      [
        boxLineRow.replace('╠', '╔').replace(/╪/g, '╤').replace(/╬/g, '╦').replace('╣', '╗'),
        rowGroups.join(`\n${boxLineRow}\n`),
        boxLineRow.replace('╠', '╚').replace(/╪/g, '╧').replace(/╬/g, '╩').replace('╣', '╝')
      ].join('\n')
    );
  }
}
