import API from './api';
import { GLOBAL_MODAL_ID, MESSAGE_TYPES } from './constants';
import type { Config, IntegrationId } from './types';

const api = new API({
  prefixUrl: process.env.API_URL as string,
});

/**
 * The Vessel Client SDK. Responsible for rendering and interacting
 * with the authentication modal.
 */
export default class Vessel {
  private handlers: Config;
  private iframe: HTMLIFrameElement | null = null;

  constructor({ onSuccess, onClose, onLoad }: Config) {
    this.handlers = { onSuccess, onClose, onLoad };
    this.initModal();
  }

  /**
   * Ensure the modal has been loaded to the DOM.
   */
  private initModal() {
    // Ensure the modal hasn't already been loaded.
    const modal = document.getElementById(GLOBAL_MODAL_ID);
    if (!!modal) {
      this.iframe = modal as HTMLIFrameElement;
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
    this.iframe = iframe;

    this.initMessageHandler();
  }

  /**
   * Used to handle messages sent from the modal iframe.
   */
  private initMessageHandler() {
    const handler = ({ data }: any) => {
      // ensure the modal exists.
      if (!this.iframe) return;

      const { messageType, sessionToken } = data;
      const { onClose, onSuccess, onLoad } = this.handlers;

      switch (messageType) {
        case MESSAGE_TYPES.CLOSE_CONNECT:
          this.iframe.style.display = 'none';
          onClose && onClose();
          break;
        case MESSAGE_TYPES.SEND_TOKEN:
          this.iframe.style.display = 'none';
          onSuccess(sessionToken);
          break;
        case MESSAGE_TYPES.MODAL_READY:
          onLoad && onLoad();
          break;
      }
    };

    window.addEventListener('message', handler);
  }

  /**
   * Used to pass messages to the modal iframe.
   */
  private passMessage({
    messageType,
    payload,
  }: {
    messageType: string;
    payload: Record<string, any>;
  }) {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        {
          payload,
          messageType,
        },
        '*'
      );
    }
  }

  /**
   * Check if the modal has already been loaded to the DOM.
   * This is useful in situations where the consumer wants to check if
   * the modal has already been loaded before calling the constructor.
   */
  static get isLoaded() {
    return !!document.getElementById(`${GLOBAL_MODAL_ID}`);
  }

  /**
   * Loads necessary config data and starts the modal connection flow.
   */
  async open({
    integrationId,
    credentialsId,
    getSessionToken,
  }: {
    integrationId: IntegrationId;
    credentialsId?: string;
    getSessionToken: () => Promise<string>;
  }) {
    if (!this.iframe) {
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

    this.iframe.style.display = 'block';
    this.passMessage({
      messageType: MESSAGE_TYPES.START_MODAL_FLOW,
      payload: { config },
    });
  }
}
