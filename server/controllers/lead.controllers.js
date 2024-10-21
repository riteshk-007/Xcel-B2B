import { prisma } from "../config/db.config.js";
import { createSlug } from "../helper/slug.js";
import { validateText } from "../helper/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateUniqueSlug = async (slug, name) => {
  let uniqueSlug = slug ? createSlug(slug) : createSlug(name);

  let existingSlug = await prisma.leads.findUnique({
    where: { slug: uniqueSlug },
  });

  let counter = 1;

  while (existingSlug) {
    uniqueSlug = `${createSlug(slug || name)}-${counter}`;

    existingSlug = await prisma.leads.findUnique({
      where: { slug: uniqueSlug },
    });

    counter++;
  }

  return uniqueSlug;
};

const create = async (leadData) => {
  const lead = await prisma.leads.create({ data: leadData });
  if (!lead) {
    throw new ApiError(500, "Failed to create lead");
  }
  return lead;
};

const update = async (slug, data) => {
  const lead = await prisma.leads.update({ where: { slug }, data });
  if (!lead) {
    throw new ApiError(500, "Failed to update lead");
  }
  return lead;
};

const findAll = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const leads = await prisma.leads.findMany({
    skip: offset,
    take: limit,
    include: { comments: true },
  });

  const totalLeads = await prisma.leads.count();
  const totalPages = Math.ceil(totalLeads / limit);

  return {
    leads,
    totalLeads,
    totalPages,
    currentPage: page,
  };
};

const findOne = async (slug) => {
  return await prisma.leads.findUnique({
    where: { slug },
    include: { comments: true },
  });
};

const remove = async (slug) => {
  const lead = await prisma.leads.findUnique({
    where: { slug },
    include: { comments: true },
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  await prisma.comments.deleteMany({
    where: { lead_id: lead.id },
  });

  return await prisma.leads.delete({ where: { slug } });
};

export const createLead = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;

  validateText(name);
  validateText(email);
  validateText(message);

  const slug = await generateUniqueSlug(null, name);

  const lead = await create({
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    message: message.trim(),
    slug,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Lead created successfully", lead));
});

export const updateLead = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { name, email, phone, message, type } = req.body;

  // Check if the lead exists
  const existingLead = await findOne(slug);
  if (!existingLead) {
    throw new ApiError(404, "Lead not found");
  }

  const updateFields = {};

  if (name) {
    validateText(name);
    updateFields.name = name.trim();
    updateFields.slug = await generateUniqueSlug(null, name);
  }
  if (email) {
    validateText(email);
    updateFields.email = email.trim();
  }
  if (phone) {
    updateFields.phone = phone.trim();
  }
  if (message) {
    validateText(message);
    updateFields.message = message.trim();
  }
  if (type) {
    updateFields.type = type;
  }

  const updatedLead = await update(slug, updateFields);

  return res
    .status(200)
    .json(new ApiResponse(200, "Lead updated successfully", updatedLead));
});

export const getAllLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await findAll(page, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, "Leads retrieved successfully", result));
});

export const getOneLead = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const lead = await findOne(slug);

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Lead retrieved successfully", lead));
});

export const deleteLead = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const lead = await findOne(slug);

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  await remove(slug);

  return res
    .status(200)
    .json(new ApiResponse(200, "Lead deleted successfully"));
});

export const searchLeads = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new ApiError(400, "Please provide a search query");
  }

  const leads = await prisma.leads.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { comments: true },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Leads retrieved successfully", leads));
});

export const recentLeads = asyncHandler(async (req, res) => {
  const leads = await prisma.leads.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      name: true,
      phone: true,
      email: true,
      comments: true,
    },
  });

  const transformedLeads = leads.map((lead) => ({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    commentsLength: lead.comments.length,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Recent leads retrieved successfully",
        transformedLeads
      )
    );
});

export const getLeadsLength = asyncHandler(async (req, res) => {
  const leads = await prisma.leads.count();

  return res
    .status(200)
    .json(new ApiResponse(200, "Total leads retrieved successfully", leads));
});
export const getLeadsLengthAndDate = asyncHandler(async (req, res) => {
  const leadsCount = await prisma.leads.count();
  const leads = await prisma.leads.findMany({
    select: {
      created_at: true,
    },
  });

  const creationDates = leads.map((lead) => lead.created_at.toDateString());

  return res.status(200).json(
    new ApiResponse(
      200,
      "Total leads and creation dates retrieved successfully",
      {
        leadsCount,
        creationDates,
      }
    )
  );
});
