interface Options {
  token: string;
  body?: any;
}

// turn into ky like interface
export default class API {
  private prefixUrl: string;

  constructor({ prefixUrl }: { prefixUrl: string }) {
    this.prefixUrl = prefixUrl;
  }

  async post(path: string, options: Options) {
    const response = await fetch(`${this.prefixUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(options.body),
      headers: {
        'Content-Type': 'application/json',
        'x-vessel-session-token': options.token,
      },
    });
    return await response.json();
  }
}
