<img src="https://opensearch.org/wp-content/uploads/2025/01/opensearch_logo_default.svg" height="64px">

- [Investigation](#investigation)
  - [Code Summary](#code-summary)
    - [Dashboards-Investigation](#dashboards-investigation)
    - [Repository Checks](#repository-checks)
    - [Issues](#issues)
  - [Plugin Components](#plugin-components)
    - [Notebooks](#notebooks)
  - [Contributing](#contributing)
  - [Getting Help](#getting-help)
  - [Code of Conduct](#code-of-conduct)
  - [Security](#security)
  - [License](#license)
  - [Copyright](#copyright)

# Investigation

Investigation is a plugin to help you to investigate error based on logs.

## Code Summary

### Dashboards-Investigation

|                          |                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Test and build           | [![Investigation Dashboards CI][dashboard-build-badge]][dashboard-build-link]                                      |
| Code coverage            | [![codecov][dashboard-codecov-badge]][codecov-link]                                                                |
| Distribution build tests | [![cypress tests][cypress-test-badge]][cypress-test-link] [![cypress code][cypress-code-badge]][cypress-code-link] |

### Repository Checks

|              |                                                                 |
| ------------ | --------------------------------------------------------------- |
| DCO Checker  | [![Developer certificate of origin][dco-badge]][dco-badge-link] |
| Link Checker | [![Link Checker][link-check-badge]][link-check-link]            |

### Issues

|                                                                |
| -------------------------------------------------------------- |
| [![good first issues open][good-first-badge]][good-first-link] |
| [![features open][feature-badge]][feature-link]                |
| [![enhancements open][enhancement-badge]][enhancement-link]    |
| [![bugs open][bug-badge]][bug-link]                            |
| [![untriaged open][untriaged-badge]][untriaged-link]           |
| [![nolabel open][nolabel-badge]][nolabel-link]                 |

[dco-badge]: https://github.com/opensearch-project/dashboards-investigation/actions/workflows/dco.yml/badge.svg
[dco-badge-link]: https://github.com/opensearch-project/dashboards-investigation/actions/workflows/dco.yml
[link-check-badge]: https://github.com/opensearch-project/dashboards-investigation/actions/workflows/link-checker.yml/badge.svg
[link-check-link]: https://github.com/opensearch-project/dashboards-investigation/actions/workflows/link-checker.yml
[dashboard-build-badge]: https://github.com/opensearch-project/dashboards-investigation/actions/workflows/dashboards-investigation-test-and-build-workflow.yml/badge.svg
[dashboard-build-link]: https://github.com/opensearch-project/dashboards-investigation/actions/workflows/dashboards-investigation-test-and-build-workflow.yml
[dashboard-codecov-badge]: https://codecov.io/gh/opensearch-project/dashboards-investigation/branch/main/graphs/badge.svg?flag=dashboards-investigation
[codecov-link]: https://codecov.io/gh/opensearch-project/dashboards-investigation
[cypress-test-badge]: https://img.shields.io/badge/Cypress%20tests-in%20progress-yellow
[cypress-test-link]: https://github.com/opensearch-project/opensearch-build/issues/1124
[cypress-code-badge]: https://img.shields.io/badge/Cypress%20code-blue
[cypress-code-link]: https://github.com/opensearch-project/dashboards-investigation/blob/main/.cypress/CYPRESS_TESTS.md
[opensearch-it-badge]: https://img.shields.io/badge/OpenSearch%20Plugin%20IT%20tests-in%20progress-yellow
[opensearch-it-link]: https://github.com/opensearch-project/opensearch-build/issues/1124
[opensearch-it-code-badge]: https://img.shields.io/badge/OpenSearch%20IT%20code-blue
[bwc-tests-badge]: https://img.shields.io/badge/BWC%20tests-in%20progress-yellow
[good-first-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-investigation/good%20first%20issue.svg
[good-first-link]: https://github.com/opensearch-project/dashboards-investigation/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22+
[feature-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-investigation/feature.svg
[feature-link]: https://github.com/opensearch-project/dashboards-investigation/issues?q=is%3Aopen+is%3Aissue+label%3Afeature
[bug-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-investigation/bug.svg
[bug-link]: https://github.com/opensearch-project/dashboards-investigation/issues?q=is%3Aopen+is%3Aissue+label%3Abug+
[enhancement-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-investigation/enhancement.svg
[enhancement-link]: https://github.com/opensearch-project/dashboards-investigation/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement+
[untriaged-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-investigation/untriaged.svg
[untriaged-link]: https://github.com/opensearch-project/dashboards-investigation/issues?q=is%3Aopen+is%3Aissue+label%3Auntriaged+
[nolabel-badge]: https://img.shields.io/github/issues-search/opensearch-project/dashboards-investigation?color=yellow&label=no%20label%20issues&query=is%3Aopen%20is%3Aissue%20no%3Alabel
[nolabel-link]: https://github.com/opensearch-project/dashboards-investigation/issues?q=is%3Aopen+is%3Aissue+no%3Alabel+

## Plugin Components

### Notebooks

Dashboards offer a solution for a few selected use cases, and are great tools if you’re focused on monitoring a known set of metrics over time. Notebooks enables contextual use of data with detailed explanations by allowing a user to combine saved visualizations, text, graphs and decorate data with other reference data sources.

## Contributing
- See [developer guide](DEVELOPER_GUIDE.md) and [how to contribute to this project](CONTRIBUTING.md).
- See [Integration Contribution Guide](https://github.com/opensearch-project/dashboards-investigation/wiki/Integration-Creation-Guide) for integration creation additional context

## Getting Help

If you find a bug, or have a feature request, please don't hesitate to open an issue in this repository.

For more information, see [project website](https://opensearch.org/) and [documentation](https://opensearch.org/docs).

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## Security

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## License

This project is licensed under the [Apache v2.0 License](LICENSE).

## Copyright

Copyright OpenSearch Contributors. See [NOTICE](NOTICE) for details.

