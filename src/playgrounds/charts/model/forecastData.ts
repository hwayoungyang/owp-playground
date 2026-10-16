import { createProcessSeries } from './factoryData';

const actualRates = createProcessSeries({
  anchors: [240, 520, 1400, 2800, 4400, 5600, 6900],
  count: 182,
  seed: 98,
  volatility: 120,
});
let cumulative = 0;
export const observedOutput = actualRates.map((rate) => {
  cumulative += Math.max(0, rate);
  return Math.round(cumulative);
});
const lastActual = observedOutput.at(-1) ?? 0;
export const forecastOutput = [
  [6900, 7500, 9100, 11200],
  [6900, 8600, 15500, 32000],
  [6900, 7000, 6900, 7400],
].map((anchors, index) => {
  let total = lastActual;
  return [
    lastActual,
    ...createProcessSeries({ anchors, count: 183, seed: 110 + index, volatility: 110 }).map(
      (rate) => {
        total += Math.max(0, rate);
        return Math.round(total);
      },
    ),
  ];
});
