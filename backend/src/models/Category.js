import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ""
  },
  icon: { type: String, default: "" },
  image: { type: String, default: "" },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  path: [{
    type: String
  }], // Path of category IDs for hierarchy
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  // SEO
  metaTitle: { type: String },
  metaDescription: { type: String },
  // Filtering
  filters: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["checkbox", "range", "select"],
      default: "checkbox"
    },
    options: [{ type: String }],
    min: { type: Number },
    max: { type: Number }
  }]
}, {
  timestamps: true
});

// Generate slug from name
categorySchema.statics.generateSlug = function (name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Get full category tree
categorySchema.statics.getTree = async function () {
  const categories = await this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 });

  const tree = [];
  const map = {};

  // First pass: create map
  categories.forEach(cat => {
    map[cat._id] = {
      ...cat.toObject(),
      children: []
    };
  });

  // Second pass: build tree
  categories.forEach(cat => {
    if (cat.parentCategory) {
      if (map[cat.parentCategory]) {
        map[cat.parentCategory].children.push(map[cat._id]);
      }
    } else {
      tree.push(map[cat._id]);
    }
  });

  return tree;
};

// Redundant index removed as slug has unique: true in field definition
// categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });

export const Category = mongoose.model("Category", categorySchema);

