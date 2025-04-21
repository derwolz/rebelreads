# Object Storage Testing Guide

This guide describes the test scripts for the object storage functionality in the Sirened platform.

## Available Test Scripts

### 1. Simple FormData Test
Tests basic FormData API functionality with Blob creation.

```bash
node --experimental-fetch test-formdata.js
```

### 2. Blob and FormData Verification
Verifies that files can be properly loaded, converted to Blobs, and added to FormData.

```bash
node --experimental-fetch test-blob-formdata.js
```

### 3. Full API Integration Tests
Tests the complete object storage API integration. Requires the server to be running.

```bash
# JavaScript version
node --experimental-fetch test-object-storage.js

# TypeScript version
npx tsx --experimental-fetch test-object-storage.ts
```

## Notes

- All tests require the `--experimental-fetch` flag to enable the Fetch API in Node.js
- The API integration tests will only work when the server is running at localhost:3000
- These tests use the built-in FormData and Blob implementations in Node.js instead of external packages
- The TypeScript version requires `tsx` for execution

## Implementation Details

These tests demonstrate how to:

1. Read files from the filesystem
2. Convert file buffers to Blobs
3. Create FormData objects with blob values
4. Submit FormData to API endpoints (when server is available)
5. Verify file content after retrieval

## Troubleshooting

- If you see "fetch failed" errors, check that the server is running and the API endpoints are implemented
- If FormData or Blob is undefined, check that you're including the `--experimental-fetch` flag