/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "vitest" {
  export const vi: any
  export const describe: any
  export const it: any
  export const test: any
  export const expect: any
  export const beforeEach: any
  export const afterEach: any
}

declare module "vitest/config" {
  export function defineConfig(config: any): any
}

declare module "@vitejs/plugin-react" {
  const react: (...args: any[]) => any
  export default react
}

declare module "@testing-library/react" {
  export const render: any
  export const screen: any
  export const cleanup: any
}

declare module "@testing-library/jest-dom/vitest"
declare module "@testing-library/dom"
