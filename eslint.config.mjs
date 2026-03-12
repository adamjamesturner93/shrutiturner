import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";

export default defineConfig([
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "out/**", "dist/**"]),
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...tailwindcss.configs["flat/recommended"],
  prettier,
  {
    settings: {
      tailwindcss: {
        config: {},
        callees: ["cn", "clsx", "cva", "twMerge"],
      },
    },
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-role": "error",
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-contradicting-classname": "warn",
    },
  },
]);
