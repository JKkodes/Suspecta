export function validateConversationInput(req, res, next) {
  const { conversation } = req.body || {};

  if (!conversation || typeof conversation !== "string" || conversation.trim().length < 20) {
    return res.status(400).json({
      error: true,
      message: "Paste the full conversation (at least a few messages) before analyzing.",
    });
  }

  if (conversation.length > 20000) {
    return res.status(400).json({
      error: true,
      message: "That conversation is too long. Please paste a shorter excerpt (under ~20,000 characters).",
    });
  }

  next();
}

export function validateUrlInput(req, res, next) {
  const { url } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: true, message: "Provide a URL to analyze." });
  }

  const candidate = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  try {
    // eslint-disable-next-line no-new
    new URL(candidate);
  } catch {
    return res.status(400).json({ error: true, message: "That doesn't look like a valid URL." });
  }

  req.body.url = candidate;
  next();
}
