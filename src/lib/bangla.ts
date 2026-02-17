const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaNum(n: number): string {
  return n.toString().split('').map(d => banglaDigits[parseInt(d)] || d).join('');
}
