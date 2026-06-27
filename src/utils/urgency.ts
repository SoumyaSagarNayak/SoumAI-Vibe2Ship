export const getUrgencyColor = (urgency: string = 'normal') => {
  switch (urgency) {
    case 'critical':
      return {
        bg: 'bg-m-red/5',
        border: 'border-m-red/30',
        text: 'text-m-red',
        dot: 'bg-m-red',
        badge: 'border-m-red/30 bg-m-red/5 text-m-red',
        label: 'Critical',
        hex: '#e22718'
      };
    case 'important':
      return {
        bg: 'bg-m-blue-dark/5',
        border: 'border-m-blue-dark/30',
        text: 'text-m-blue-dark',
        dot: 'bg-m-blue-dark',
        badge: 'border-m-blue-dark/30 bg-m-blue-dark/5 text-m-blue-dark',
        label: 'Important',
        hex: '#1c69d4'
      };
    case 'medium':
      return {
        bg: 'bg-success/5',
        border: 'border-success/30',
        text: 'text-success',
        dot: 'bg-success',
        badge: 'border-success/30 bg-success/5 text-success',
        label: 'Medium',
        hex: '#0fa336'
      };
    case 'normal':
    default:
      return {
        bg: 'bg-warning/5',
        border: 'border-warning/30',
        text: 'text-warning',
        dot: 'bg-warning',
        badge: 'border-warning/30 bg-warning/5 text-warning',
        label: 'Normal',
        hex: '#f4b400'
      };
  }
};
