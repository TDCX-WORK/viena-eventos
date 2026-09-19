import { onRequest as __admin___path___js_onRequest } from "C:\\Users\\wstat\\Desktop\\viena-eventos\\functions\\admin\\[[path]].js"

export const routes = [
    {
      routePath: "/admin/:path*",
      mountPath: "/admin",
      method: "",
      middlewares: [],
      modules: [__admin___path___js_onRequest],
    },
  ]