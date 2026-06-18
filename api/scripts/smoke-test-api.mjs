const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function hasRequestId(payload) {
  return Boolean(payload && typeof payload.requestId === "string" && payload.requestId.length > 0);
}

function hasPaginationMeta(payload) {
  const meta = payload?.meta;
  return Boolean(
    meta &&
      Number.isInteger(meta.page) &&
      Number.isInteger(meta.limit) &&
      Number.isInteger(meta.total) &&
      Number.isInteger(meta.totalPages) &&
      typeof meta.hasNext === "boolean" &&
      typeof meta.hasPrev === "boolean",
  );
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, options);

  const contentType = response.headers.get("content-type") || "";
  let body;

  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = { raw: await response.text() };
  }

  return { response, body, url };
}

async function testHealth() {
  const { response, body, url } = await request("/health");
  assert(response.status === 200, `Expected 200 for ${url}, got ${response.status}`);
  assert(hasRequestId(body), "GET /health response missing requestId");
  console.log("PASS GET /health");
}

async function testJobsList() {
  const { response, body, url } = await request("/jobs?page=1&limit=10");
  assert(response.status === 200, `Expected 200 for ${url}, got ${response.status}`);
  assert(hasRequestId(body), "GET /jobs response missing requestId");
  assert(hasPaginationMeta(body), "GET /jobs response missing pagination metadata");
  console.log("PASS GET /jobs?page=1&limit=10");
}

async function testTasksList() {
  const { response, body, url } = await request("/tasks?page=1&limit=10");
  assert(response.status === 200, `Expected 200 for ${url}, got ${response.status}`);
  assert(hasRequestId(body), "GET /tasks response missing requestId");
  assert(hasPaginationMeta(body), "GET /tasks response missing pagination metadata");
  console.log("PASS GET /tasks?page=1&limit=10");
}

async function testAgents() {
  const { response, body, url } = await request("/agents");
  assert(response.status === 200, `Expected 200 for ${url}, got ${response.status}`);
  assert(hasRequestId(body), "GET /agents response missing requestId");
  console.log("PASS GET /agents");
}

async function testAudit() {
  const { response, body, url } = await request("/audit");
  assert(response.status === 200, `Expected 200 for ${url}, got ${response.status}`);
  assert(hasRequestId(body), "GET /audit response missing requestId");
  console.log("PASS GET /audit");
}

async function testJobsIdempotency() {
  const idempotencyKey = `smoke-job-${Date.now()}`;
  const payloadA = {
    clientName: "Smoke Test Client",
    title: "Smoke Test Batch",
    type: "cx",
    priority: "normal",
    taskCount: 5,
  };

  const first = await request("/jobs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(payloadA),
  });

  assert(first.response.status === 201, `Expected 201 for first POST /jobs, got ${first.response.status}`);
  assert(hasRequestId(first.body), "First POST /jobs response missing requestId");
  assert(first.body?.data?.id, "First POST /jobs response missing data.id");

  const firstJobId = first.body.data.id;

  const replay = await request("/jobs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(payloadA),
  });

  assert(replay.response.status === 200, `Expected 200 for idempotent replay, got ${replay.response.status}`);
  assert(hasRequestId(replay.body), "Replay POST /jobs response missing requestId");
  assert(replay.body?.data?.id === firstJobId, "Replay POST /jobs did not return same job id");
  assert(replay.body?.meta?.idempotentReplay === true, "Replay POST /jobs missing meta.idempotentReplay=true");

  const payloadB = {
    ...payloadA,
    title: "Changed Payload Should Conflict",
  };

  const conflict = await request("/jobs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(payloadB),
  });

  assert(conflict.response.status === 409, `Expected 409 for idempotency conflict, got ${conflict.response.status}`);
  assert(hasRequestId(conflict.body), "Conflict response missing requestId");
  assert(conflict.body?.error, "Conflict response missing structured error envelope");

  console.log("PASS POST /jobs idempotency checks");
}

async function testAssignTask() {
  const { response, body } = await request("/tasks/TASK-2002/assign", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ agentId: "AG-002" }),
  });

  assert(response.status === 200, `Expected 200 for POST /tasks/TASK-2002/assign, got ${response.status}`);
  assert(hasRequestId(body), "POST /tasks/:id/assign response missing requestId");
  assert(body?.data?.id === "TASK-2002", "Assign response missing TASK-2002");
  assert(body?.data?.assignedAgentId === "AG-002", "Task was not assigned to AG-002");

  console.log("PASS POST /tasks/TASK-2002/assign");
}

async function run() {
  console.log(`Running API smoke tests against ${BASE_URL}`);

  await testHealth();
  await testJobsList();
  await testTasksList();
  await testAgents();
  await testAudit();
  await testJobsIdempotency();
  await testAssignTask();

  console.log("ALL PASS: API smoke test completed successfully.");
}

run().catch((error) => {
  console.error("SMOKE TEST FAILED:", error.message);
  process.exitCode = 1;
});
