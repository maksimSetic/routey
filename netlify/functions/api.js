import { locations, orders, vehicles } from "../../server/dist/data.js";
import { optimize, validatePlan } from "../../server/dist/optimizer.js";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
};

function getApiResponse(method, path) {
  const normalizedPath =
    path
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/^\/\.netlify\/functions\/api/, "")
      .replace(/^\/api/, "")
      .replace(/\/+$/, "") || "/";

  if (method === "OPTIONS") {
    return { status: 204, body: "" };
  }

  if (normalizedPath === "/health" && method === "GET") {
    return { status: 200, body: JSON.stringify({ status: "ok" }) };
  }

  if (normalizedPath === "/data" && method === "GET") {
    return {
      status: 200,
      body: JSON.stringify({ locations, orders, vehicles }),
    };
  }

  if (normalizedPath === "/optimize" && method === "POST") {
    const result = optimize();
    const validation = result.plans.flatMap((plan) =>
      validatePlan(plan).map((error) => `${plan.vehicle.name}: ${error}`),
    );

    return {
      status: 200,
      body: JSON.stringify({
        ...result,
        warnings: [...result.warnings, ...validation],
        valid: validation.length === 0,
      }),
    };
  }

  return {
    status: 404,
    body: JSON.stringify({ error: "API route not found" }),
  };
}

// Netlify Functions v1 / AWS-style handler.
export const handler = async (event) => {
  const response = getApiResponse(event.httpMethod || "GET", event.path || "/");

  return {
    statusCode: response.status,
    headers: jsonHeaders,
    body: response.body,
  };
};

// Netlify Functions v2 / Web Request handler.
export default async (request) => {
  const url = new URL(request.url);
  const response = getApiResponse(request.method || "GET", url.pathname);

  return new Response(response.body, {
    status: response.status,
    headers: jsonHeaders,
  });
};
