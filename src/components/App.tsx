import './App.css';

import React, { InputHTMLAttributes, useEffect, useState } from 'react';
import { Sudoku, SudokuSolver } from 'sudoku-solver';

const stringToInt = (element: string): number | null => (element === '' ? null : Number.parseInt(element));

function Cell({ className, ...props }: InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  return <input className={['cell', className].join(' ')} inputMode="numeric" {...props} />;
}

export default function App(): React.ReactElement {
  const children: React.ReactElement[] = [];
  const [values, setValues] = useState<string[]>(new Array(81).fill(''));
  const [originalValues, setOriginalValues] = useState<string[]>(values.slice());
  const [solved, setSolved] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  function focusCell(index = -1): void {
    // Select a cell by index
    const cell = document.getElementById(`cell-${index}`);

    if (cell) {
      cell.focus();
    } else {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  }

  function solve(): void {
    try {
      // Feed board values into sudoku solver
      const numberValues = values.map((value) => Number.parseInt(value) || null);
      const sudoku = new Sudoku(numberValues);
      const solver = new SudokuSolver(sudoku);

      // Assign solved values to the board
      solver.solve();
      setSolved(true);
      setOriginalValues(values.slice());
      setValues(sudoku.variables.map((variable) => variable.value?.toString() || ''));
    } catch (e) {
      // If there were any errors solving the puzzle notify the user
      setErrorText('Puzzle could not be solved');
    }
  }

  function reset(): void {
    // Reset the board to the values it had before solving
    setSolved(false);
    setValues(originalValues.slice());
  }

  function copy(): void {
    const zeroedValues = values.map((value) => (value === '' ? '0' : value));
    const lines: string[] = [];

    while (zeroedValues.length) {
      lines.push(zeroedValues.splice(0, 9).join(','));
    }

    navigator.clipboard.writeText(lines.join('\n'));
  }

  function clear(): void {
    // Clear the board
    setSolved(false);
    setValues(values.fill('').slice());
    setErrorText('');
    focusCell(0);
  }

  // Select the first cell on startup
  useEffect(() => focusCell(0), []);

  for (const [index, value] of values.entries()) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const cellClasses: string[] = [];

    // Horizontal square/border lines
    if (row === 0) {
      cellClasses.push('b-top');
    }

    if (row % 3 === 2) {
      cellClasses.push('b-bottom');
    }

    // Vertical square/border lines
    if (col === 0) {
      cellClasses.push('b-left');
    }

    if (col % 3 === 2) {
      cellClasses.push('b-right');
    }

    children.push(
      <Cell
        key={index}
        id={`cell-${index}`}
        className={cellClasses.join(' ')}
        value={value?.toString()}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          // Allow users to paste multiple values and assign
          const updatedValues = values.slice();
          const newValues = e.target.value
            .trim()
            .split(/\D/m)
            .map((entry) => (entry === '' ? entry : entry.split('')))
            .flat();
          let updated = false;

          for (const entry of newValues.entries()) {
            const valueIndex = index + entry[0];

            // Prevent users from adding more values than are necessary
            if (valueIndex >= values.length) {
              continue;
            }

            // Update the value
            const currentValue = values[valueIndex];
            let newValue = entry[1];

            if (newValue === '0') {
              newValue = '';
            }

            // If the value hasn't changed then skip this cell
            if (newValue === currentValue) {
              continue;
            }

            updatedValues[valueIndex] = newValue;
            updated = true;
          }

          // If any of the cell values have changed then update applicable variables
          if (updated) {
            setValues(updatedValues);
            setSolved(false);
            setErrorText('');
          }

          // Focus the next cell
          focusCell(index + Math.max(1, newValues.length));
        }}
      />
    );

    if (col === 8 && row !== 8) {
      // insert flex breaks at the end of rows
      children.push(<div key={`break-${row}`} className="flex-break" />);
    }
  }

  return (
    <div className="app">
      <div className="board">{children}</div>
      <div className="actions">
        <button onClick={solved ? reset : solve}>{solved ? 'Reset' : 'Solve!'}</button>
        <button onClick={copy}>Copy Board</button>
        <button onClick={clear}>Clear</button>
      </div>
      {errorText ? <p className="error">{errorText}</p> : null}
    </div>
  );
}
