const BARBELL = 45;
const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5];

export const PLATE_COLORS_MAP = {
  45:  '#ef4444',
  35:  '#3b82f6',
  25:  '#22c55e',
  10:  '#e5e7eb',
  5:   '#374151',
  2.5: '#f97316',
};

export function calculatePlates(totalWeight, barbell = BARBELL) {
  const remaining = Math.max(0, totalWeight - barbell);
  const perSide = remaining / 2;
  const plates = [];
  let left = perSide;

  for (const size of PLATE_SIZES) {
    const count = Math.floor(left / size);
    if (count > 0) {
      plates.push({ weight: size, count, color: PLATE_COLORS_MAP[size] });
      left -= count * size;
      left = Math.round(left * 10) / 10;
    }
  }

  const achievable = barbell + plates.reduce((s, p) => s + p.weight * p.count, 0) * 2;
  return { plates, perSide, achievable, barbell };
}

export { BARBELL };
