import { GLOBAL_MODAL_ID, MESSAGE_TYPES } from './constants';
import type { Config } from './types';

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

  private initMessagePassing() {
    window.addEventListener('message', ({ data }: any) => {
      // ensure the modal exists.
      if (!this.iframe) return;

      const { messageType, sessionToken } = data;

      switch (messageType) {
        case MESSAGE_TYPES.CLOSE_CONNECT:
          this.iframe.style.display = 'none';
          this.handlers.onClose && this.handlers.onClose();
          break;
        case MESSAGE_TYPES.SEND_TOKEN:
          this.iframe.style.display = 'none';
          this.handlers.onSuccess(sessionToken);
          break;
      }
    });
  }

  /**
   * Ensure the modal has been loaded to the DOM.
   */
  private initModal() {
    // ensure the modal hasn't already been loaded.
    const modal = document.getElementById(GLOBAL_MODAL_ID) as HTMLIFrameElement;
    if (!!modal) {
      this.iframe = modal;
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
  }

  /**
   * Check if the modal has already been loaded to the DOM.
   * This is useful in situations where the consumer wants to check if
   * the modal has already been loaded before calling the constructor.
   */
  static get isLoaded() {
    return !!document.getElementById(`${GLOBAL_MODAL_ID}`);
  }

  open() {}
}
