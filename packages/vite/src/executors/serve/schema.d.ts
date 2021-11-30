export interface Schema {
  baseHref?: string;
  viteConfig?: string;
  assets: string;
  outputPath: string;
  fileReplacements: { file: string, with: string}[]
}
