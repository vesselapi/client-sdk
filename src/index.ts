import API from './api';
import { GLOBAL_MODAL_ID, MESSAGE_TYPES, BASE_URL } from './constants';
import type { Config } from './types';

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

/**
 * The Vessel Client SDK. Responsible for rendering and interacting
 * with the authentication modal.
 */
const Vessel = (
  { onSuccess, onClose, onLoad }: Config,
  {
    baseUrl,
  }: {
    baseUrl: string;
  } = {
    baseUrl: BASE_URL,
  }
) => {
  const api = API({
    prefixUrl: baseUrl,
  });

  let modal: HTMLIFrameElement | null = null;

  // Check if the modal has already been loaded to the DOM.
  const isLoaded = () => !!document.getElementById(`${GLOBAL_MODAL_ID}`);

  // Ensure the modal element is loaded to the DOM
  const addModal = () => {
    const modalElement = document.getElementById(GLOBAL_MODAL_ID);
    if (!!modalElement) {
      modal = modalElement as HTMLIFrameElement;
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/modal/index.html`;
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
    modal = iframe;
  };

  // The message handler
  const handler = ({ data }: any) => {
    if (!modal) return;

    const { messageType, sessionToken } = data;

    switch (messageType) {
      case MESSAGE_TYPES.CLOSE_CONNECT:
        modal.style.display = 'none';
        onClose?.();
        break;
      case MESSAGE_TYPES.SEND_TOKEN:
        modal.style.display = 'none';
        onSuccess(sessionToken);
        break;
      case MESSAGE_TYPES.MODAL_READY:
        onLoad?.();
        break;
    }
  };

  // Pass a message to the modal
  const passMessage = ({
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

  // ------- init the modal
  if (!isLoaded()) {
    addModal();
    window.addEventListener('message', handler);
  }

  return {
    isLoaded,
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
      passMessage({
        messageType: MESSAGE_TYPES.START_MODAL_FLOW,
        payload: {
          integration,
          oauthAppId: getOauthAppId(),
          sessionToken,
          auth: authConfig,
        },
      });
    },
  };
};

export default Vessel;
