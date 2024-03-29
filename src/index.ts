import API from './api';
import { GLOBAL_MODAL_ID, MESSAGE_TYPES, BASE_URL } from './constants';
import type { Config, Url } from './types';

declare global {
  interface Window {
    __vessel__?: {
      callback?: (arg: any) => void;
    };
  }
}

export class VesselError extends Error {
  metadata: Record<string, string | number | boolean | undefined | null>;
  constructor(
    message: string,
    metadata?: Record<string, string | number | boolean | undefined | null>
  ) {
    super(message);
    this.metadata = metadata ?? {};
  }
}

const isSSR = () =>
  typeof window === 'undefined' ||
  !window.document ||
  !window.document.createElement;

type VesselClient = {
  location: 'server' | 'client';
  open: (options: {
    integrationId: string;
    oauthAppId?: string;
    authType?: string;
    getSessionToken: () => Promise<string>;
  }) => Promise<void>;
  destroy: () => Promise<void>;
};

/**
 * The Vessel Client SDK. Responsible for rendering and interacting
 * with the authentication modal.
 */
const Vessel = (
  { onSuccess, onClose, onLoad }: Config,
  {
    baseUrl,
  }: {
    baseUrl: Url;
  } = {
    baseUrl: BASE_URL,
  }
): VesselClient => {
  if (isSSR()) {
    return {
      location: 'server',
      open: async () => {},
      destroy: async () => {},
    };
  }

  if (!window.__vessel__) {
    window.__vessel__ = {};
  }

  const api = API({
    prefixUrl: baseUrl,
  });

  const addModal = () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://app.vessel.dev/modal/index.html`;
    iframe.id = GLOBAL_MODAL_ID;
    iframe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      z-index: 99999; 
      display: none;
      overflowX: hidden;
      overflowY: auto;
    `;
    document.body.appendChild(iframe);
    return iframe;
  };

  // The message handler
  const initHandler =
    (iframe: HTMLIFrameElement) =>
    ({ data }: any) => {
      if (!iframe) return;

      const { messageType, sessionToken } = data;

      switch (messageType) {
        case MESSAGE_TYPES.CLOSE_CONNECT:
          iframe.style.display = 'none';
          onClose?.();
          break;
        case MESSAGE_TYPES.SEND_TOKEN:
          iframe.style.display = 'none';
          onSuccess(sessionToken);
          break;
        case MESSAGE_TYPES.MODAL_READY:
          onLoad?.();
          break;
      }
    };

  const getModal = () => {
    const modal =
      (document.getElementById(GLOBAL_MODAL_ID) as HTMLIFrameElement) ??
      addModal();
    return modal;
  };

  const modal: HTMLIFrameElement = getModal();

  if (!window.__vessel__) {
    throw new VesselError('Invalid state: the vessel sdk was destroyed');
  }

  if (window.__vessel__?.callback) {
    window.removeEventListener('message', window.__vessel__?.callback);
  }

  window.__vessel__.callback = initHandler(modal);
  window.addEventListener('message', window.__vessel__.callback);

  // Pass a message to the modal
  const postMsg = ({
    messageType,
    payload,
  }: {
    messageType: string;
    payload: Record<string, any>;
  }) => {
    if (modal?.contentWindow) {
      modal.contentWindow.postMessage(
        {
          payload,
          messageType,
        },
        '*'
      );
    }
  };

  return {
    location: 'client',
    open: async ({
      integrationId,
      oauthAppId,
      authType,
      getSessionToken,
    }: {
      integrationId: string;
      oauthAppId?: string;
      authType?: string;
      getSessionToken: () => Promise<string>;
    }) => {
      if (!modal) {
        console.error('VesselError: Open called before modal loaded.');
        return;
      }

      if (authType && authType !== 'oauth2' && oauthAppId) {
        throw new VesselError(
          'If an oauthAppId is specified, the authType must be "oauth2"',
          {
            integrationId,
            oauthAppId,
            authType,
          }
        );
      }

      const sessionToken = await getSessionToken();
      const { integration } = await api.integrations.find(
        {
          id: integrationId,
        },
        { sessionToken }
      );

      const authConfig = authType
        ? integration.auth.find((a) => a.type === authType)
        : integration.auth.find((a) => a.default === true);

      if (!authConfig) {
        if (authType) {
          throw new VesselError(
            'The specified integration does not have an auth strategy for the given auth type',
            {
              integrationId,
              authType,
            }
          );
        }
        throw new VesselError(
          'The specified integration does not have a default auth strategy',
          {
            integrationId,
          }
        );
      }

      const getOauthAppId = () => {
        if (oauthAppId) return oauthAppId;
        if (authConfig.type !== 'oauth2') return null;
        return `v_oauthapp_${integrationId}_default`;
      };

      modal.style.display = 'block';
      postMsg({
        messageType: MESSAGE_TYPES.START_MODAL_FLOW,
        payload: {
          integration,
          oauthAppId: getOauthAppId(),
          sessionToken,
          auth: authConfig,
          baseUrl,
        },
      });
    },
    destroy: async () => {
      const modal = document.getElementById(GLOBAL_MODAL_ID);
      modal?.remove();
      delete window.__vessel__;
    },
  };
};

export default Vessel;
