interface Options {
  sessionToken: string;
  body?: any;
}

const API = ({ prefixUrl }: { prefixUrl: string }) => ({
  post: async (path: string, options: Options) => {
    const response = await fetch(`${prefixUrl}${path}`, {
      method: 'POST',
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'x-vessel-session-token': options.sessionToken,
      },
    });
    const json = await response.json();
    if (json.error) {
      throw json.error;
    }
    return json.result;
  },
});

export default API;
