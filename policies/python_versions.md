# Python Versions

Scope: All Python based libraries

## Policy - PyPi

Scope: All projects publishing to PyPi

For PyPi published libraries, maintain 2 or 3 major versions
  - The primary version will be the version out for longer than 1 year
  - Once latest version out for 1 year
    - It becomes primary version
    - Drop any latest-2 or before major versions
  - If the latest version is less than a year old, don't drop older version support yet
  - Example
    - Py3.15 came out October 2026
    - Py3.13 will be supported until September 2027
    - Py3.14 remains primary

## Policy - Dockerfiles

- Switch to the latest Python version after the first minor release
  - e.g. Don't use `3.15.0`, start usage from `3.15.1`

## Policy - Home Assistant

Follow Home Assistants requirements. Maintain older versions of Python where required by the supported range of Home Assistant versions.

### Exceptions

- `homeassistant-repl` is aimed at expert developers, and has support limited to HA `2026.8` and later only

## Policy - All

- Use a test matrix on `ci` Github Action workflows that tests every major version in the range, e.g. `3.13`,`3.14` and `3.15`
- By exception, multiple minor versions may be added,e.g. separately test `3.14.3` and `3.14.4`. This will happen only where there's known issues introduced in the minor update.
- Nothing in this policy covers a `4.0.0` or similar Python release. Ignore all such releases until policy is reviewed to handle it.
- New features in latest Python releases will not be exploited until that version is the last in the supported range
  - Exception for high priority usage that can be gated for that version only, or more cumbersome workarounds for earlier releases
  - Exception for development only usage, e.g. profiling

## Reference

## Python 3.15

`3.15.0` released Oct 14th 2026

