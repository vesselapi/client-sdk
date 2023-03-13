interface Options {
  sessionToken: string;
  body?: any;
}

const API = ({ prefixUrl }: { prefixUrl: string }) => ({
  post: async (path: string, options: Options) => {
    const response = await fetch(`${prefixUrl}${path}`, {
      method: 'POST',
      body: options.body,
      headers: {
        'Content-Type': 'application/json',
        'x-vessel-session-token': options.sessionToken,
      },
    });
    return await response.json();
  },
});

export default API;
