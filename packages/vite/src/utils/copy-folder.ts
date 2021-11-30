import { existsSync, statSync, mkdirSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";

export function copyRecursiveSync(src: string, dest: string) {
  const exists = existsSync(src);
  const stats = exists && statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    mkdirSync(dest);
    readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(join(src, childItemName),
                        join(dest, childItemName));
    });
  } else {
    copyFileSync(src, dest);
  }
};
