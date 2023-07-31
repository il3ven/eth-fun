//@format
import retry from "async-retry";
import fetch from "cross-fetch";
import { RPCError } from "./errors.js";

// NOTE: `AbortSignal.timeout` isn't yet supported:
// https://github.com/mysticatea/abort-controller/issues/35
export const AbortSignal = {
  timeout: function (value, url) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), value);
    return controller.signal;
  },
};

export async function send(options, body) {
  return retry(
    async (bail, attempt) => {
      if (options.timeout) {
        options.signal = AbortSignal.timeout(options.timeout, options.url);
      }

      let headers = Object.assign({}, { "Content-Type": "application/json" });
      if (options && options.headers) {
        headers = Object.assign(headers, options.headers);
      }

      let url;
      if (!options.url) {
        bail(new Error("`url` is a required property of `options`"));
        return;
      } else {
        url = options.url;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        signal: options.signal,
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        throw new Error("Received status code 429"); // retry
      }

      if (res.status === 403) {
        const answer = await res.text();
        if (answer.includes("invalid host specified")) {
          bail(
            new RPCError(
              `Status: 403 Forbidden; Ethereum node answered with: "${answer}".`
            )
          );
          return;
        } else {
          bail(
            new Error("Unexpected error. Please report on eth-fun repository.")
          );
          return;
        }
      }

      if (res.status >= 500) {
        bail(new RPCError(`RPC endpoint sent status: "${res.status}"`));
        return;
      }

      const result = await res.text();

      let data;
      try {
        data = JSON.parse(result);
      } catch (err) {
        bail(
          new RPCError(
            `Encountered error when trying to parse JSON body result: "${result}", error: "${err.toString()}"`
          )
        );
        return;
      }

      // NOTE: Finally, this matches when the full node throws a JSON
      // RPC error.
      if (data.error && data.error.message) {
        bail(new RPCError(`Error from fullnode: ${data.error.message}`));
        return;
      }

      return data.result;
    },
    {
      retries: options?.retry?.retries,
      // onRetry: (err, attempt) => console.log("retrying", attempt, err.message),
    }
  );
}
