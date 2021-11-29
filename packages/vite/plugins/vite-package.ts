import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    build: {
      target: "esnext",
      // lib: {
      //   fileName: (format) => `my-lib.${format}.js`
      // },
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: [],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
          }
        }
      }
    }
  }
});

