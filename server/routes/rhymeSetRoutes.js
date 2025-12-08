const express = require("express");
const { getRhymeSetById } = require("../controllers/rhymeSetController");

const router = express.Router();

router.get("/:id", getRhymeSetById);

module.exports = router;
