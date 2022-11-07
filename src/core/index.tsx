export const getLogger: (tag: string) => (...args: any) => void =
    tag => (...args) => console.log(tag, ...args);

export interface ResponseProps<T> {
  data: T;
}

const log = getLogger('api');
export const baseUrl = 'localhost:3000';

export function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
  log(`${fnName} - started`);
  return promise
    .then(res => {
      log(`${fnName} - succeeded`);
      return Promise.resolve(res.data);
    })
    .catch(err => {
      log(`${fnName} - failed`);
      return Promise.reject(err);
    });
}

export const config = {
  headers: {
    'Content-Type': 'application/json'
  }
};

export const authConfig = (token?: string | null) => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
});