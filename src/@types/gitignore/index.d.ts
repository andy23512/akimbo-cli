declare module 'gitignore' {
  export function getTypes(callback?: (err: Error, types: any[]) => any): void;

  export function writeFile(
    options: {
      type: string;
      file?: string;
      writable?: WritableStream;
    },
    callback?: (err: Error) => void
  ): void;
}
