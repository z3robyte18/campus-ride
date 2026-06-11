// Simple linear regression for demand forecasting
exports.linearRegression = (data) => {
  const n = data.length;
  if (n < 2) return null;
  const sumX = data.reduce((s, _, i) => s + i, 0);
  const sumY = data.reduce((s, v) => s + v, 0);
  const sumXY = data.reduce((s, v, i) => s + i * v, 0);
  const sumXX = data.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x) => slope * x + intercept };
};

exports.forecastNextHours = (hourCounts) => {
  const model = exports.linearRegression(hourCounts);
  if (!model) return hourCounts;
  return Array.from({ length: 24 }, (_, i) => Math.max(0, Math.round(model.predict(i + 24))));
};