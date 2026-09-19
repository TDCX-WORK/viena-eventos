import { onRequestPost as __api_reserva_js_onRequestPost } from "C:\\Users\\wstat\\Desktop\\viena-eventos\\functions\\api\\reserva.js"
import { onRequest as __admin___path___js_onRequest } from "C:\\Users\\wstat\\Desktop\\viena-eventos\\functions\\admin\\[[path]].js"

export const routes = [
    {
      routePath: "/api/reserva",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_reserva_js_onRequestPost],
    },
  {
      routePath: "/admin/:path*",
      mountPath: "/admin",
      method: "",
      middlewares: [],
      modules: [__admin___path___js_onRequest],
    },
  ]