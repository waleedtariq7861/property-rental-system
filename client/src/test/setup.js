import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  expect,
  vi,
} from 'vitest';

let consoleErrorSpy;
let consoleWarnSpy;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  expect(consoleWarnSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});
