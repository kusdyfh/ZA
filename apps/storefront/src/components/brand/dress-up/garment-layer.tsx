export interface GarmentLayerProps {
  /** The selected colour's authored asset. `undefined` renders the character's neutral base layer (`CharacterStage`'s `body` image) with nothing on top. */
  imageUrl?: string;
}

/**
 * The one swappable layer in the stack: a single rig-aligned garment image.
 * Changing colour swaps `imageUrl` to a *different authored asset* — never
 * a CSS filter/hue-rotate on one shared image (Character System spec,
 * "Product compositing rules": every colour is its own file).
 *
 * `key={imageUrl}` remounts the `<img>` on every swap so the fade-in
 * animation restarts each time, giving the "instant but not jarring"
 * colour-switch feel the spec calls for; `motion-reduce` drops the
 * animation to a plain cut per this codebase's motion policy (ADR 0028 §7).
 */
export function GarmentLayer({ imageUrl }: GarmentLayerProps) {
  if (!imageUrl) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative layered illustration, see CharacterStage doc comment
    <img
      key={imageUrl}
      src={imageUrl}
      alt=""
      aria-hidden="true"
      className="animate-brand-fade-in absolute inset-0 h-full w-full object-contain motion-reduce:animate-none"
    />
  );
}
