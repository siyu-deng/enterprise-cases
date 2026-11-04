import assert from "node:assert/strict";
import test from "node:test";
import { localCliEnvironment, runLocalWecom } from "./wecom-local.mjs";

const home = "/test-user";
const environment = { WECOM_CLI_CONFIG_DIR: "~/.config/wecom-enterprise-cases" };

test("local profile cannot silently use the default credentials or an external token", () => {
  assert.equal(localCliEnvironment(environment, home).WECOM_CLI_CONFIG_DIR, "/test-user/.config/wecom-enterprise-cases");
  assert.throws(() => localCliEnvironment({}, home));
  assert.throws(() => localCliEnvironment({ WECOM_CLI_CONFIG_DIR: "~/.config/wecom" }, home));
  assert.throws(() => localCliEnvironment({ ...environment, WECOM_CLI_ACCESS_TOKEN: "private-fixture" }, home));
});

test("status and an existing authorization never initialize or send messages", () => {
  const calls = [];
  const options = {
    environment, home,
    execute: (binary, args, config) => {
      assert.equal(binary, "wecom-cli");
      assert.equal(config.env.WECOM_CLI_CONFIG_DIR, "/test-user/.config/wecom-enterprise-cases");
      calls.push(args);
      return args[0] === "--version" ? "wecom-cli 1.2.0" : "authorized";
    },
    initialize: () => assert.fail("must preserve the existing authorization"),
  };
  for (const mode of ["status", "auth"])
    assert.deepEqual(runLocalWecom(mode, options), { status: "authorized", initialized: false, messagesSent: 0 });
  assert(calls.every((args) => args[0] === "--version" || args.join(" ") === "auth show --status"));
  assert.throws(() => runLocalWecom("send", options));
});

test("first authorization only invokes QR initialization and verifies the resulting status", () => {
  let authorized = false;
  let initialized = 0;
  const result = runLocalWecom("auth", {
    environment, home,
    execute: (_binary, args) => args[0] === "--version" ? "wecom-cli 1.2.0" : authorized ? "authorized" : "unauthorized",
    initialize: (binary, args) => {
      assert.equal(binary, "wecom-cli");
      assert.deepEqual(args, ["auth", "init", "--noninteractive"]);
      initialized++;
      authorized = true;
      return { status: 0 };
    },
  });
  assert.equal(initialized, 1);
  assert.deepEqual(result, { status: "authorized", initialized: true, messagesSent: 0 });
});
