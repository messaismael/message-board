/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var ObjectId = require("mongodb").ObjectId;
var server = require("../server");

chai.use(chaiHttp);
let _id, thread_id, reply_id;

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      for (let i = 1; i <= 2; i++) {
        test("create new board", function(done) {
          chai
            .request(server)
            .post("/api/threads/test")
            .send({
              text: `test${i}`,
              delete_password: "test"
            })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              done();
            });
        });
      }
    });
    suite("GET", function() {
      test("get all threads on current board", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            _id = res.body[0]._id;
            thread_id = res.body[1]._id;
            assert.isArray(res.body);
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "_id");
            assert.isArray(res.body[0].replies);
            assert.property(res.body[0], "replies");
            done();
          });
      });
    });
    suite("DELETE", function() {
      test("delete thread and all his replies", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({
            thread_id: _id,
            delete_password: "test"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Success");
            done();
          });
      });
    });
    suite("PUT", function() {
      test("set reported", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send({
            report_id: new ObjectId(_id)
          })
          .end(function(err, res) {
            assert.equal(res.text, "This thread not found");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("Create a new reply", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            test: "reply",
            delete_password: "reply",
            thread_id: thread_id
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("get all replies of current thread", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({
            thread_id: thread_id
          })
          .end(function(err, res) {
            reply_id = res.body.replies[0]._id;
            thread_id = res.body._id;
            assert.property(res.body, "replycount");
            assert.property(res.body, "_id");
            assert.property(res.body, "text");
            assert.property(res.body, "created_on");
            assert.property(res.body, "replies");
            assert.isArray(res.body.replies);
            done();
          });
      });
    });

    suite("PUT", function() {
      test("report a reply", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .send({
            reply_id: new ObjectId(reply_id),
            thread_id: new ObjectId(thread_id)
          })
          .end(function(err, res) {
            assert.equal(res.text, "Reported");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("delete a reply", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: thread_id,
            reply_id: reply_id,
            delete_password: "reply"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Delete");
            done();
          });
      });
    });
  });
});
