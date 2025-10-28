declare module 'mock-fs' {
  interface MockFs {
    (config: any, options?: any): void;
    restore(): void;
  }

  const mock: MockFs;
  export = mock;
}