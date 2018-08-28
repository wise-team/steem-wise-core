# Contributing to Steem WISE

Thank you for contributing to Steem Wise. Together we can make Steem curations more effective.

Please follow the contributing guidelines as it saves both your and maintainers time. Thanks to you falling into line with these rules the development is faster.



## How can you help?

1. Report bugs
2. Ask for new features (feedback is essential for us)
3. Write pull requests that fix bugs or adds new features
4. Write about Wise on steem
5. Vote for noisy-witness on https://steemit.com/~witnesses



## Ground Rules

- Ensure you did `npm run build` to test if your change compiles well, and is compliant with tslint clean code rules
- Do `npm run test` to perform unit tests. See [Common issues with unit tests](#common-issues-with-unit-tests).
- Create an issue (add tag enhancement or bug) before adding a pull request
- Think twice before adding a new file, but do not hesitate to do that if it increases the readability of the code.
- Your code tells who you are. Make it art. Keep it quality and beautiful.
- Be welcoming and warm to the others. See our [Code of conduct](https://github.com/noisy-witness/steem-wise-core/blob/master/CODE_OF_CONDUCT.md).



- Ensure you did `npm run build` to test if your change compiles well, and is compliant with tslint clean code rules
- Do `npm run test` to perform unit tests. See [Common issues with unit tests](#common-issues-with-unit-tests).
- Create an issue (add tag enhancement or bug) before adding a pull request
- Think twice before adding a new file, but do not hesitate to do that if it increases readability of the code.
- Your code tells who you are. Make it art. Keep it quality and beautiful.
- Be welcoming and warm to the others. See our [Code of conduct](https://github.com/noisy-witness/steem-wise-core/blob/master/CODE_OF_CONDUCT.md).



## Your First Contribution

**Working on your first Pull Request?** You can learn how from this *free* series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github), 

Feel free to ask for help; everyone is a beginner at first.



## Getting started

Small contributions such as fixing spelling errors, where the content is small enough not to be considered intellectual property, can be submitted by a contributor as a patch.

1. Create your own fork of the code
2. Do the changes in your fork
3. If you like the change and think the project could use it:
   - Run `npm run build` to check compilation errors. Build also runs the linter that ensures the quality of the code.
   - Run `npm run test`. See [Common issues with unit tests](#common-issues-with-unit-tests).
   - See our [Code of conduct](https://github.com/noisy-witness/steem-wise-core/blob/master/CODE_OF_CONDUCT.md).
4. Send a pull request.



## How to report a bug

### Security issues

**Important**! If you find a security vulnerability, do NOT open an issue. Please email jedrzejblew@gmail.com.

To determine whether you are dealing with a security issue, ask yourself these two questions:

- Can I access something that's not mine, or something I shouldn't have access to?
- Can I disable something for other people?

If the answer to either of those two questions is "yes", then you're probably dealing with a security issue. Note that even if you answer "no" to both questions, you may still be dealing with a security issue, so if you're unsure, send an email to jedrzejblew@gmail.com.



### Other issues

When creating an issue please fill the following template:

> **The problem**:
> **I did**:
>
> **I expected to see**:
>
> **Instead, I saw**:
>
> **Version of steem-wise-core**: 
> **Version of nodejs**:
> **Links to gist with output / logs (or at least a picture):**

Also please properly **tag the issue**. E.g. with the tag "bug".



## How to suggest a feature or enhancement

Add an issue in issues panel on GitHub, and describe what feature would you like to see in Wise. The more detailed the description is, the better. Please add the **"enhancement" tag**.



## Community

Feel free to talk with us on our #wise channel on steem.chat: https://steem.chat/channel/wise .
You can also contact Jędrzej at jedrzejblew@gmail.com.



## Common issues with unit tests

1. **Some tests fail when the internet connection is poor**. Although it is generally thought to be a bad practice to make unit tests rely on the external resources, in this early stage of development this is just handier. We plan to separate unit tests from integration tests shortly. If this happens, check your internet connection and re-run the tests. Check if steemit RPC works correctly. If not — wait a few hours and try to rerun the tests. If it persists, do not bother to rerun the tests.

2. **(rarely) Tests that check if confirm_vote operations are correctly bound with vote operations may fail**. They may fail due to processing operations in batches. Rarely vote_operation may be in different batch than confirm_vote. These tests are:

   1. \[in test/api.spec.ts\]: Api#getWiseOperationsRelatedToDelegatorInBlock returns ConfirmVoteBoundWithVote instead of pure ConfirmVote
   2. \[in test/api.spec.ts\] Api#getWiseOperations Returns ConfirmVoteBoundWithVote instead of pure ConfirmVote (when accepted = true)
   3. \[in test/rule-weightforperiod.spec.ts\] ValidationContext.getWiseOperations(delegator, until=50 days) returns correct number of confirmations, all bound with vote operation

   Simply ignore this failing tests, or run them again.





***

_Based on: https://github.com/nayafia/contributing-template. Thank you for your collection of best practices and good examples!_