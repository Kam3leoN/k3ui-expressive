import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  PieController,
  DoughnutController,
  ArcElement,
  RadarController,
  PolarAreaController,
  BubbleController,
  ScatterController,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Filler,
  Legend,
  Title,
  Tooltip,
  Colors,
} from 'chart.js';

let registered = false;

/** Register Chart.js controllers / elements / scales / plugins once (tree-shakeable). */
export function ensureChartJsRegistered(): typeof Chart {
  if (!registered) {
    Chart.register(
      BarController,
      BarElement,
      LineController,
      LineElement,
      PointElement,
      PieController,
      DoughnutController,
      ArcElement,
      RadarController,
      PolarAreaController,
      BubbleController,
      ScatterController,
      CategoryScale,
      LinearScale,
      RadialLinearScale,
      Filler,
      Legend,
      Title,
      Tooltip,
      Colors,
    );
    registered = true;
  }
  return Chart;
}

export { Chart };
export type { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';
