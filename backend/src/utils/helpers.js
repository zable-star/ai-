export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const successResponse = (data, message = null) => {
  const response = { success: true };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  return response;
};
