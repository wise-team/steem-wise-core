<a name="3.0.3"></a>
## [3.0.3](https://github.com/wise-team/steem-wise-core/compare/v3.0.2...v3.0.3) (2018-11-07)


### Features

* **universal synchronizer:** add onConfirmVote callback ([e6d3b1b](https://github.com/wise-team/steem-wise-core/commit/e6d3b1b))



<a name="3.0.2"></a>
## [3.0.2](https://github.com/wise-team/steem-wise-core/compare/v3.0.1...v3.0.2) (2018-11-02)


### Features

* **wise main class:** export Validator ([2919be8](https://github.com/wise-team/steem-wise-core/commit/2919be8))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/wise-team/steem-wise-core/compare/v3.0.0...v3.0.1) (2018-11-01)



<a name="3.0.0"></a>
# [3.0.0](https://github.com/wise-team/steem-wise-core/compare/v2.3.1...v3.0.0) (2018-11-01)


### Bug Fixes

* **universal synchronizer:** fix next block loading ([3a3436b](https://github.com/wise-team/steem-wise-core/commit/3a3436b))


### Features

* **api:** add getAllWiseOperationsInBlock method ([735165d](https://github.com/wise-team/steem-wise-core/commit/735165d))
* **fake api:** implement getAllWiseOperationsInBlock ([129e671](https://github.com/wise-team/steem-wise-core/commit/129e671))
* **sql api:** implement getAllWiseOperationsInBlock ([4dc74e4](https://github.com/wise-team/steem-wise-core/commit/4dc74e4))
* **steem operation number:** add clone method ([235d37d](https://github.com/wise-team/steem-wise-core/commit/235d37d))
* **synchronizer:** create UniversalSynchronizer ([b95cd1d](https://github.com/wise-team/steem-wise-core/commit/b95cd1d))
* create SingleDaemon instead of Synchronizer ([a32fe73](https://github.com/wise-team/steem-wise-core/commit/a32fe73))
* implement getAllWiseOperationsInBlock in DisabledApi ([19eeeba](https://github.com/wise-team/steem-wise-core/commit/19eeeba))


### BREAKING CHANGES

* create SingleDaemon instead of Synchronized and rename Synchronizer to LegacySynchronizer



<a name="2.3.1"></a>
## [2.3.1](https://github.com/wise-team/steem-wise-core/compare/v2.3.0...v2.3.1) (2018-10-29)


### Features

* **main class:** export RulesUpdater ([de08f03](https://github.com/wise-team/steem-wise-core/commit/de08f03))



<a name="2.3.0"></a>
# [2.3.0](https://github.com/wise-team/steem-wise-core/compare/v2.2.5...v2.3.0) (2018-10-29)


### Features

* **direct blockchain api:** make get...InBlock more polite ([c9fc063](https://github.com/wise-team/steem-wise-core/commit/c9fc063))
* **rules updater:** add getUploadRulesetsForVoterOps method ([17989d6](https://github.com/wise-team/steem-wise-core/commit/17989d6))



<a name="2.2.5"></a>
## [2.2.5](https://github.com/wise-team/steem-wise-core/compare/v2.2.4...v2.2.5) (2018-10-25)


### Features

* include steem-js types as tgz to allow build in non-git envs ([e7b6f0f](https://github.com/wise-team/steem-wise-core/commit/e7b6f0f))



<a name="2.2.4"></a>
## [2.2.4](https://github.com/wise-team/steem-wise-core/compare/v2.2.3...v2.2.4) (2018-10-25)


### Bug Fixes

* move steem-js types from dev to normal dependencies ([09ec7ec](https://github.com/wise-team/steem-wise-core/commit/09ec7ec))



<a name="2.2.3"></a>
## [2.2.3](https://github.com/wise-team/steem-wise-core/compare/v2.2.2...v2.2.3) (2018-10-25)


### Features

* use our publicly available type definitions for steem-js ([262eeae](https://github.com/wise-team/steem-wise-core/commit/262eeae))



<a name="2.2.2"></a>
## [2.2.2](https://github.com/wise-team/steem-wise-core/compare/v2.2.1...v2.2.2) (2018-10-20)


### Bug Fixes

* **log:** fix multiple instances of Log singleton and ensure scopes ([2cd08aa](https://github.com/wise-team/steem-wise-core/commit/2cd08aa))
* **log:** remove unnecessary reference to window (ts-node bug) ([f427aee](https://github.com/wise-team/steem-wise-core/commit/f427aee))


### Features

* **abstract log:** split msgs by level to console .log and .error ([dcc1d9d](https://github.com/wise-team/steem-wise-core/commit/dcc1d9d))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/wise-team/steem-wise-core/compare/v2.2.0...v2.2.1) (2018-10-19)



<a name="2.2.0"></a>
# [2.2.0](https://github.com/wise-team/steem-wise-core/compare/v2.1.0...v2.2.0) (2018-10-19)


### Bug Fixes

* **direct blockchain api:** fix ruleset loading for sole voter ([54b6043](https://github.com/wise-team/steem-wise-core/commit/54b6043))
* **fake api:** fix other voter ruleset loading ([074fdf9](https://github.com/wise-team/steem-wise-core/commit/074fdf9))


### Code Refactoring

* **api:** loadAllRulesets + loadRulesets -> loadRulesets(forWhom) ([5a57039](https://github.com/wise-team/steem-wise-core/commit/5a57039))


### BREAKING CHANGES

* **api:** Api.loadAllRulesets + Api.loadRulesets now becomes one method #loadRulesets(forWhom: { delegator?, voter?}, moment)



<a name="2.1.0"></a>
# [2.1.0](https://github.com/wise-team/steem-wise-core/compare/v2.0.0...v2.1.0) (2018-10-19)


### Bug Fixes

* **abstract log:** skip stdout level info on low-verbosity levels ([7d4e8e9](https://github.com/wise-team/steem-wise-core/commit/7d4e8e9))
* **direct blockchain api:** fix #getAllRulesets filtering ([1e2dd37](https://github.com/wise-team/steem-wise-core/commit/1e2dd37))
* **direct blockchain api:** fix steem object configuration ([cb22efa](https://github.com/wise-team/steem-wise-core/commit/cb22efa))
* unit tests that used old then api use async/await ([69b421b](https://github.com/wise-team/steem-wise-core/commit/69b421b))
* **fake blockchain api:** fix #loadAllRulesets filter ([8fa0665](https://github.com/wise-team/steem-wise-core/commit/8fa0665))
* **generate fake blockchain file script:** append new types ([08f915d](https://github.com/wise-team/steem-wise-core/commit/08f915d))
* **generate fake blockchain file script:** fix d.ts resolution ([3ab0950](https://github.com/wise-team/steem-wise-core/commit/3ab0950))
* **schema:** fix schema building script - new types issue ([1f134fc](https://github.com/wise-team/steem-wise-core/commit/1f134fc))
* **synchronizer:** fix missing notifier call ([9d70036](https://github.com/wise-team/steem-wise-core/commit/9d70036))
* **unit and integration tests:** make ts-node in mocha load tsconfig ([511bf56](https://github.com/wise-team/steem-wise-core/commit/511bf56))
* **validator:** make validation exception be returned ([af40c74](https://github.com/wise-team/steem-wise-core/commit/af40c74))
* **wisesql protocol:** fix pagination in WiseSQLProtocol.Handler ([43c1179](https://github.com/wise-team/steem-wise-core/commit/43c1179))
* fix integration tests (relative to the changes in typings) ([1301349](https://github.com/wise-team/steem-wise-core/commit/1301349))
* fix v1 and v2 schema generation ([ccf719c](https://github.com/wise-team/steem-wise-core/commit/ccf719c))


### Code Refactoring

* move steem-related type defs to steem-js declaration file ([dc5552b](https://github.com/wise-team/steem-wise-core/commit/dc5552b))


### Features

* **logging:** advanced abstract logging system for all wise projects ([c279253](https://github.com/wise-team/steem-wise-core/commit/c279253))
* add SteemOperationNumber.compare for sorting ([52cbdf2](https://github.com/wise-team/steem-wise-core/commit/52cbdf2))
* conform rest of classes to es6 async/await ([1408d7e](https://github.com/wise-team/steem-wise-core/commit/1408d7e))
* conform RulesUpdater to es6 async/await ([9788cd4](https://github.com/wise-team/steem-wise-core/commit/9788cd4))
* fully functional WiseSQLApi ([e4cf4ad](https://github.com/wise-team/steem-wise-core/commit/e4cf4ad))
* rewrite rules to comply es6 async/await ([9e739c9](https://github.com/wise-team/steem-wise-core/commit/9e739c9))
* **abstract log:** add efficient() fn for cost-effective logging ([a1cfb40](https://github.com/wise-team/steem-wise-core/commit/a1cfb40))
* handle nonexistent posts as validation exception in rules ([bf0243b](https://github.com/wise-team/steem-wise-core/commit/bf0243b))
* make DirectBlockchainApi compliant with ES6 async/await ([4c97b59](https://github.com/wise-team/steem-wise-core/commit/4c97b59))
* make FakeApi and DisabledApi compliant with es6 async/await ([2d57ef5](https://github.com/wise-team/steem-wise-core/commit/2d57ef5))
* move from ES5 -> ES6 ([2cf2f55](https://github.com/wise-team/steem-wise-core/commit/2cf2f55))
* remove callbacks from Wise main class ([cae789c](https://github.com/wise-team/steem-wise-core/commit/cae789c))
* separate WiseCommand from WiseOperation (easier type manipulation) ([3b4462c](https://github.com/wise-team/steem-wise-core/commit/3b4462c))
* **direct blockchain api:** add logger to steem-js object ([f4d6530](https://github.com/wise-team/steem-wise-core/commit/f4d6530))
* update many dependencies to next major versions ([c180a0d](https://github.com/wise-team/steem-wise-core/commit/c180a0d))
* **logging:** allow log level configuration via env ([3f5961e](https://github.com/wise-team/steem-wise-core/commit/3f5961e))
* **sql api:** paginated WiseSQLProtocol handler ([de5c123](https://github.com/wise-team/steem-wise-core/commit/de5c123))
* **wise sql api:** add WiseSQLProtocol version handling ([f89e149](https://github.com/wise-team/steem-wise-core/commit/f89e149))
* use the new logger and comply to standard NPM logging levels ([a2e7e03](https://github.com/wise-team/steem-wise-core/commit/a2e7e03))


### BREAKING CHANGES

* only for typescript users who imported types from internal wise files
* now the only way to wait for results of wise operations is via the promises. It is a step towards modern javascript. Callbacks cause many hard to debug errors ans should be avoided.
* Update many dependencies to next major versions
* Steem-wise-core is now compiled to ES6 js standard. Old browsers (including all versions of Internet explorer are now unsupported). I kindly remind you that now NodeJS 10 is the minimal node version to run steem-wise-core and other wise tools.



<a name="2.0.0"></a>
# [2.0.0](https://github.com/wise-team/steem-wise-core/compare/v1.2.1...v2.0.0) (2018-10-16)


### Bug Fixes

* repair invisible badges ([b34b3d6](https://github.com/wise-team/steem-wise-core/commit/b34b3d6))


### Features

* delete WiseRESTApi (will be replaced with sql-fallback api) ([48755ac](https://github.com/wise-team/steem-wise-core/commit/48755ac))
* update nodeJS to 10.12 ([99a2a5f](https://github.com/wise-team/steem-wise-core/commit/99a2a5f))
* update sql schema to https ([6b0a559](https://github.com/wise-team/steem-wise-core/commit/6b0a559))


### BREAKING CHANGES

* WiseRESTApi is no longer available
* NodeJS 10.12 is required for node apps that use steem-wise-core



<a name="1.2.1"></a>
## [1.2.1](https://github.com/wise-team/steem-wise-core/compare/v1.2.0...v1.2.1) (2018-09-26)


### Bug Fixes

* **blockchain config:** rename prop to STEEM_VOTING_MANA_REGENERATION ([c3236c4](https://github.com/wise-team/steem-wise-core/commit/c3236c4))
* **direct blockchain api:** set steem options before each operation ([e655171](https://github.com/wise-team/steem-wise-core/commit/e655171))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/wise-team/steem-wise-core/compare/v1.1.2...v1.2.0) (2018-09-26)


### Features

* update dependencies including steem-js ([61169a1](https://github.com/wise-team/steem-wise-core/commit/61169a1))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/wise-team/steem-wise-core/compare/v1.1.1...v1.1.2) (2018-09-18)


### Features

* **wise.ts:** export Validator ([a1d95e6](https://github.com/wise-team/steem-wise-core/commit/a1d95e6))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/wise-team/steem-wise-core/compare/v1.1.0...v1.1.1) (2018-09-18)


### Bug Fixes

* **wise.ts:** export missing RulePrototyper ([b29d3b1](https://github.com/wise-team/steem-wise-core/commit/b29d3b1))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/wise-team/steem-wise-core/compare/v1.0.0...v1.1.0) (2018-09-14)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/wise-team/steem-wise-core/compare/v0.21.0...v1.0.0) (2018-08-28)



<a name="0.21.0"></a>
# [0.21.0](https://github.com/wise-team/steem-wise-core/compare/v0.20.1...v0.21.0) (2018-08-27)



<a name="0.20.1"></a>
## [0.20.1](https://github.com/wise-team/steem-wise-core/compare/v0.20.0...v0.20.1) (2018-08-25)



<a name="0.20.0"></a>
# [0.20.0](https://github.com/wise-team/steem-wise-core/compare/v0.19.7...v0.20.0) (2018-08-24)



<a name="0.19.7"></a>
## [0.19.7](https://github.com/wise-team/steem-wise-core/compare/v0.19.6...v0.19.7) (2018-08-22)



<a name="0.19.6"></a>
## [0.19.6](https://github.com/wise-team/steem-wise-core/compare/v0.19.5...v0.19.6) (2018-08-13)



<a name="0.19.5"></a>
## [0.19.5](https://github.com/wise-team/steem-wise-core/compare/v0.19.4...v0.19.5) (2018-08-06)



<a name="0.19.4"></a>
## [0.19.4](https://github.com/wise-team/steem-wise-core/compare/v0.19.3...v0.19.4) (2018-08-06)



<a name="0.19.3"></a>
## [0.19.3](https://github.com/wise-team/steem-wise-core/compare/v0.19.2...v0.19.3) (2018-08-04)



<a name="0.19.2"></a>
## [0.19.2](https://github.com/wise-team/steem-wise-core/compare/v0.18.0-alpha...v0.19.2) (2018-07-31)



<a name="0.18.0-alpha"></a>
# [0.18.0-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.17.13-alpha...v0.18.0-alpha) (2018-07-06)



<a name="0.17.13-alpha"></a>
## [0.17.13-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.17.11-alpha...v0.17.13-alpha) (2018-07-03)



<a name="0.17.11-alpha"></a>
## [0.17.11-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.17.10-alpha...v0.17.11-alpha) (2018-06-23)



<a name="0.17.10-alpha"></a>
## [0.17.10-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.17.7-alpha...v0.17.10-alpha) (2018-06-06)



<a name="0.17.7-alpha"></a>
## [0.17.7-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.16.0...v0.17.7-alpha) (2018-06-06)



<a name="0.16.0"></a>
# [0.16.0](https://github.com/wise-team/steem-wise-core/compare/v0.14.0-alpha...v0.16.0) (2018-06-03)



<a name="0.14.0-alpha"></a>
# [0.14.0-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.13.2-alpha...v0.14.0-alpha) (2018-06-03)



<a name="0.13.2-alpha"></a>
## [0.13.2-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.13.1-alpha...v0.13.2-alpha) (2018-05-13)



<a name="0.13.1-alpha"></a>
## [0.13.1-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.13.0-alpha...v0.13.1-alpha) (2018-05-13)



<a name="0.13.0-alpha"></a>
# [0.13.0-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.12.0-alpha...v0.13.0-alpha) (2018-05-13)



<a name="0.12.0-alpha"></a>
# [0.12.0-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.11.0-alpha...v0.12.0-alpha) (2018-05-05)



<a name="0.11.0-alpha"></a>
# [0.11.0-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.10.0-alpha...v0.11.0-alpha) (2018-05-05)



<a name="0.10.0-alpha"></a>
# [0.10.0-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.9.1-alpha...v0.10.0-alpha) (2018-05-04)



<a name="0.9.1-alpha"></a>
## [0.9.1-alpha](https://github.com/wise-team/steem-wise-core/compare/v0.9.0...v0.9.1-alpha) (2018-05-04)



<a name="0.9.0"></a>
# 0.9.0 (2018-05-04)



