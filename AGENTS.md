# AGENTS.md

React + Vite SPA (`kitchen-orders`). JavaScript, **без TypeScript**. Собран через `create-vite@9` (`react` template) и пока содержит только демо-страницу шаблона — фичи «кухни/заказов» ещё не написаны, доменного кода в репозитории нет.

## Node.js установлен не в системе (главный подводный камень)

На машине **нет** системного Node, `sudo` недоступен. Node 24.21.0 + npm 11.19.0 распакован вручную:

- бинарники: `~/.local/lib/nodejs/node-v24.21.0-linux-x64/bin`
- симлинки `node npm npx corepack` в `~/.local/bin`
- `export PATH=...` добавлен в `~/.bashrc` (в `~/.profile` `~/.local/bin` уже прописан)

Если `node: command not found` — не переустанавливай, а проверь, что эта строка в `~/.bashrc` и что открыт новый сессион/shell. Vite 8 требует Node `^20.19.0 || >=22.12.0`.

## Линтер — oxlint, а не ESLint

- `npm run lint` → `oxlint`. Конфиг `.oxlintrc.json` подхватывается автоматически, флаг не нужен.
- Ни ESLint, ни `.eslintrc*`, ни `--ext` здесь нет. Не добавляй ESLint-конфиги и не ищи `eslint`-зависимости.
- Скрипта автофикса нет: `npx oxlint --fix`.
- Включены ровно два правила: `react/rules-of-hooks` (error), `react/only-export-components` (warn, `allowConstantExport: true`). Второе правило легко нарушить — не выставляй компоненты и не-константы из одного файла компонента.

## Тестов нет

Скрипта `test` нет, ни Vitest, ни Jest, ни Testing Library не установлены — `npm test` завершится ошибкой. Не выдумывай `npm test` и не рассчитывай на «прогон тестов» как на шаг верификации. Если тесты понадобятся, добавь Vitest явно и отдельным коммитом.

## Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер, HMR; по умолчанию только `localhost` |
| `npm run build` | прод-сборка в `dist/` (в `.gitignore`) |
| `npm run preview` | раздача собранного `dist/` |
| `npm run lint` | oxlint, без аргументов |

`npm run dev -- --host` — открыть в сети; `--port N` сменить порт. Форматирования, prettier и pre-commit хуков в проекте нет: выравнивай стиль вручную по соседнему коду (без точек с запятой, одинарные кавычки).

## Git

Репозиторий инициализирован (`git init -b main`), но **коммитов ещё нет**, и **не настроен `user.name` / `user.email`** — `git commit` упадёт. Сначала задай identity (репо-локально через `git config user.name/user.email`, либо глобально — сам не меняй глобальный конфиг без разрешения).

## Сборщик — Rolldown, не Rollup/esbuild

Vite 8.3.x тянет `rolldown` и `lightningcss` вместо esbuild/rollup. Не предлагай esbuild-специфичные опции (`esbuild:` в `vite.config.js` их не примет) и не ставь плагины, рассчитанные на Rollup API. `@vitejs/plugin-react` использует Oxc; React Compiler намеренно **не** включён (влияет на скорость dev/build) — не включай без явной просьбы.

## Структура

```
index.html          → подключает /src/main.jsx (это точка входа, не App)
src/main.jsx        → createRoot + StrictMode
src/App.jsx         → единственный компонент приложения
src/index.css       → глобальные стили
src/App.css         → стили компонента
src/assets/         → импортируются в JSX, попадают в dist/ с хешем в имени
public/             → отдаётся как есть по пути /, без хеша
```

`public/icons.svg` используется через `<use href="/icons.svg#id-icon">` — иконки спрайта, новые иконки добавляй в тот же SVG. Растровые/векторные ассеты, импортируемые из JSX, клади в `src/assets/`, а не в `public/`.

## Агенты OpenCode: analyst → developer → tester

Ролевой процесс задан тремя subagent'ами в `.opencode/agents/`. Все — `mode: subagent`, вызываются через `@имя` в чате или делегируются агентом `build` через task-инструмент. Конфиг не инлайнится в `opencode.json` — отдельного `opencode.json` в проекте нет и не нужно.

| Агент | Файл | Роль | Права |
| --- | --- | --- | --- |
| `analyst` | `.opencode/agents/analyst.md` | Бизнес-аналитик и приёмщик. Уточняет требования, пишет критерии приёмки (`AC-xx`), проверяет реализацию | `edit: deny`, `bash: ask` (только `git status/diff/log/show/blame`, `npm run lint/build`, `npx oxlint` — всё остальное `ask`) |
| `developer` | `.opencode/agents/developer.md` | Реализует требования, правит код, чинит сборку | `edit: allow`, `npm run dev/build/preview/lint/install/ci`, `git add`, `git commit` — `ask`; `git push`, `git reset --hard`, `npm publish`, `rm -rf` — `deny` |
| `tester` | `.opencode/agents/tester.md` | Прогоняет сценарии, пишет баг-репорты | `edit: deny`, `bash: ask` (только `npm run dev/build/preview/lint`, `curl`, `git status/diff/log/show`) |

Жёсткие границы, нарушать которые нельзя:
- `analyst` и `tester` не могут менять файлы вообще — баг-репорты пишутся **в ответе**, а не в файлы.
- У всех трёх `task: deny` — роли не могут делегировать друг другу, иначе `analyst` обошёл бы свой `edit: deny` через `developer`.
- `developer` не имеет права менять бизнес-требования: при неоднозначности он обязан остановиться и вернуть вопрос, а не подогнать смысл под реализацию.
- У subagent'ов `question` по умолчанию `deny`; у `analyst` явно разрешён (`question: allow`) — уточнение требований его основная работа.

Конфиг агентов читается только при старте opencode. После правки `.opencode/agents/*.md` нужно перезапустить opencode; рабочая сессия продолжит использовать старые промпты. Проверить, что агенты подхватились: `opencode agent list`.

## Прочее

- CSS — обычный глобальный, без CSS-модулей/Tailwind; при появлении компонентной стилизации выбери один подход и придерживайся его.
- Роутинга и стейт-менеджмента нет. `useState` из `App.jsx:8` — единственный пример состояния.
- Нет CI и pre-commit хуков. Не ищи их и не добавляй пайплайны без запроса.
- `@types/react` и `@types/react-dom` в `devDependencies` лежат по умолчанию из шаблона, хотя `.ts`/`.tsx` в проекте нет. Оставь как есть; новые файлы создавай как `.jsx`.