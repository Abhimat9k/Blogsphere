const { Router } = require("express");
const Blog = require("../models/blog");
const Comment = require("../models/comment");
const multer = require("multer");
const path = require("path");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  return res.render("addBlog", { user: req.user });
});

router.get("/:id/edit", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).send("Blog not found");
  if (blog.createdBy.toString() !== req.user._id.toString())
    return res.status(403).send("Not authorized");
  res.render("editBlog", { user: req.user, blog });
});

router.put("/:id", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).send("Blog not found");
  if (blog.createdBy.toString() !== req.user._id.toString())
    return res.status(403).send("Not authorized");
  blog.title = title;
  blog.body = body;
  if (req.file) {
    blog.coverImageURL = `/uploads/${req.file.filename}`;
  }
  await blog.save();
  res.redirect(`/blog/${blog._id}`);
});

router.delete("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).send("Blog not found");
  if (blog.createdBy.toString() !== req.user._id.toString())
    return res.status(403).send("Not authorized");
  await Blog.deleteOne({ _id: req.params.id });
  res.redirect("/");
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );
  return res.render("blog", { user: req.user, blog, comments });
});

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const coverImageURL = req.file
    ? `/uploads/${req.file.filename}`
    : `/do/default-cover.jpg`;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL,
  });
  return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;
