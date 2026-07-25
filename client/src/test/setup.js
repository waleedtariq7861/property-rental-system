import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  expect,
  vi,
} from 'vitest';

let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
});
