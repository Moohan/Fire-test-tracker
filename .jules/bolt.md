## 2026-05-12 - [Dashboard API Optimization]
**Learning:** The dashboard API was performing redundant O(N) log filtering and Date object instantiation for every test requirement of every piece of equipment. With multiple requirements per item, this resulted in significant overhead.
**Action:** Pre-process logs into Date objects once per equipment. Group logs by frequency-window and filter by type once per equipment to allow requirements to perform O(1) lookups or O(S) checks on much smaller sets.
