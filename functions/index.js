const functions = require("firebase-functions");
const app = require("express")();
const FirebaseAuthMiddleWare = require("./util/FirebaseAuthMiddleWare");
const {
  getAllPosts,
  uploadPost,
  getAPost,
  commentOnPost,
  likePost,
  unlikePost,
  deletePost
} = require("./handlers/posts");
const {
  signup,
  signin,
  uploadProfileImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/user");

//POST ROUTE
app.get("/posts", getAllPosts);
app.post("/post", FirebaseAuthMiddleWare, uploadPost);
app.get("/post/:postId", getAPost);
app.delete("/posts/:postId", FirebaseAuthMiddleWare, deletePost);
app.get("/posts/:postId/like", FirebaseAuthMiddleWare, likePost);
app.get("/posts/:postId/unlike", FirebaseAuthMiddleWare, unlikePost);
app.post("/post/:postId/comment", FirebaseAuthMiddleWare, commentOnPost);

//USER ROUTE
app.post("/signup", signup);
app.post("/signin", signin);
app.post("/user/profilepicture", FirebaseAuthMiddleWare, uploadProfileImage);
app.post("/user", FirebaseAuthMiddleWare, addUserDetails);
app.get("/user", FirebaseAuthMiddleWare, getAuthenticatedUser);

exports.api = functions.region("europe-west1").https.onRequest(app);