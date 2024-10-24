import globals from "globals";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import angularEslintTemplate from "@angular-eslint/eslint-plugin-template";
import parser from "@angular-eslint/template-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [{
  ignores: ["back/**/*", "docker/**/*", "dist/**/*", "node_modules/**/*", "**/tailwind.config.js", "**/postcss.config.js", '**/eslint.config.mjs'],
},
...tseslint.configs.recommended,
{
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      document: true,
      window: true,
    },
    ecmaVersion: 5,
    sourceType: "commonjs",
    parserOptions: {
      project: "tsconfig.json",
      tsconfigRootDir: __dirname,
    },
  },
}, ...compat.extends(
  "eslint:recommended",
  "plugin:@typescript-eslint/eslint-recommended",
  "plugin:@angular-eslint/recommended",
  "plugin:@angular-eslint/template/process-inline-templates",
).map(config => ({
  ...config,
  files: ["**/*.ts"],
})), {
  files: ["**/*.ts"],

  languageOptions: {
    sourceType: "script",

    parserOptions: {
      project: true,
      createDefaultProgram: true,
      tsconfigRootDir: __dirname,
    },
  },
  rules: {
    "@angular-eslint/prefer-standalone": ["error"],
    "@typescript-eslint/naming-convention": ["error", {
      selector: "memberLike",
      modifiers: ["private"],
      format: ["camelCase"],
      leadingUnderscore: "require",
    },
      {
        selector: 'variable',
        format: ['camelCase', 'snake_case'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'function',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      }],
    "@angular-eslint/component-selector": ["error", {
      type: "element",
      prefix: "meg",
      style: "kebab-case",
    }],
    "no-irregular-whitespace": ["error", {
      skipComments: true,
    }],
    "@typescript-eslint/prefer-readonly": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      args: "all",
      caughtErrors: "all",
      ignoreRestSiblings: true,
      argsIgnorePattern: "^_",
    }],
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-explicit-any": "error",
  },
},
...compat.extends("plugin:@angular-eslint/template/recommended").map(config => ({
  ...config,
  files: ["**/*.html"],
})), {
  files: ["**/*.html"],
  plugins: {
    "@angular-eslint/template": angularEslintTemplate,
  },
  languageOptions: {
    parser: parser,
  },
  rules: {
    "@angular-eslint/template/prefer-self-closing-tags": "error",
  },
}, {
  rules: {
    "@typescript-eslint/ban-ts-comment": ["off",
      {
        'ts-check': 'allow-with-description',
        'ts-expect-error': true,
        'ts-ignore': true,
        'ts-nocheck': true,
        minimumDescriptionLength: 3,
      },
    ]
  }
}
];