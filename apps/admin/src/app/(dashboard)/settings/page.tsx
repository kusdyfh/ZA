import { Callout, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@za/ui';
import { PageHeader } from '@/components/page-header';

/**
 * No Store/Settings controller exists anywhere in the API — `Store` is
 * resolved server-side, read-only, from a single seeded row, and
 * `PERMISSION_KEYS.SETTINGS_MANAGE` is seeded but never enforced by any
 * route (ADR 0019 §4). This is a disclosed placeholder, not a form that
 * would silently fail to persist.
 */
export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Store Settings" />
      <Callout tone="warning" className="mb-6">
        There&apos;s no backend support for store settings yet. The API resolves the store (name, domain, currency,
        locale) server-side from a single seeded row — nothing here is editable until a real Settings endpoint
        ships.
      </Callout>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            When a Store Settings API exists, this page will let you edit the store name, domain, default
            currency, and locale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          For now, `SETTINGS_MANAGE` is a seeded permission key with no route behind it — see the Permissions
          page for the full list of keys and which ones are backed by a real feature today.
        </CardContent>
      </Card>
    </div>
  );
}
