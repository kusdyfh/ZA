export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center font-display text-2xl font-semibold text-pink-700 dark:text-pink-300">
          ZA Store
        </div>
        {children}
      </div>
    </div>
  );
}
