// users/types/filters.ts

export interface UserFilter {
  search: string;
  role: string;     // role id hoặc 'all'
  status: string;   // 'all' | 'online' | 'offline' | 'suspended'
}
