export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error("[ScamLens] Unhandled error:", err);
  }
  res.status(status).json({
    error: true,
    message: err.message || "Something went wrong on our end. Please try again.",
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: true, message: "That endpoint doesn't exist." });
}
