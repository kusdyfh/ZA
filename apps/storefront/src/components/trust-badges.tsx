import { Truck, RotateCcw, ShieldCheck, Heart } from 'lucide-react';

const BADGES = [
  { icon: Truck, label: 'Fast dispatch', description: 'Orders processed within 1 business day' },
  { icon: RotateCcw, label: 'Easy returns', description: '14-day return window' },
  { icon: ShieldCheck, label: 'Secure checkout', description: 'Your details stay private' },
  { icon: Heart, label: 'Made with care', description: 'Fabrics chosen for long shifts' },
];

export function TrustBadges() {
  return (
    <section className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4">
        {BADGES.map((badge) => (
          <div key={badge.label} className="flex flex-col items-center gap-2 text-center">
            <badge.icon className="h-6 w-6 text-pink-600 dark:text-pink-300" aria-hidden="true" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{badge.label}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{badge.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
