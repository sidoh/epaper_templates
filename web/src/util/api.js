import axios from "axios";
import { ConcurrencyManager } from "axios-concurrency";

const api = axios.create({
  baseURL: "/api/v1"
});

ConcurrencyManager(api, 1);

export default api;