interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}

export default function PieChart({ data, size = 250 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>
      </div>
    );
  }

  const center = size / 2;
  const radius = size / 2 - 30;
  let currentAngle = -90; // Começar do topo

  const segments = data
    .filter(item => item.value > 0)
    .map((item) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Converter para radianos
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = center + radius * Math.cos(startAngleRad);
      const y1 = center + radius * Math.sin(startAngleRad);
      const x2 = center + radius * Math.cos(endAngleRad);
      const y2 = center + radius * Math.sin(endAngleRad);
      
      // Se o ângulo for 360 graus (círculo completo), desenhar círculo completo
      let pathData: string;
      if (angle >= 360) {
        pathData = `M ${center} ${center} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`;
      } else {
        const largeArcFlag = angle > 180 ? 1 : 0;
        pathData = [
          `M ${center} ${center}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z',
        ].join(' ');
      }
      
      // Calcular posição do texto (centro do segmento)
      // Se for círculo completo, texto no centro; senão, no meio do arco
      let textX: number, textY: number;
      if (angle >= 360) {
        textX = center;
        textY = center;
      } else {
        const midAngle = (startAngle + endAngle) / 2;
        const midAngleRad = (midAngle * Math.PI) / 180;
        const textRadius = radius * 0.65; // Posição do texto (65% do raio)
        textX = center + textRadius * Math.cos(midAngleRad);
        textY = center + textRadius * Math.sin(midAngleRad);
      }
      
      currentAngle += angle;
      
      return {
        path: pathData,
        color: item.color,
        label: item.label,
        value: item.value,
        percentage: percentage.toFixed(1),
        textX,
        textY,
        showText: percentage >= 3, // Só mostrar texto se for >= 3%
      };
    });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size, minHeight: size }}>
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {segments.map((item, index) => (
            <path
              key={index}
              d={item.path}
              fill={item.color}
              stroke="white"
              strokeWidth="3"
              className="dark:stroke-gray-800"
            />
          ))}
          {segments.map((item, index) => {
            if (!item.showText) return null;
            return (
              <text
                key={`text-${index}`}
                x={item.textX}
                y={item.textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
                style={{ 
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  pointerEvents: 'none'
                }}
              >
                {item.percentage}%
              </text>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 space-y-2 w-full">
        {segments.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700 dark:text-gray-300 capitalize">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">{item.value}</span>
              <span className="text-gray-500 dark:text-gray-500">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
