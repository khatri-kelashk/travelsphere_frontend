// constants/token.ts
export const getHeadersForHttpReq = (): Record<string, string> => {
    return {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    }
  }