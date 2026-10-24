# Contributing

We are happy to accept any contributions that make sense and respect the rules listed below.

## How to contribute

1. Fork the repo.
2. Create a feature branch for your contribution out of the `master` branch. Only one contribution per branch is accepted.
3. Implement your contribution while respecting our rules (see below).
4. If possible, add tests for your contribution to make sure it actually works.
5. Don't forget to run `npm run lint`, `npm run compile` and `npm test` just right before submitting. CI runs all three on every pull request.
6. Submit a pull request against our `master` branch!

## Development

You need [Node.js](https://nodejs.org/) 22 or newer. Install the dependencies from the lockfile with `npm ci`.

* The sources are TypeScript (`index.ts` and `lib/**/*.ts`). `npm run compile` compiles them to CommonJS `.js` files with `.d.ts` declarations next to them. The compiled files are not committed.
* The tests are ESM `.mts` files in `test/`, run by [Mocha](https://mochajs.org/) with [Chai](https://www.chaijs.com/) through Node's built-in type stripping. They import the compiled `.js` files, so compile before running `npm test`.
* `npm run lint` runs [ESLint](https://eslint.org/) with typescript-eslint and checks the formatting with [Prettier](https://prettier.io/). `npm run format` fixes what it can.
* `test/fixt/*.json` are snapshots of the parsed fixture APK. If you change the parser's output on purpose, regenerate them and explain the change in the pull request.

## Rules

* **Do** use feature branches.
* **Do** conform to existing coding style so that your contribution fits in.
* **Do** use [EditorConfig] to enforce our [whitespace rules](.editorconfig). If your editor is not supported, enforce the settings manually.
* **Do not** touch the `version` field in [package.json](package.json).
* **Do not** commit any generated files, unless already in the repo. If absolutely necessary, explain why.
* **Do not** create any top level files or directories. If absolutely necessary, explain why and update the `files` list in [package.json](package.json) if it has to be published.

## License

By contributing your code, you agree to license your contribution under our [LICENSE](LICENSE).

[editorconfig]: <http://editorconfig.org/>
