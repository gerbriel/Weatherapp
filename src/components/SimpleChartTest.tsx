import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const SimpleChartTest: React.FC = () => {
  console.log('🧪 SimpleChartTest: Component rendering');
  
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Test Data',
        data: [12, 19, 3, 5, 2],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Simple Test Chart',
      },
    },
  };

  try {
    return (
      <div className="bg-white p-4 rounded-lg shadow border-2 border-blue-500">
        <h3 className="text-lg font-bold mb-4 text-blue-600">Chart.js Test Component</h3>
        <div className="bg-gray-100 p-2 mb-4 text-sm">
          <p>✅ Component rendered</p>
          <p>✅ Chart.js imported</p>
          <p>✅ Data prepared: {data.datasets[0].data.length} points</p>
        </div>
        <div className="h-64 w-full bg-gray-50 border rounded">
          <Bar data={data} options={options} />
        </div>
        <p className="text-xs text-gray-500 mt-2">If you see this text but no chart above, there's a Chart.js rendering issue.</p>
      </div>
    );
  } catch (error) {
    console.error('🚨 SimpleChartTest error:', error);
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Chart Test Error:</strong> {String(error)}
      </div>
    );
  }
};