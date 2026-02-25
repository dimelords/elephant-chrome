# ImageLibrary View Implementation

## What We Just Created

A new view in `elephant-chrome/src/views/ImageLibrary/` that:
- Searches for `core/image` documents using the existing `useDocuments` hook
- Displays images in a grid
- Supports text search by title
- Shows image metadata (title, credit)

## Next Steps

### 1. View Registration ✅

The view is now registered and exported in `src/views/index.tsx`.

Access it at: `http://localhost:5173/images`

### 2. Test With Mock Data

Create a test image document:

```bash
TOKEN=$(curl -s -X POST http://localhost:8180/realms/elephant/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=elephant" \
  -d "client_secret=elephant-secret" \
  -d "username=dev" \
  -d "password=dev" \
  -d "scope=openid doc_write" | jq -r '.access_token')

curl -X POST http://localhost:1080/twirp/tt.elephant.repository.Documents/Create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "type": "core/image",
      "title": "Test Image",
      "language": "sv-se",
      "uri": "core://image/test-123",
      "meta": [{
        "type": "core/image",
        "data": {
          "filename": "test.jpg",
          "mimetype": "image/jpeg",
          "credit": "John Doe",
          "copyright": "CC-BY"
        }
      }]
    }
  }'
```

### 3. Backend: Make Uploads Create Documents

Update `elephant-chrome/src/views/PrintEditor/ImagePlugin/lib/consume.ts`:

After line 72 where `repository.uploadFile()` completes, add:

```typescript
// Create core/image document
const imageDoc = await repository.createDocument({
  type: 'core/image',
  title: name,
  language: 'sv-se', // or from context
  uri: `core://image/${uuid}`,
  meta: [{
    type: 'core/image',
    data: {
      filename: name,
      mimetype: contentType,
      credit: '', // TODO: prompt user
      copyright: '',
      instructions: ''
    }
  }]
})
```

### 4. Backend: Add Asset Serving

In `elephant-repository`, add endpoint to serve images from S3:

```go
// GET /assets/{uuid}
// Returns presigned S3 URL or redirects to S3
```

For now, the view shows placeholder icons until this is implemented.

## How It Works

1. **No External Dependencies**: Uses local Elephant infrastructure
2. **Automatic Indexing**: elephant-index indexes images when documents are created
3. **Standard Search**: Uses same `useDocuments` hook as other views
4. **Reusable**: Click image to insert into documents (future enhancement)

## Current Limitations

- Images show placeholder icons (need asset serving endpoint)
- Upload doesn't auto-create documents yet (need backend update)
- No image editing/cropping (future enhancement)

## File Structure

```
elephant-chrome/src/views/ImageLibrary/
├── ImageLibrary.tsx    # Main view component
├── index.tsx           # Lazy loader export with ViewMetadata
└── README.md           # This file
```

Registered in:
- `src/views/index.tsx` - Exported as public view

## Dependencies

All dependencies already exist in elephant-chrome:
- `useDocuments` hook ✅
- View/ViewHeader components ✅
- QueryV1 types from elephant-api ✅

No new packages needed!
