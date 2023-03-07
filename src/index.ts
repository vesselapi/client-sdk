import API from './api';
import { GLOBAL_MODAL_ID, MESSAGE_TYPES } from './constants';
import type { Config } from './types';

const api = API({
  prefixUrl: 'https://api.vessel.land',
});

/**
 * The Vessel Client SDK. Responsible for rendering and interacting
 * with the authentication modal.
 */
const Vessel = ({ onSuccess, onClose, onLoad }: Config) => {
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
    iframe.src = process.env.MODAL_URL as string;
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
      credentialsId,
      getSessionToken,
    }: {
      integrationId: string;
      credentialsId?: string;
      getSessionToken: () => Promise<string>;
    }) => {
      if (!modal) {
        console.error('VesselError: Open called before modal loaded.');
        return;
      }

      const token = await getSessionToken();
      const { config } = await api.post('auth/integration-configs/get', {
        token,
        body: {
          integrationId,
          credentialsId,
        },
      });

      modal.style.display = 'block';
      passMessage({
        messageType: MESSAGE_TYPES.START_MODAL_FLOW,
        payload: { config },
      });
    },
  };
};

export default Vessel;
