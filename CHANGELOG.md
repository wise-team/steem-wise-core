<a name="3.1.2-beta.1"></a>
## [3.1.2-beta.1](https://github.com/wise-team/steem-wise-core/compare/v3.1.0-rc.1...v3.1.2-beta.1) (2019-01-16)


### Bug Fixes

* fix letter-case typo in Log and AbstractLog ([25833f3](https://github.com/wise-team/steem-wise-core/commit/25833f3))


### Features

* update nodeJS version to 10.15 ([5ef10be](https://github.com/wise-team/steem-wise-core/commit/5ef10be))



<a name="3.1.0-rc.1"></a>
# [3.1.0-rc.1](https://github.com/wise-team/steem-wise-core/compare/v3.0.5...v3.1.0-rc.1) (2018-12-19)


### Bug Fixes

* **AbstractLog:** allow stack trace logging on every level ([aa1de71](https://github.com/wise-team/steem-wise-core/commit/aa1de71))
* **Daemon:** enhance Daemon log ([6683218](https://github.com/wise-team/steem-wise-core/commit/6683218))
* **single daemon:** add voter discrimination ([81e377e](https://github.com/wise-team/steem-wise-core/commit/81e377e))
* **VotingPower rule:** fix wise-team/steem-wise-voter-page[#42](https://github.com/wise-team/steem-wise-core/issues/42) ([98eb3f1](https://github.com/wise-team/steem-wise-core/commit/98eb3f1))
* **VotingPower rule:** fix wise-team/steem-wise-voter-page[#43](https://github.com/wise-team/steem-wise-core/issues/43) ([5a676a7](https://github.com/wise-team/steem-wise-core/commit/5a676a7))
* **WeightForPeriod rule:** more convenient description ([c07af4c](https://github.com/wise-team/steem-wise-core/commit/c07af4c))
* **WeightRule:** format weight as percent ([8a6940d](https://github.com/wise-team/steem-wise-core/commit/8a6940d))



<a name="3.0.5"></a>
## [3.0.5](https://github.com/wise-team/steem-wise-core/compare/v3.0.4...v3.0.5) (2018-12-06)



<a name="3.0.4"></a>
## [3.0.4](https://github.com/wise-team/steem-wise-core/compare/v3.0.3...v3.0.4) (2018-12-06)


### Features

* change default steem api to https://anyx.io ([76eeff6](https://github.com/wise-team/steem-wise-core/commit/76eeff6))



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
# [3.0.0](https://github.com/wise-team/steem-wise-core/compare/735165d...v3.0.0) (2018-11-01)


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



