import axios from 'axios';
import liff from '@line/liff';

export interface ErrorResult {
  shouldLogout: boolean;
  message: string;
}

export function handleLiffError(error: unknown, defaultMessage: string): ErrorResult {
  // Handle 401 Unauthorized - token expired
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return {
      shouldLogout: true,
      message: 'Session expired. Please login again.',
    };
  }

  // Handle axios errors
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return {
        shouldLogout: false,
        message: error.response.data?.message || defaultMessage,
      };
    } else if (error.request) {
      return {
        shouldLogout: false,
        message: 'Cannot reach server. Please check your connection.',
      };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      shouldLogout: false,
      message: error.message,
    };
  }

  return {
    shouldLogout: false,
    message: defaultMessage,
  };
}

export function performLogout() {
  if (liff.isLoggedIn()) {
    liff.logout();
  }
  liff.login({ redirectUri: window.location.href });
}
