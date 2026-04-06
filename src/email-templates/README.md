# Email Templates

HTML email templates for the Slashr alert system. The Rust backend (`slash-notifier`) performs simple string replacement on these templates before sending via SES.

## Templates

### `verification.html` — Confirmation email

Sent when a user subscribes. Contains a single CTA to verify the subscription.

**Placeholders:**
- `{{TARGET_NAME}}` — Validator name or truncated address
- `{{CHAIN_NAME}}` — Human-readable chain name (e.g., "Solana", "Ethereum")
- `{{VERIFY_URL}}` — Full verification URL: `https://slashr.dev/alerts/verify?token={token}`

### `alert.html` — Incident notification

Sent when a matching penalty event is detected.

**Placeholders:**
- `{{VALIDATOR_NAME}}` — Validator name or truncated address
- `{{CHAIN_NAME}}` — Human-readable chain name
- `{{EVENT_DESCRIPTION}}` — Human-readable event description (use the same translations as the frontend)
- `{{EVENT_TIMESTAMP}}` — Formatted timestamp, e.g., "Apr 5, 2026 at 14:32 UTC"
- `{{STAKE_CONTEXT}}` — Optional stake-at-risk context, e.g., "123,456 SOL staked"
- `{{#IF_STAKE_CONTEXT}}...{{/IF_STAKE_CONTEXT}}` — Conditional block, include only if stake context is available
- `{{VALIDATOR_URL}}` — Full validator page URL: `https://slashr.dev/validator/{chain}/{address}`
- `{{TARGET_DESCRIPTION}}` — What the user subscribed to, e.g., "validator AbC123... on Solana"
- `{{MANAGE_URL}}` — Management page URL: `https://slashr.dev/alerts/manage?token={management_token}`
- `{{UNSUBSCRIBE_URL}}` — Unsubscribe URL: `https://slashr.dev/alerts/unsubscribe?token={unsubscribe_token}`

## Design constraints

- Inline CSS only (email clients strip `<style>` tags)
- No images, no tracking pixels
- Single column, max-width 600px
- Table-based CTA buttons (Outlook compatibility)
- Dark theme matching slashr.dev (`#0a0a0b` background)
- Total HTML under 20KB per template
- Mobile-friendly without media queries
