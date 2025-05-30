"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePagination = exports.sendForbidden = exports.sendUnauthorized = exports.sendNotFound = exports.sendValidationError = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, message, data, statusCode = 200, pagination) => {
    const response = {
        success: true,
        message,
        data,
        pagination
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500, error) => {
    const response = {
        success: false,
        message,
        error
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendValidationError = (res, errors) => {
    const response = {
        success: false,
        message: 'Validation failed',
        error: errors.map(err => err.msg).join(', ')
    };
    res.status(400).json(response);
};
exports.sendValidationError = sendValidationError;
const sendNotFound = (res, resource = 'Resource') => {
    (0, exports.sendError)(res, `${resource} not found`, 404);
};
exports.sendNotFound = sendNotFound;
const sendUnauthorized = (res, message = 'Unauthorized') => {
    (0, exports.sendError)(res, message, 401);
};
exports.sendUnauthorized = sendUnauthorized;
const sendForbidden = (res, message = 'Forbidden') => {
    (0, exports.sendError)(res, message, 403);
};
exports.sendForbidden = sendForbidden;
const calculatePagination = (page, limit, total) => {
    const pages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
    };
};
exports.calculatePagination = calculatePagination;
//# sourceMappingURL=response.js.map