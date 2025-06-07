import React from 'react';
import { Box, Typography } from '@mui/material';

interface AnalyticsChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  type: 'line' | 'bar';
  color: string;
  height?: number;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  xKey,
  yKey,
  type,
  color,
  height = 300,
}) => {
  return React.createElement(
    Box,
    {
      sx: {
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #ccc',
        borderRadius: 1,
        bgcolor: 'grey.50'
      }
    },
    React.createElement(
      Typography,
      {
        variant: 'body2',
        color: 'text.secondary',
        textAlign: 'center'
      },
      `${type === 'line' ? '📈' : '📊'} Chart: ${data.length} data points (Install recharts for full visualization)`
    )
  );
};

export default AnalyticsChart;
