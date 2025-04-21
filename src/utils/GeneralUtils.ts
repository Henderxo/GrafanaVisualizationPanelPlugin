function colorToHex(color: string): string{

    if (color.startsWith('#')) {
      return color.substring(1);
    }
    
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
      const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
      const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
      return `${r}${g}${b}`;
    }
    
  
    return 'D4D4D4'; 
  };

  export {colorToHex}