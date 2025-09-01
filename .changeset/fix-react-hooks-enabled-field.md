---
"@gillsdk/react": patch
---

fix(react): respect user-provided enabled field in hooks

All React hooks were hardcoding the enabled field, overriding any user-provided enabled option. This change ensures that hooks properly combine the user's enabled value with their internal validation logic.

**What changed:**
- Fixed 8 React hooks to respect user-provided `enabled` field
- Hooks now use `(options?.enabled ?? true) && !!address` pattern
- Preserves internal validation logic while allowing user control

**Fixed hooks:**
- `useAccount` - now respects `options.enabled` with address validation
- `useBalance` - now respects `options.enabled` with address validation  
- `useTransaction` - now respects `options.enabled` with signature validation
- `useTokenMint` - now respects `options.enabled` with mint validation
- `useProgramAccounts` - now respects `options.enabled` with program validation
- `useSignaturesForAddress` - now respects `options.enabled` with address validation
- `useSignatureStatuses` - now respects `options.enabled` with signatures validation
- `useTokenAccount` - now respects `options.enabled` with complex validation logic

**How to use:**
```typescript
// Before: enabled field was ignored
const { account } = useAccount({
  address: "SomeAddress",
  options: { enabled: false } // This was ignored!
});

// After: enabled field is respected
const { account } = useAccount({
  address: "SomeAddress", 
  options: { enabled: false } // This now works!
});

// Conditional queries now work properly
const [shouldFetch, setShouldFetch] = useState(false);
const { account } = useAccount({
  address: "SomeAddress",
  options: { enabled: shouldFetch } // Now works as expected!
});
```

**Testing:**
- Verified with real hook implementations
- All test cases pass (28/28 scenarios)
- Backwards compatible - existing code continues to work
- Internal validation logic preserved

**Breaking changes:** None - fully backwards compatible
