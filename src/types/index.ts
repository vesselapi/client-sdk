export interface Config {
  // Callback function, invoked when the user successfully authenticates and passed
  // the sessionToken. The sessionToken is exchanged for an accessToken on the backend.
  onSuccess: (sessionToken: string) => void;

  // Callback function, invoked when the modal is closed by the user.
  onClose?: () => void;

  // Callback function, invoked when the modal has been loaded and is
  // ready to be opened.
  onLoad?: () => void;
}
