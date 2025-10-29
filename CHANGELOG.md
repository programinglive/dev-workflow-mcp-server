# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.1.10](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.9...v1.1.10) (2025-10-29)


### ✨ Features

* add project knowledge library with persisted summary file for future database integration ([b9dc13f](https://github.com/programinglive/dev-workflow-mcp-server/commit/b9dc13f4b25dec756088a55185ccbfdb3988a644))

### [1.1.9](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.8...v1.1.9) (2025-10-29)


### 🧹 Chores

* interim commit ([b1aead0](https://github.com/programinglive/dev-workflow-mcp-server/commit/b1aead05920c766a183988fb93d3f0edc3e1eafc))


### ✅ Tests

* update README.md, exec.js, package-lock.json +7 more ([894fdf1](https://github.com/programinglive/dev-workflow-mcp-server/commit/894fdf1eace33ddf0081c565028d214e1c7697bf))


### ✨ Features

* make run_full_workflow smart and resumable from current phase ([930eb3c](https://github.com/programinglive/dev-workflow-mcp-server/commit/930eb3cb84c241b14f0e194cf490313e1e99a7ce))

### [1.1.8](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.7...v1.1.8) (2025-10-27)


### 📝 Documentation

* note DEV_WORKFLOW_STATE_FILE override ([bbeb11b](https://github.com/programinglive/dev-workflow-mcp-server/commit/bbeb11bc7f8be33f7c1a51b336283a3b2a48d3ea))

### [1.1.7](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.6...v1.1.7) (2025-10-26)


### ✨ Features

* prompt for documentation after tests pass ([a87e44f](https://github.com/programinglive/dev-workflow-mcp-server/commit/a87e44f2a78ea4c9220d62868ee1f9c7ad3b149b))

### [1.1.6](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.5...v1.1.6) (2025-10-26)


### 🐛 Bug Fixes

* avoid root workflow state path ([a9bd01b](https://github.com/programinglive/dev-workflow-mcp-server/commit/a9bd01bac6b0a17307385688a51873668498e0a0))
* require explicit commit before release ([5f58ead](https://github.com/programinglive/dev-workflow-mcp-server/commit/5f58ead9006595b7e57460fef585e3f9ea9de409))

### [1.1.5](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.4...v1.1.5) (2025-10-25)


### ✨ Features

* enforce release guard and per-project workflow state ([1c845a1](https://github.com/programinglive/dev-workflow-mcp-server/commit/1c845a1eb164863ab0269510b142e28ed1ea2136))

### [1.1.4](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.3...v1.1.4) (2025-10-25)


### 🐛 Bug Fixes

* ensure install script uses project root for workflow state ([8b8b32f](https://github.com/programinglive/dev-workflow-mcp-server/commit/8b8b32f5c436b256ec1edb05a406405a5c2455c1))

### [1.1.3](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.2...v1.1.3) (2025-10-25)


### ✨ Features

* make dev-workflow MCP installable with per-project workflow state isolation ([50e9ead](https://github.com/programinglive/dev-workflow-mcp-server/commit/50e9ead788f2bba1b0ff1a62515f3bcc78d0c8e6))

### [1.1.2](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.1...v1.1.2) (2025-10-25)

### [1.1.1](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.1.0...v1.1.1) (2025-10-25)


### ✨ Features

* add force_complete_task tool ([f731a7d](https://github.com/programinglive/dev-workflow-mcp-server/commit/f731a7d2e48295963b8573d4a2abd3ebd42ba5ab))

## [1.1.0](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.11...v1.1.0) (2025-10-25)


### 📝 Documentation

* clarify commit and push step ([c741f61](https://github.com/programinglive/dev-workflow-mcp-server/commit/c741f618813479c5df2bcca94c3dffc8881e97c8))


### 🐛 Bug Fixes

* allow commit_and_push on clean tree ([a831974](https://github.com/programinglive/dev-workflow-mcp-server/commit/a831974f66313ebe8752d416752076df63902bea))
* auto-detect commit in perform_release when tree is clean ([0db7038](https://github.com/programinglive/dev-workflow-mcp-server/commit/0db7038148f68963f53e52a5f73623dea7ad3462))


### ✨ Features

* check staged changes when resetting workflow to commit phase ([05d02fd](https://github.com/programinglive/dev-workflow-mcp-server/commit/05d02fd7ec6177af3fb1fd86ec093e1e37b56cbd))
* continue_workflow auto-executes next step in commit phase ([a5b49ed](https://github.com/programinglive/dev-workflow-mcp-server/commit/a5b49edaae7cb51ea3aa49d9b1b64587843441ce))

### [1.0.11](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.10...v1.0.11) (2025-10-25)


### ✨ Features

* add continue workflow guidance ([516b33e](https://github.com/programinglive/dev-workflow-mcp-server/commit/516b33ecfc7533df5868c9c26458088d6ea591a2))


### 🐛 Bug Fixes

* ensure commit and push happens before release ([08ee662](https://github.com/programinglive/dev-workflow-mcp-server/commit/08ee662f525431ba4a2d735ed253aad8d6720ac2))

### [1.0.10](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.9...v1.0.10) (2025-10-24)


### ♻️ Refactors

* modularize workflow server ([f0c9401](https://github.com/programinglive/dev-workflow-mcp-server/commit/f0c940123a8e6f961555cc7ba4d6dec2deb854e7))


### ✅ Tests

* cover release push flow ([933ff11](https://github.com/programinglive/dev-workflow-mcp-server/commit/933ff1126af08a49d1ce38a4eedcc738b0064efb))

### [1.0.9](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.8...v1.0.9) (2025-10-23)


### 📝 Documentation

* explain local workflow state ([cb6e333](https://github.com/programinglive/dev-workflow-mcp-server/commit/cb6e33353b4e1c0f693146f6cb07c9437a7f5aa8))

### [1.0.8](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.7...v1.0.8) (2025-10-21)


### ✨ Features

* allow skipping tests and dropping workflow tasks ([2b8b27c](https://github.com/programinglive/dev-workflow-mcp-server/commit/2b8b27cca611d2fe266c1b814c21b6fec2472856))

### [1.0.7](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.6...v1.0.7) (2025-10-20)

### [1.0.6](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.5...v1.0.6) (2025-10-20)


### ✅ Tests

* enforce clean release workflow ([c261a7b](https://github.com/programinglive/dev-workflow-mcp-server/commit/c261a7b3d141ba4472567bd47e4f6b6e4d2ee3fd))

### [1.0.5](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.4...v1.0.5) (2025-10-20)


### ✅ Tests

* update index.js and tests/workflowState.test.js ([b9df3c8](https://github.com/programinglive/dev-workflow-mcp-server/commit/b9df3c8643303769dbe4c5a0992995b6328cdfcf))

### [1.0.4](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.3...v1.0.4) (2025-10-20)


### ✨ Features

* enforce release step after ready check ([0725496](https://github.com/programinglive/dev-workflow-mcp-server/commit/07254967becd515cb2a4261d62af01dfeb842175))


### 🐛 Bug Fixes

* support windows-friendly commit quoting ([47881fd](https://github.com/programinglive/dev-workflow-mcp-server/commit/47881fd0db54da3fabe368b1a135902e47ef873e))

### [1.0.3](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.2...v1.0.3) (2025-10-20)


### 🧹 Chores

* add gitignore ([5f695fb](https://github.com/programinglive/dev-workflow-mcp-server/commit/5f695fbc71515c7f1ffbc44fd74b52314c966ee6))


### 📝 Documentation

* clarify cross-platform installation ([52b5ee7](https://github.com/programinglive/dev-workflow-mcp-server/commit/52b5ee7061e8f968ff94e6c226586fc1b7e2a057))

### [1.0.2](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.1...v1.0.2) (2025-10-19)


### 🐛 Bug Fixes

* guard run_tests arguments ([2004c59](https://github.com/programinglive/dev-workflow-mcp-server/commit/2004c590fabe359d068122cf240a731382f81ca0))
* normalize tool call arguments ([44d5a3d](https://github.com/programinglive/dev-workflow-mcp-server/commit/44d5a3d35f191012445fa02cee6254afbc993c98))


### 📝 Documentation

* clarify tool argument requirements ([4528614](https://github.com/programinglive/dev-workflow-mcp-server/commit/45286146661ad850eccb04849c11819e91ddd580))

### [1.0.1](https://github.com/programinglive/dev-workflow-mcp-server/compare/v1.0.0...v1.0.1) (2025-10-18)


### 🧹 Chores

* configure release tooling ([772fc64](https://github.com/programinglive/dev-workflow-mcp-server/commit/772fc6400fb7d2d481992f6f03f25c094cb3924c))

## 1.0.0 (2025-10-18)


### ✨ Features

* initial release ([9bd5835](https://github.com/programinglive/dev-workflow-mcp-server/commit/9bd5835af92776d9247efa50238ac5d71b00b492))


### 📝 Documentation

* add governance and contribution guidelines ([cfa78ea](https://github.com/programinglive/dev-workflow-mcp-server/commit/cfa78ea592788257f703d84974d78145a5312ca4))


### 🧹 Chores

* ensure clean staging before completing tasks ([7186629](https://github.com/programinglive/dev-workflow-mcp-server/commit/7186629fc2415b2d279a8a8d3451f52839dd2d28))
* revert @modelcontextprotocol/sdk to ^1.0.0 ([305d71f](https://github.com/programinglive/dev-workflow-mcp-server/commit/305d71f330027d8466828af53c939b4491cccee9))
* scope package under programinglive ([7388773](https://github.com/programinglive/dev-workflow-mcp-server/commit/7388773a50f0e06450558115edb367749245c31b))

## 1.0.0 (2025-10-18)


### ✨ Features

* initial release ([9bd5835](https://github.com/programinglive/dev-workflow-mcp-server/commit/9bd5835af92776d9247efa50238ac5d71b00b492))


### 📝 Documentation

* add governance and contribution guidelines ([cfa78ea](https://github.com/programinglive/dev-workflow-mcp-server/commit/cfa78ea592788257f703d84974d78145a5312ca4))


### 🧹 Chores

* ensure clean staging before completing tasks ([7186629](https://github.com/programinglive/dev-workflow-mcp-server/commit/7186629fc2415b2d279a8a8d3451f52839dd2d28))
* revert @modelcontextprotocol/sdk to ^1.0.0 ([305d71f](https://github.com/programinglive/dev-workflow-mcp-server/commit/305d71f330027d8466828af53c939b4491cccee9))
* scope package under programinglive ([7388773](https://github.com/programinglive/dev-workflow-mcp-server/commit/7388773a50f0e06450558115edb367749245c31b))
