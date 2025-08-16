export const fmtEUR = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
  
  export const isMoney = (m: any): m is { type: 'value'; eur: number } =>
    m && m.type === 'value'
  