export const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
};
