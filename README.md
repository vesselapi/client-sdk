# About

Vessel is an embedded integrations OS making it easy to provide native GTM (go to market) integrations for Salesforce, HubSpot, Outreach, Ringcentral, and much more. Use our Unified API, Actions API, or Managed ETL to pull and push data to these end platforms in a variety of ways and schemas.

For more information including a more in-depth tutorial and documentation visit [docs.vessel.dev](https://docs.vessel.dev)

## Installing

```bash Terminal
npm install @vesselapi/react-vessel-link
```

```bash Terminal
yarn add @vesselapi/react-vessel-link
```

## Usage

When the Vessel client SDK is instantiated, a hidden modal iframe is attached to your application. When opened, the modal iframe will show the authentication flow for a given integration to your user.

**Default Usage**

There are several important configuration options when opening the modal. The first is the `integrationId` which is required and will select the integration to open. To get a dynamic list of the integrations we support, including their `integrationId`, `name`, and `iconURI` you can call the [Integrations List](https://docs.vessel.dev/home/get-all-integrations) endpoint.

```jsx React
export default function App() {
  const { open } = Vessel(...);

  return (
    <button
      onClick={() =>
        open({
          integrationId: 'outreach',
          getSessionToken: () => api.get('/session-token'),
        })
      }
    >
      Connect Outreach
    </button>
  );
}
```

**Change Auth Type**

Vessel will use the default authentication method if none is provided. However, if an integration supports multiple authentication methods - say API key and OAuth - you can configure the modal to use one or the other by utilizing the `authType` property. For a list of supported auth types per-integration, please check the `Platform` object in the [integrations library](https://github.com/vesselapi/integrations).

```jsx React
export default function App() {
  const { open } = Vessel(...);

  return (
    <button
      onClick={() =>
        open({
          authType: 'apiKey',
          integrationId: 'outreach',
          getSessionToken: () => api.get('/session-token'),
        })
      }
    >
      Connect Outreach
    </button>
  );
}
```

**Change OAuth app used**

If the integration requires OAuth authentication and Vessel provides a pre-approved default application, that app will be used to authenticate your user.

However, if your plan supports it, you can configure a custom OAuth application that you've created to be used when authenticating your user. To do so, please follow the [manage oauth apps guide](https://docs.vessel.dev/home/managing-oauth-apps). Once you've retrieved an `oauthAppId` you can pass it to the modal open.

```jsx React
export default function App() {
  const { open } = Vessel(...);

  return (
    <button
      onClick={() =>
        open({
          oauthAppId: '....',
          integrationId: 'outreach',
          getSessionToken: () => api.get('/session-token'),
        })
      }
    >
      Connect Outreach
    </button>
  );
}

```

## Issues/Questions

Contact us at `support@vessel.dev`
