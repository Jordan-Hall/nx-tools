export interface Schema {
  entryFile: string;
  viteConfig?: string;
  assets?: string;
  packageJson?: string;
  outputPath: string;
  globals?: Record<string, string>;
  external?: string[]
}
