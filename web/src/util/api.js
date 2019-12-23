import React, { useMemo } from 'react'
import axios from "axios";
import { ConcurrencyManager } from "axios-concurrency";
import useWebSocket from 'react-use-websocket';

const api = axios.create({
  baseURL: "/api/v1"
});

export const useEpaperWebsocket = () => {
  const options = useMemo(() => ({
    shouldReconnect: (closeEvent) => true
  }), []);

  var loc = window.location, socketUrl;
  if (loc.protocol === "https:") {
      socketUrl = "wss:";
  } else {
      socketUrl = "ws:";
  }
  socketUrl += "//" + loc.host;
  socketUrl += "/socket";

  return useWebSocket(socketUrl, options);
}

ConcurrencyManager(api, 1);

export default api;