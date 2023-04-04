import { Integration } from './types';

interface Options {
  sessionToken: string;
  body?: any;
}

const API = ({ prefixUrl }: { prefixUrl: string }) => {
  const url = prefixUrl.endsWith('/')
    ? prefixUrl.replace(/\/$/, '')
    : prefixUrl;
  const post = async (path: `/${string}`, options: Options) => {
    const response = await fetch(`${url}${path}`, {
      method: 'POST',
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        'content-type': 'application/json',
        'x-vessel-session-token': options.sessionToken,
      },
    });
    const json = await response.json();
    if (json.error) {
      throw json.error;
    }
    return json.result;
  };
  return {
    post,
    integrations: {
      find: async (
        body: { id: string },
        auth: { sessionToken: string }
      ): Promise<{
        integration: Integration;
      }> => {
        return post('/api/integrations/find', {
          sessionToken: auth.sessionToken,
          body: body,
        });
      },
    },
  };
};

export default API;
