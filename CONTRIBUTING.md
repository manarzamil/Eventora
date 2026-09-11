# Contributing

Thanks for looking. Eventora is primarily a portfolio project, but issues and
pull requests are welcome — particularly ones that improve correctness,
accessibility or the clarity of the code.

## Getting set up

```bash
git clone https://github.com/<your-username>/eventora.git
cd eventora
npm install
cp .env.example .env          # then edit DATABASE_URL and AUTH_SECRET
createdb eventora && createdb eventora_test
npm run db:migrate
npm run db:seed
npm run dev
```

Full details, including the Docker route, are in the README.

## Before you open a pull request

Run the same three checks CI runs:

```bash
npm run typecheck
npm run lint
npm test
```

All three must pass. `npm test` needs a running PostgreSQL and a
`TEST_DATABASE_URL` pointing at a database it is allowed to truncate.

## House style

A few conventions that the codebase holds to. They are not arbitrary, and a
review will ask about a change that breaks one.

- **Money is an integer in minor units.** Never a float, never a string. The
  minor-unit exponent comes from `Intl`, because it is not always 2.
- **Validation lives in `src/lib/validation.ts`** and is shared by the form and
  the route handler. Do not write a second, parallel set of rules.
- **Route handlers stay thin.** Parse, authorise, delegate to a service, return.
  Business rules belong in `src/server/services/`.
- **Services never import `next/server`.** They throw typed `ApiError`s; the
  HTTP layer translates them.
- **Every mutating API route authorises itself.** Middleware is a routing
  convenience, not a security boundary.
- **Colours come from the tokens in `globals.css`.** If a value is not a token,
  it does not belong in a component.
- **Interactive elements need a visible focus state and an accessible name.**
  The base stylesheet handles focus; you handle the name.
- **Comments explain why, not what.** A comment restating the code will be
  removed in review; one explaining a non-obvious decision will not.

## Commit messages

Conventional Commits, so the history reads as a changelog:

```
feat(booking): hold seats with a conditional update
fix(discovery): stop sold-out sessions leaking into results
docs(readme): document the environment variables
test(booking): cover concurrent claims on the last seat
chore(deps): update drizzle-orm
```

## Reporting bugs

Include what you expected, what happened, and the smallest set of steps that
reproduces it. If it involves data, say which seed the database was in.

Security issues go through the private advisory process described in
[SECURITY.md](SECURITY.md), not a public issue.
