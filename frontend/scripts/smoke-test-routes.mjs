const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const uiRoutes = ["/", "/jobs", "/tasks", "/agents", "/quality", "/payouts", "/audit"];
const apiRoutes = ["/api/jobs", "/api/tasks", "/api/agents", "/api/audit"];

const legacyPattern =
  /PEAK-Lite|peak-lite|learner|learners|instructor|instructors|education/i;

async function checkUiRoute(route) {
  const res = await fetch(`${baseUrl}${route}`);
  const text = await res.text();

  const hasGigOpsLite = /GigOps Lite/i.test(text);
  const hasLegacy = legacyPattern.test(text);

  return {
    route,
    kind: "ui",
    status: res.status,
    pass: res.status === 200 && !hasLegacy,
    hasGigOpsLite,
    hasLegacy,
    contentType: res.headers.get("content-type") || "",
  };
}

async function checkApiRoute(route) {
  const res = await fetch(`${baseUrl}${route}`);
  const contentType = res.headers.get("content-type") || "";
  let jsonOk = false;

  try {
    await res.json();
    jsonOk = true;
  } catch {
    jsonOk = false;
  }

  return {
    route,
    kind: "api",
    status: res.status,
    pass:
      res.status === 200 &&
      /application\/json/i.test(contentType) &&
      jsonOk,
    jsonOk,
    contentType,
  };
}

async function run() {
  console.log(`Running smoke tests against: ${baseUrl}\n`);

  const uiResults = await Promise.all(uiRoutes.map(checkUiRoute));
  const apiResults = await Promise.all(apiRoutes.map(checkApiRoute));
  const results = [...uiResults, ...apiResults];

  for (const result of results) {
    if (result.kind === "ui") {
      console.log(
        `[UI] ${result.route} status=${result.status} pass=${result.pass} gigopsLite=${result.hasGigOpsLite} legacyTerms=${result.hasLegacy}`,
      );
    } else {
      console.log(
        `[API] ${result.route} status=${result.status} pass=${result.pass} json=${result.jsonOk} contentType=${result.contentType}`,
      );
    }
  }

  const hasFailures = results.some((result) => !result.pass);

  if (hasFailures) {
    console.error("\nSmoke test result: FAIL");
    process.exitCode = 1;
    return;
  }

  console.log("\nSmoke test result: PASS");
}

run().catch((error) => {
  console.error("Smoke test failed:", error);
  process.exitCode = 1;
});