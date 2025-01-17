var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __require = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.js
__export(exports, {
  CALLTYPES: () => CALLTYPES,
  blockNumber: () => getBlockNo,
  call: () => call,
  command: () => command,
  concatio: () => concatio,
  decodeLog: () => decodeLog,
  decodeParameters: () => decodeParameters,
  encodeFunctionCall: () => encodeFunctionCall,
  encodeFunctionSignature: () => encodeFunctionSignature,
  encodeParameters: () => encodeParameters,
  errors: () => errors,
  flags: () => flags,
  getBlockByNumber: () => getBlockByNumber,
  getLogs: () => getLogs,
  getStorageAt: () => getStorageAt,
  getTransactionReceipt: () => getTransactionReceipt,
  io: () => io,
  nodes: () => nodes_default,
  testLength: () => testLength,
  toHex: () => toHex
});

// src/transport.js
var import_async_retry = __toModule(require("async-retry"));
var import_cross_fetch = __toModule(require("cross-fetch"));

// src/errors.js
var RPCError = class extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RPCError);
    }
    this.name = "RPCError";
  }
};
var ValueError = class extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValueError);
    }
    this.name = "ValueError";
  }
};

// src/transport.js
var AbortSignal = {
  timeout: function(value, url) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), value);
    return controller.signal;
  }
};
async function send(options, body) {
  return (0, import_async_retry.default)(async (bail, attempt) => {
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
    const res = await (0, import_cross_fetch.default)(url, {
      method: "POST",
      headers,
      signal: options.signal,
      body: JSON.stringify(body)
    });
    if (res.status === 429) {
      throw new Error("Received status code 429");
    }
    if (res.status === 403) {
      const answer = await res.text();
      if (answer.includes("invalid host specified")) {
        bail(new RPCError(`Status: 403 Forbidden; Ethereum node answered with: "${answer}".`));
        return;
      } else {
        bail(new Error("Unexpected error. Please report on eth-fun repository."));
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
      bail(new RPCError(`Encountered error when trying to parse JSON body result: "${result}", error: "${err.toString()}"`));
      return;
    }
    if (data.error && data.error.message) {
      bail(new RPCError(`Error from fullnode: ${data.error.message}`));
      return;
    }
    return data.result;
  }, {
    retries: options?.retry?.retries
  });
}

// src/constants.js
var constants = {
  id: 1,
  jsonrpc: "2.0"
};
var constants_default = constants;

// src/blockNumber.js
var { id, jsonrpc } = constants_default;
async function getBlockNo(options) {
  const body = blockNoFactory();
  return await send(options, body);
}
function blockNoFactory() {
  return { method: "eth_blockNumber", params: [], id, jsonrpc };
}

// src/utils.js
function toHex(num) {
  if (typeof num !== "number")
    throw new ValueError(`toHex expects typeof "number", input type: "${typeof num}"`);
  return `0x${num.toString(16)}`;
}

// src/getBlockByNumber.js
var { id: id2, jsonrpc: jsonrpc2 } = constants_default;
async function getBlockByNumber(options, blockNumber, includeTxBodies) {
  return await send(options, {
    method: "eth_getBlockByNumber",
    params: [blockNumber, includeTxBodies],
    id: id2,
    jsonrpc: jsonrpc2
  });
}

// src/getTransactionReceipt.js
async function getTransactionReceipt(options, txId) {
  return await send(options, __spreadValues({
    method: "eth_getTransactionReceipt",
    params: [txId]
  }, constants_default));
}

// src/getStorageAt.js
var import_cross_fetch2 = __toModule(require("cross-fetch"));
var { id: id3, jsonrpc: jsonrpc3 } = constants_default;
function bodyFactory(addr, index, blockNo) {
  if (typeof blockNo !== "string") {
    blockNo = toHex(blockNo);
  }
  return {
    method: "eth_getStorageAt",
    params: [addr, toHex(index), blockNo],
    id: id3,
    jsonrpc: jsonrpc3
  };
}
async function getStorageAt(node, addr, index, blockNo) {
  const body = bodyFactory(addr, index, blockNo);
  return await send(node, body);
}

// src/nodes.js
var nodes = {
  mainnet: [
    {
      name: "MyCrypto",
      endpoint: "https://api.mycryptoapi.com/eth",
      website: "https://mycrypto.com/"
    },
    {
      name: "1inch",
      endpoint: "https://web3.1inch.exchange/",
      website: "https://1inch.exchange/"
    },
    {
      name: "Cloudflare",
      endpoint: "https://cloudflare-eth.com/",
      website: "https://cloudflare-eth.com/"
    },
    {
      name: "Blockscout",
      endpoint: "https://mainnet-nethermind.blockscout.com/",
      website: "https://blockscout.com"
    },
    {
      name: "MyEtherWallet",
      endpoint: "https://nodes.mewapi.io/rpc/eth",
      website: "https://myetherwallet.com/"
    },
    {
      name: "LinkPool",
      endpoint: "https://main-rpc.linkpool.io/",
      website: "https://linkpool.io/"
    },
    {
      name: "AVADO",
      endpoint: "https://mainnet.eth.cloud.ava.do/",
      website: "https://ava.do"
    }
  ]
};
var nodes_default = nodes;

// src/call.js
var import_web3_eth_abi = __toModule(require("web3-eth-abi"));
var { id: id4, jsonrpc: jsonrpc4 } = constants_default;
var encodeFunctionSignature = (...args) => import_web3_eth_abi.default.encodeFunctionSignature(...args);
var encodeFunctionCall = (...args) => import_web3_eth_abi.default.encodeFunctionCall(...args);
var encodeParameters = (...args) => import_web3_eth_abi.default.encodeParameters(...args);
var decodeParameters = (types, output) => {
  const res = import_web3_eth_abi.default.decodeParameters(types, output);
  const parsedResults = [];
  for (let i = 0; i < res.__length__; i++) {
    parsedResults.push(res[i]);
  }
  return parsedResults;
};
var decodeLog = (...args) => import_web3_eth_abi.default.decodeLog(...args);
async function call(options, from, to, data, blockNumber = "latest") {
  const body = {
    method: "eth_call",
    params: [
      {
        from,
        to,
        data
      },
      blockNumber
    ],
    id: id4,
    jsonrpc: jsonrpc4
  };
  if (!from) {
    delete body.params[0].from;
  }
  return await send(options, body);
}

// src/weirollCall.js
var CALLTYPES = {
  STATICCALL: 2
};
function testLength(value, lengthBytes) {
  const maxint = Math.pow(2, 8 * lengthBytes);
  if (value >= maxint) {
    throw new Error(`Cannot take input that produces an output > uint${8 * lengthBytes}.MAX_INT. Actual value: ${value}`);
  }
}
function command(sel, f, inp, out, target) {
  const lengthBytes = 32;
  const buf = Buffer.concat([sel, f, inp, out, target]);
  if (buf.length !== lengthBytes) {
    throw new Error(`Cannot take input that produces an output of more or less than ${lengthBytes} bytes of length. Actual length: ${buf.length}`);
  }
  return buf;
}
function flags(tup, ext, calltype) {
  const reserved = 0;
  const flag = tup + ext + reserved + calltype;
  const lengthBytes = 1;
  testLength(flag, lengthBytes);
  const buf = Buffer.alloc(lengthBytes);
  buf.writeUInt8(flag);
  return buf;
}
function io(isVariable, idx) {
  if (typeof isVariable !== "boolean") {
    throw new Error(`isVariable must be a boolean. Actual Value: ${isVariable}`);
  }
  const variability = isVariable ? 128 : 0;
  const result = variability + idx;
  const maxint = Math.pow(2, 8);
  const lengthBytes = 1;
  testLength(result, lengthBytes);
  const buf = Buffer.alloc(lengthBytes);
  buf.writeUInt8(result);
  return buf;
}
function concatio(inputs) {
  const lengthBytes = 6;
  const buf = Buffer.concat(inputs);
  if (buf.length !== lengthBytes) {
    throw new Error(`Cannot take input that produces an output of more or less than ${lengthBytes} bytes of length. Actual length: ${buf.length}`);
  }
  return buf;
}

// src/getLogs.js
var { id: id5, jsonrpc: jsonrpc5 } = constants_default;
async function getLogs(options, { fromBlock, toBlock, address, topics, limit } = {}) {
  const body = {
    method: "eth_getLogs",
    params: [{ fromBlock, toBlock, address, topics, limit }],
    id: id5,
    jsonrpc: jsonrpc5
  };
  for (const value in body.params[0]) {
    if (!body.params[0][value]) {
      delete body.params[0][value];
    }
  }
  return await send(options, body);
}

// src/index.js
var errors = {
  RPCError
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CALLTYPES,
  blockNumber,
  call,
  command,
  concatio,
  decodeLog,
  decodeParameters,
  encodeFunctionCall,
  encodeFunctionSignature,
  encodeParameters,
  errors,
  flags,
  getBlockByNumber,
  getLogs,
  getStorageAt,
  getTransactionReceipt,
  io,
  nodes,
  testLength,
  toHex
});
