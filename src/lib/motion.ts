// Motion identity: Energetic, with a premium finish. Fast, decisive
// entrances on an expo curve, springs for things you touch, and long
// dramatic reveals reserved for hero moments.
export const ease = {
  standard: [0.4, 0, 0.2, 1] as const,
  enter: [0.16, 1, 0.3, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const dur = { quick: 0.18, standard: 0.5, slow: 0.9, dramatic: 1.2 };

export const spring = {
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.8 } as const,
  soft: { type: "spring", stiffness: 160, damping: 24 } as const,
  bouncy: { type: "spring", stiffness: 300, damping: 18 } as const,
};

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.enter } },
};

export const stagger = (step = 0.06) => ({
  hidden: {},
  show: { transition: { staggerChildren: step } },
});
