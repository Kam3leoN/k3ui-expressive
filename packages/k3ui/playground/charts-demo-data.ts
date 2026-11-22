import type { ChartData, ChartOptions } from 'k3ux';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const barVertical: ChartData = {
  labels: months,
  datasets: [
    {
      label: 'Revenue',
      data: [12, 19, 14, 22, 18, 25],
      borderRadius: 6,
    },
  ],
};

export const barHorizontal: ChartData = {
  labels: ['Design', 'Dev', 'QA', 'Ops', 'Support'],
  datasets: [
    {
      label: 'Tickets',
      data: [42, 65, 28, 35, 50],
      borderRadius: 6,
    },
  ],
};

export const barHorizontalOpts: ChartOptions = {
  indexAxis: 'y',
};

export const barStacked: ChartData = {
  labels: months,
  datasets: [
    { label: 'Desktop', data: [8, 10, 9, 12, 11, 14], stack: 'traffic' },
    { label: 'Mobile', data: [6, 8, 7, 9, 10, 12], stack: 'traffic' },
  ],
};

export const barStackedOpts: ChartOptions = {
  scales: {
    x: { stacked: true },
    y: { stacked: true },
  },
};

export const barGrouped: ChartData = {
  labels: months,
  datasets: [
    { label: '2025', data: [10, 14, 12, 16, 15, 18] },
    { label: '2026', data: [12, 16, 15, 19, 18, 22] },
  ],
};

export const lineSimple: ChartData = {
  labels: months,
  datasets: [
    {
      label: 'Users',
      data: [120, 145, 132, 168, 190, 210],
      tension: 0,
    },
  ],
};

export const lineMulti: ChartData = {
  labels: months,
  datasets: [
    { label: 'Organic', data: [40, 48, 45, 52, 58, 63] },
    { label: 'Paid', data: [22, 28, 30, 34, 38, 42] },
    { label: 'Referral', data: [12, 14, 16, 15, 18, 20] },
  ],
};

export const lineSmooth: ChartData = {
  labels: months,
  datasets: [
    {
      label: 'NPS',
      data: [32, 38, 36, 44, 48, 52],
      tension: 0.4,
    },
  ],
};

export const lineArea: ChartData = {
  labels: months,
  datasets: [
    {
      label: 'Sessions',
      data: [220, 260, 240, 300, 340, 380],
      fill: true,
      tension: 0.25,
    },
  ],
};

export const pieData: ChartData = {
  labels: ['Product', 'Services', 'Support', 'Other'],
  datasets: [{ data: [42, 28, 18, 12] }],
};

export const doughnutData: ChartData = {
  labels: ['A', 'B', 'C', 'D'],
  datasets: [{ data: [35, 25, 22, 18] }],
};

export const radarData: ChartData = {
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency'],
  datasets: [
    { label: 'Model X', data: [65, 78, 70, 85, 72] },
    { label: 'Model Y', data: [72, 70, 80, 78, 75] },
  ],
};

export const polarData: ChartData = {
  labels: ['Red', 'Green', 'Yellow', 'Grey', 'Blue'],
  datasets: [{ data: [11, 16, 7, 3, 14] }],
};

export const bubbleData: ChartData = {
  datasets: [
    {
      label: 'Cluster A',
      data: [
        { x: 20, y: 30, r: 12 },
        { x: 40, y: 25, r: 18 },
        { x: 30, y: 45, r: 10 },
        { x: 50, y: 35, r: 15 },
      ],
    },
    {
      label: 'Cluster B',
      data: [
        { x: 15, y: 50, r: 8 },
        { x: 35, y: 55, r: 14 },
        { x: 55, y: 48, r: 11 },
      ],
    },
  ],
};

export const scatterData: ChartData = {
  datasets: [
    {
      label: 'Sample',
      data: [
        { x: -8, y: 4 },
        { x: -4, y: 2 },
        { x: 0, y: 6 },
        { x: 3, y: 1 },
        { x: 6, y: 8 },
        { x: 9, y: 3 },
        { x: 12, y: 7 },
      ],
    },
  ],
};
