export interface IDatabase {
  initialize(): Promise<void>;
  getInstance(): any;
  query<T = any>(queryString: string, params?: any[]): Promise<T>;
  close(): Promise<void>;
}