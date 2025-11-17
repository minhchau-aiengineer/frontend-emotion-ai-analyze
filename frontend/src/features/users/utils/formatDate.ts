// users/utils/formatDate.ts

export const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString();
};
