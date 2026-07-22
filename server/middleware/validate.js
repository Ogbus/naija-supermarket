const { validationResult } = require('express-validator');

// Runs after a chain of express-validator checks on a route. Collects any
// failures and responds with a 400 before the request ever reaches the
// controller, so controllers can trust req.body/req.params are well-formed.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
