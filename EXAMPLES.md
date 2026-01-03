# A11yScan Usage Examples

This document provides practical examples of using A11yScan.

## API Usage Examples

### Example 1: Basic Audit Request

```bash
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Example 2: Audit with Error Handling

```javascript
async function auditWebsite(url) {
  try {
    const response = await fetch('http://localhost:3001/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log(`Health Score: ${data.data.healthScore}/100`);
      console.log(`Total Issues: ${data.data.totalIssues}`);
      console.log('Issues by Impact:', data.data.issuesByImpact);
    }
    
    return data;
  } catch (error) {
    console.error('Audit failed:', error);
    throw error;
  }
}

// Usage
auditWebsite('https://www.w3.org').then(console.log);
```

### Example 3: React Hook for Audits

```typescript
import { useMutation } from '@tanstack/react-query';
import type { A11yAuditResult, AuditRequest } from '@a11y-web-validator/types';

function useAudit() {
  return useMutation({
    mutationFn: async (request: AuditRequest) => {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Audit failed');
      }

      const data = await response.json();
      return data.data as A11yAuditResult;
    },
  });
}

// Component usage
function AuditForm() {
  const [url, setUrl] = useState('');
  const audit = useAudit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audit.mutate({ url });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
      />
      <button type="submit" disabled={audit.isPending}>
        {audit.isPending ? 'Scanning...' : 'Scan'}
      </button>
      
      {audit.data && (
        <div>
          <h3>Score: {audit.data.healthScore}/100</h3>
          <p>Total Issues: {audit.data.totalIssues}</p>
        </div>
      )}
    </form>
  );
}
```

## Sample Response

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "healthScore": 72,
    "totalIssues": 8,
    "issuesByImpact": {
      "critical": 1,
      "serious": 2,
      "moderate": 3,
      "minor": 2
    },
    "issues": [
      {
        "id": "color-contrast",
        "impact": "serious",
        "description": "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds",
        "help": "Elements must have sufficient color contrast",
        "helpUrl": "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
        "tags": ["wcag2aa", "wcag143"],
        "nodes": [
          {
            "html": "<button class=\"btn-primary\">Click me</button>",
            "target": ["#main > button"],
            "failureSummary": "Element has insufficient color contrast of 3.1:1 (foreground color: #777777, background color: #ffffff)"
          }
        ]
      }
    ]
  }
}
```

## Testing Locally

### Create a Test HTML File

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page</title>
</head>
<body>
  <!-- Missing alt text -->
  <img src="test.jpg">
  
  <!-- Poor contrast -->
  <p style="color: #999; background: #fff;">
    This text has poor contrast
  </p>
  
  <!-- Missing label -->
  <input type="text" placeholder="Name">
  
  <!-- Good example -->
  <button aria-label="Close dialog">×</button>
</body>
</html>
```

### Serve and Test

```bash
# Serve the file locally
pnpm dlx serve .

# In another terminal, audit it
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000/test.html"}'
```

## Common Issues and Solutions

### Issue: Browser timeout

**Solution:** Increase timeout in `apps/api/src/config.ts`:
```typescript
browserTimeout: 60000, // 60 seconds
```

### Issue: Too many concurrent scans

**Solution:** Implement a queue system or increase the limit:
```typescript
maxConcurrentScans: 5,
```

### Issue: Rate limiting

**Solution:** Adjust rate limits in config:
```typescript
rateLimitWindowMs: 15 * 60 * 1000,
rateLimitMaxRequests: 20,
```

