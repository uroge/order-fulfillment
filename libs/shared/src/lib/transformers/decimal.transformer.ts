export const decimalToNumber = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};
