/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var mongoose = require("mongoose");
var ObjectID = require("mongodb").ObjectID;

mongoose
  .connect(process.env.DATA_BASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => console.log("DB connection successful"))
  .catch(err => console.log(err));

let Schema = mongoose.Schema;

let ThreadSchema = new Schema({
  board: String,
  created_on: Date,
  bumped_on: Date,
  delete_password: String,
  text: String,
  replies: Array,
  replycount: Number,
  reported: Boolean
});
let Thread = mongoose.model("Thread", ThreadSchema);

let ReplySchema = new Schema({
  thread_id: String,
  created_on: Date,
  delete_password: String,
  text: String,
  reported: Boolean
});
let Reply = mongoose.model("Reply", ReplySchema);

module.exports = function(app) {
  app
    .route("/api/threads/:board")

    .get(async function(req, res) {
      let board = req.params.board;
      // find all Thread  with value 'board' in board field
      let result = await Thread.find({ board: board }).select(
        "-__v -delete_password -reported"
      );
      res.send(result);
    })
    .post(async function(req, res) {
      let board = req.params.board;
      let text = req.body.text;
      let password = req.body.delete_password;
      // registe new thread in Thread Model
      let doc = new Thread({
        board: board,
        created_on: new Date(),
        bumped_on: new Date(),
        delete_password: password,
        text: text,
        replies: [],
        replycount: 0,
        reported: false
      });

      await doc.save();
      // redirect to board page
      res.redirect(`/b/${board}`);
    })
    .put(async function(req, res) {
      let report_id = req.body.report_id;
      // find thread by _id
      let doc = await Thread.findById({ _id: report_id }).select("-__v");
      if (doc) {
        // set report field true
        doc.reported = true;
        await doc.save();
        res.send("Reported");
      } else {
        res.send("This thread not found");
      }
    })
    .delete(async function(req, res) {
      let thread_id = req.body.thread_id;
      let password = req.body.delete_password;

      let doc = await Thread.findById({ _id: thread_id }).select("-__v");
    
      if (!doc) {
        res.send("This thread not found");
      } else if (doc.delete_password === password) {
        await Thread.deleteOne({ _id: thread_id });
        await Reply.deleteMany({ thread_id: thread_id });
        res.send("Success");
      } else {
        res.send("Incorrect password");
      }
    });

  app
    .route("/api/replies/:board")
    .get(async function(req, res) {
      let thread_id = req.query.thread_id;
      // find Thread by _id
      let result = await Thread.findById({ _id: thread_id }).select(
        "-__v -delete_password -reported"
      );
      res.send(result);
    })
    .post(async function(req, res) {
      let board = req.params.board;
      let thread_id = req.body.thread_id;
      let text = req.body.text;
      let password = req.body.delete_password;

      let doc = new Reply({
        thread_id: thread_id,
        text: text,
        reported: false,
        created_on: new Date(),
        delete_password: password
      });
      await doc.save();
      // find correspondant thread
      let thread = await Thread.findById({ _id: thread_id }).select("-__v");
      // add reply to thread document
      thread.bumped_on = new Date();
      thread.replies.push(doc);
      thread.replycount++;
      await thread.save();

      res.redirect(`/b/${board}/${thread_id}`);
    })
    .put(async function(req, res) {
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let index;
      // find thread by _id
      let thread = await Thread.findById({ _id: thread_id }).select("-__v");
      let reply = await Reply.findById({ _id: reply_id }).select("-__v");
      // set report field true
      thread.replies.map((item, i) => {
        if (item._id === reply_id)
          // take index on correspondant reply
          index = i;
        reply.reported = true;
      });

      // set correspondant rely
      thread.replies.set(index, reply);
      await thread.save();
      await reply.save();
      res.send("Reported");
    })
    .delete(async function(req, res) {
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let password = req.body.delete_password;
      let index;
      // find correspondant thread
      let thread = await Thread.findById({ _id: thread_id }).select("-__v");
      // search correspondant reply
      let reply = await Reply.findById({ _id: reply_id }).select("-__v");
      thread.replies.map((item, i) => {
        if (
          reply.delete_password === password &&
          String(item._id) === reply_id
        ) {
          reply.text = "[deleted]";
          index = i;
        }
      });

      if (reply.text === "[deleted]" && index !== undefined) {
        thread.replies.set(index, reply);
        await thread.save();
        await reply.save();
        res.send("Delete");
      } else {
        res.send("Incorrect password");
      }
    });
};
