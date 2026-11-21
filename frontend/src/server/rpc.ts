import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ApiHandler } from "../../backend/dist/api/handler.js";

const rpcInputSchema = z.object({
  action: z.string(),
  params: z.any().optional(),
  token: z.string().optional(),
});

/**
 * Master TanStack Start server function that proxies requests directly to ApiHandler.
 */
export const serverRpcFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => rpcInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Authenticate session if token is provided or extracted
    const ctx = await ApiHandler.authenticate(data.token ? `Bearer ${data.token}` : undefined);
    return await ApiHandler.dispatch(data.action, data.params, ctx);
  });
